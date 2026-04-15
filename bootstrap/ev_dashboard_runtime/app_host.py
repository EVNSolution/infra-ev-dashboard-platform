from __future__ import annotations

import json
import subprocess
from pathlib import Path

from ev_dashboard_runtime.common import require_env, run, run_output, write_text

BASE_DIR = Path("/opt/ev-dashboard")
RUNTIME_IMAGES_PATH = BASE_DIR / "runtime-images.json"
SERVICE_ENV_DIR = BASE_DIR / "service-env"


def verify_app() -> int:
    return reconcile_app()


def reconcile_app() -> int:
    region = require_env("AWS_REGION")
    image_map_param = require_env("IMAGE_MAP_PARAM")
    service_manifest_path = Path(require_env("SERVICE_MANIFEST_PATH"))
    service_secret_map_secret_arn = require_env("SERVICE_SECRET_MAP_SECRET_ARN")

    image_map_json = run_output(
        [
            "aws",
            "ssm",
            "get-parameter",
            "--name",
            image_map_param,
            "--with-decryption",
            "--region",
            region,
            "--query",
            "Parameter.Value",
            "--output",
            "text",
        ]
    )
    write_text(RUNTIME_IMAGES_PATH, f"{image_map_json}\n")
    image_map = json.loads(image_map_json)
    secret_map_json = run_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            service_secret_map_secret_arn,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ]
    )
    secret_map = json.loads(secret_map_json)

    services = _load_runtime_services(
        region=region,
        image_map=image_map,
        service_manifest_path=service_manifest_path,
        secret_map=secret_map,
    )
    registries = sorted({service["image"].split("/", 1)[0] for service in services})
    secret_cache: dict[str, str] = {}

    for registry in registries:
        password = run_output(["aws", "ecr", "get-login-password", "--region", region])
        run(["docker", "login", "--username", "AWS", "--password-stdin", registry], input_text=password)

    network_exists = True
    try:
        run(["docker", "network", "inspect", "ev-dashboard"])
    except subprocess.CalledProcessError:  # type: ignore[name-defined]
        network_exists = False

    if not network_exists:
        run(["docker", "network", "create", "ev-dashboard"])

    for service in services:
        _remove_container(service["container_name"])

    for service in services:
        env_path = _write_service_env(service=service, region=region, secret_cache=secret_cache)
        run(["docker", "pull", service["image"]])
        command = [
            "docker",
            "run",
            "-d",
            "--name",
            service["container_name"],
            "--restart",
            "unless-stopped",
            "--network",
            "ev-dashboard",
        ]
        if env_path is not None:
            command.extend(["--env-file", str(env_path)])
        if service.get("container_port") and service.get("host_port"):
            command.extend(["-p", f"{service['host_port']}:{service['container_port']}"])
        command.append(service["image"])
        run(command)

    return 0


def _load_runtime_services(
    *, region: str, image_map: dict[str, str], service_manifest_path: Path, secret_map: dict[str, str]
) -> list[dict[str, object]]:
    service_definitions = json.loads(service_manifest_path.read_text(encoding="utf-8"))
    services: list[dict[str, object]] = []

    for service_definition in service_definitions:
        if not service_definition.get("enabled", False):
            continue

        service_id = str(service_definition["id"])
        image_map_key = str(service_definition["imageMapKey"])
        image = image_map.get(image_map_key)
        if not image:
            raise RuntimeError(f"{image_map_key} image is missing from the runtime image map")

        environment = {
            str(key): str(value)
            for key, value in (service_definition.get("environment", {}) or {}).items()
        }
        secret_keys = [str(value) for value in service_definition.get("secretKeys", [])]
        secrets = {
            key: secret_map[f"{service_id}__{key}"]
            for key in secret_keys
        }
        services.append(
            {
                "id": service_id,
                "region": region,
                "image": image,
                "container_name": str(service_definition["containerName"]),
                "container_port": _parse_optional_int(service_definition.get("containerPort")),
                "host_port": _parse_optional_int(service_definition.get("hostPort")),
                "environment": environment,
                "secret_arns": secrets,
            }
        )

    return services

def _parse_optional_int(value: object) -> int | None:
    if value in ("", None):
        return None
    return int(value)


def _write_service_env(
    *, service: dict[str, object], region: str, secret_cache: dict[str, str]
) -> Path | None:
    environment = {str(key): str(value) for key, value in (service.get("environment") or {}).items()}
    secret_arns = {str(key): str(value) for key, value in (service.get("secret_arns") or {}).items()}

    if not environment and not secret_arns:
        return None

    lines = [f"{key}={value}" for key, value in environment.items()]
    for key, secret_arn in secret_arns.items():
        lines.append(f"{key}={_resolve_secret(secret_arn=secret_arn, region=region, cache=secret_cache)}")

    env_path = SERVICE_ENV_DIR / f"{service['container_name']}.env"
    write_text(env_path, "\n".join(lines) + "\n")
    return env_path


def _resolve_secret(*, secret_arn: str, region: str, cache: dict[str, str]) -> str:
    if secret_arn in cache:
        return cache[secret_arn]

    secret_value = run_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            secret_arn,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ]
    )
    cache[secret_arn] = secret_value
    return secret_value


def _remove_container(container_name: str) -> None:
    try:
        run(["docker", "rm", "-f", container_name])
    except Exception:
        pass
