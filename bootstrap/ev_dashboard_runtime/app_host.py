from __future__ import annotations

import fcntl
import hashlib
import json
import subprocess
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from ev_dashboard_runtime.common import optional_env, require_env, run, run_output, write_text

BASE_DIR = Path("/opt/ev-dashboard")
RUNTIME_IMAGES_PATH = BASE_DIR / "runtime-images.json"
SERVICE_ENV_DIR = BASE_DIR / "service-env"
RELEASE_MANIFEST_PATH = BASE_DIR / "release-manifest.json"
RECONCILE_LOCK_PATH = BASE_DIR / "app-reconcile.lock"
STATE_DIR_NAME = "state"
CURRENT_STATE_FILE_NAME = "current-state.json"
LAST_KNOWN_GOOD_FILE_NAME = "last-known-good.json"
RELEASES_DIR_NAME = "releases"


def verify_app() -> int:
    return reconcile_app()


def assert_app_release_ready() -> int:
    with _reconcile_lock():
        current_state = _load_current_state()
        if current_state.get("repairRequired"):
            reason = str(current_state.get("repairRequiredReason", "")).strip()
            if reason:
                raise RuntimeError(f"app host requires repair before the next release can start: {reason}")
            raise RuntimeError("app host requires repair before the next release can start")
        drift_report = _detect_runtime_drift(current_state)
        if drift_report is not None:
            if _can_attempt_limited_self_heal(current_state=current_state, drift_report=drift_report):
                try:
                    _attempt_limited_self_heal(current_state=current_state, drift_report=drift_report)
                    current_state = _load_current_state()
                    drift_report = _detect_runtime_drift(current_state)
                    if drift_report is None:
                        return 0
                except Exception as error:
                    current_state = _load_current_state()
                    current_state["lastSelfHealFailure"] = {
                        "detectedAt": _timestamp_now(),
                        "reason": str(error),
                    }
            current_state["repairRequired"] = True
            current_state["repairRequiredReason"] = "runtime drift detected"
            current_state["lastDetectedDrift"] = drift_report
            current_state["updatedAt"] = _timestamp_now()
            _write_json_atomic(_current_state_path(), current_state)
            raise RuntimeError("runtime drift detected; repair is required before the next release can start")
    return 0


def finalize_app_release(release_id: str) -> int:
    if not release_id.strip():
        raise RuntimeError("release_id is required")

    with _reconcile_lock():
        journal = _require_release_journal(release_id)
        _assert_release_status(journal, allowed_statuses={"running"})
        if not journal.get("waves"):
            raise RuntimeError(f"{release_id} has no recorded waves to finalize")
        if any(wave.get("status") != "applied" for wave in journal.get("waves", [])):
            raise RuntimeError(f"{release_id} cannot be finalized before every wave is applied")
        journal["status"] = "succeeded"
        journal["completedAt"] = _timestamp_now()
        journal["updatedAt"] = journal["completedAt"]
        _write_json_atomic(_release_journal_path(release_id), journal)

        current_state = _load_current_state()
        current_state["repairRequired"] = False
        current_state.pop("repairRequiredReason", None)
        _write_json_atomic(_current_state_path(), current_state)
        last_known_good = {
            **current_state,
            "releaseId": release_id,
            "capturedAt": _timestamp_now(),
        }
        _write_json_atomic(_last_known_good_path(), last_known_good)
    return 0


def mark_app_release_failed(release_id: str, reason: str) -> int:
    if not release_id.strip():
        raise RuntimeError("release_id is required")

    with _reconcile_lock():
        journal = _require_release_journal(release_id)
        _assert_release_status(journal, allowed_statuses={"running"})
        journal["status"] = "failed"
        journal["failedAt"] = _timestamp_now()
        journal["updatedAt"] = journal["failedAt"]
        journal["failureReason"] = reason.strip() or "unknown failure"
        _write_json_atomic(_release_journal_path(release_id), journal)
    return 0


def rollback_app_release(release_id: str, reason: str = "", through_wave: int | None = None) -> int:
    if not release_id.strip():
        raise RuntimeError("release_id is required")

    with _reconcile_lock():
        journal = _require_release_journal(release_id)
        _assert_release_status(journal, allowed_statuses={"running", "failed"})
        if reason.strip():
            journal["failureReason"] = reason.strip()
        if journal.get("status") == "running":
            journal["status"] = "failed"
            journal["failedAt"] = _timestamp_now()
        journal["updatedAt"] = _timestamp_now()
        _write_json_atomic(_release_journal_path(release_id), journal)
        rollback_plan = journal.get("rollbackPlan")
        if not isinstance(rollback_plan, dict):
            raise RuntimeError(f"{release_id} does not have a rollback plan")

        rollback_waves = _build_rollback_waves(journal=journal, rollback_plan=rollback_plan, through_wave=through_wave)
        if not rollback_waves:
            raise RuntimeError(f"{release_id} has no rollback waves to apply")

        runtime = _load_runtime_context()
        try:
            for rollback_wave in rollback_waves:
                rollback_manifest = {
                    "releaseId": str(rollback_plan["releaseId"]),
                    "wave": rollback_wave["wave"],
                    "waveLabel": rollback_wave.get("label", ""),
                    "services": rollback_wave["services"],
                }
                _apply_release_manifest(
                    runtime=runtime,
                    release_manifest=rollback_manifest,
                    environment=runtime["environment"],
                    record_release=False,
                )
                _mark_release_wave_rolled_back(release_id, rollback_wave["wave"])

            journal = _require_release_journal(release_id)
            journal["status"] = "rolled_back"
            journal["rolledBackAt"] = _timestamp_now()
            journal["updatedAt"] = journal["rolledBackAt"]
            _write_json_atomic(_release_journal_path(release_id), journal)

            current_state = _load_current_state()
            current_state["repairRequired"] = False
            current_state.pop("repairRequiredReason", None)
            current_state["updatedAt"] = _timestamp_now()
            _write_json_atomic(_current_state_path(), current_state)
            return 0
        except Exception as error:
            current_state = _load_current_state()
            current_state["repairRequired"] = True
            current_state["repairRequiredReason"] = str(error)
            current_state["updatedAt"] = _timestamp_now()
            _write_json_atomic(_current_state_path(), current_state)

            journal = _require_release_journal(release_id)
            journal["status"] = "failed"
            journal["rollbackFailedAt"] = _timestamp_now()
            journal["rollbackFailureReason"] = str(error)
            journal["updatedAt"] = journal["rollbackFailedAt"]
            _write_json_atomic(_release_journal_path(release_id), journal)
            raise


def reconcile_app() -> int:
    with _reconcile_lock():
        return _reconcile_app_locked()


def _reconcile_app_locked() -> int:
    runtime = _load_runtime_context()
    release_manifest = _load_release_manifest(optional_env("RELEASE_MANIFEST_JSON"))
    return _apply_release_manifest(
        runtime=runtime,
        release_manifest=release_manifest,
        environment=str(runtime["environment"]),
        record_release=True,
    )


def _load_runtime_context() -> dict[str, object]:
    region = require_env("AWS_REGION")
    image_map_param = require_env("IMAGE_MAP_PARAM")
    service_manifest_secret_arn = require_env("SERVICE_MANIFEST_SECRET_ARN")
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
    image_map = json.loads(image_map_json)
    current_image_map = _load_current_runtime_images(image_map)
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
    service_manifest_json = run_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            service_manifest_secret_arn,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ]
    )
    service_manifest = json.loads(service_manifest_json)
    service_definitions = _load_service_definitions(
        region=region,
        service_manifest=service_manifest,
        secret_map=secret_map,
    )
    return {
        "region": region,
        "base_image_map": image_map,
        "current_image_map": current_image_map,
        "service_definitions": service_definitions,
        "environment": optional_env("DEPLOY_ENVIRONMENT") or "unknown",
    }


def _apply_release_manifest(
    *,
    runtime: dict[str, object],
    release_manifest: dict[str, object] | None,
    environment: str,
    record_release: bool,
) -> int:
    service_definitions = runtime["service_definitions"]
    deployment = _build_reconcile_plan(
        region=str(runtime["region"]),
        base_image_map=dict(runtime["base_image_map"]),
        current_image_map=dict(runtime["current_image_map"]),
        service_definitions=service_definitions,
        release_manifest=release_manifest,
    )
    before_snapshot = _build_before_snapshot(
        service_definitions=service_definitions,
        current_image_map=dict(runtime["current_image_map"]),
        release_manifest=release_manifest,
    )
    if record_release and release_manifest is not None:
        _record_release_started(release_manifest=release_manifest, before_snapshot=before_snapshot)

    registries = sorted({service["image"].split("/", 1)[0] for service in deployment["deploy_services"]})
    secret_cache: dict[str, str] = {}

    try:
        for registry in registries:
            password = run_output(["aws", "ecr", "get-login-password", "--region", str(runtime["region"])])
            run(["docker", "login", "--username", "AWS", "--password-stdin", registry], input_text=password)

        if deployment["deploy_services"]:
            _ensure_network()
            for service in deployment["deploy_services"]:
                run(["docker", "pull", service["image"]])

        for service_definition in deployment["remove_services"]:
            _remove_container(service_definition["container_name"])
            _remove_service_env(service_definition["container_name"])

        for service in deployment["deploy_services"]:
            env_path, env_contents = _write_service_env(
                service=service,
                region=str(runtime["region"]),
                secret_cache=secret_cache,
            )
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
            service["rendered_env_contents"] = env_contents

        write_text(RUNTIME_IMAGES_PATH, f"{json.dumps(deployment['next_image_map'], sort_keys=True)}\n")
        _update_current_state(
            environment=environment,
            deploy_services=deployment["deploy_services"],
            remove_services=deployment["remove_services"],
        )
        runtime["current_image_map"] = dict(deployment["next_image_map"])
        if record_release and release_manifest is not None:
            _mark_release_wave_applied(release_manifest)
        return 0
    except Exception as error:
        if record_release and release_manifest is not None:
            _mark_release_failed(release_manifest, str(error))
        raise


def _load_service_definitions(
    *, region: str, service_manifest: list[dict[str, object]], secret_map: dict[str, str]
) -> list[dict[str, object]]:
    services: list[dict[str, object]] = []

    for service_definition in service_manifest:
        service_id = str(service_definition["id"])
        image_map_key = str(service_definition["imageMapKey"])
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
                "service_name": image_map_key,
                "region": region,
                "enabled": bool(service_definition.get("enabled", False)),
                "image_map_key": image_map_key,
                "container_name": str(service_definition["containerName"]),
                "container_port": _parse_optional_int(service_definition.get("containerPort")),
                "host_port": _parse_optional_int(service_definition.get("hostPort")),
                "environment": environment,
                "secret_arns": secrets,
            }
        )

    return services


def _build_runtime_service(
    *,
    service_name: str,
    image_uri: str,
    runtime_spec: dict[str, object],
) -> dict[str, object]:
    normalized_runtime_spec = _normalize_runtime_spec(runtime_spec, service_name=service_name)
    image = image_uri
    if not image:
        raise RuntimeError(f"{service_name} image is missing from the runtime image map")

    return {
        "service_name": service_name,
        "image_map_key": service_name,
        "container_name": normalized_runtime_spec["container_name"],
        "container_port": normalized_runtime_spec["container_port"],
        "host_port": normalized_runtime_spec["host_port"],
        "environment": normalized_runtime_spec["environment"],
        "secret_arns": normalized_runtime_spec["secret_arns"],
        "image": image,
    }


def _build_reconcile_plan(
    *,
    region: str,
    base_image_map: dict[str, str],
    current_image_map: dict[str, str],
    service_definitions: list[dict[str, object]],
    release_manifest: dict[str, object] | None,
) -> dict[str, object]:
    definitions_by_service_name = {
        str(service_definition["service_name"]): service_definition for service_definition in service_definitions
    }

    if release_manifest is None:
        enabled_services = [
            _build_runtime_service(
                service_name=str(service_definition["service_name"]),
                image_uri=str(base_image_map[str(service_definition["image_map_key"])]),
                runtime_spec=_runtime_spec_from_service_definition(service_definition),
            )
            for service_definition in service_definitions
            if service_definition["enabled"]
        ]
        return {
            "deploy_services": enabled_services,
            "remove_services": service_definitions,
            "next_image_map": dict(base_image_map),
        }

    next_image_map = dict(current_image_map)
    deploy_services: list[dict[str, object]] = []
    remove_services: list[dict[str, object]] = []
    remove_service_names: set[str] = set()

    for release_service in release_manifest["services"]:
        service_name = str(release_service["service"])
        service_definition = definitions_by_service_name.get(service_name)
        runtime_spec_override = release_service.get("runtimeSpec")
        if service_definition is None and runtime_spec_override is None:
            raise RuntimeError(f"{service_name} does not exist in the app host runtime manifest")

        action = str(release_service["action"])
        if action == "remove":
            next_image_map.pop(service_name, None)
            if service_definition is not None and service_name not in remove_service_names:
                remove_services.append(service_definition)
                remove_service_names.add(service_name)
            continue

        if runtime_spec_override is None and not service_definition["enabled"]:
            raise RuntimeError(f"{service_name} is disabled in the app host runtime manifest")

        image_uri = str(release_service["imageUri"])
        next_image_map[service_name] = image_uri
        if service_definition is not None and service_name not in remove_service_names:
            remove_services.append(service_definition)
            remove_service_names.add(service_name)
        runtime_spec = (
            runtime_spec_override
            if runtime_spec_override is not None
            else _runtime_spec_from_service_definition(service_definition)
        )
        deploy_services.append(
            _build_runtime_service(
                service_name=service_name,
                image_uri=image_uri,
                runtime_spec=runtime_spec,
            )
        )

    return {
        "deploy_services": deploy_services,
        "remove_services": remove_services,
        "next_image_map": next_image_map,
    }

def _parse_optional_int(value: object) -> int | None:
    if value in ("", None):
        return None
    return int(value)


def _write_service_env(
    *, service: dict[str, object], region: str, secret_cache: dict[str, str]
) -> tuple[Path | None, str | None]:
    env_contents = _render_service_env_contents(service=service, region=region, secret_cache=secret_cache)
    if env_contents is None:
        return None, None

    env_path = SERVICE_ENV_DIR / f"{service['container_name']}.env"
    write_text(env_path, env_contents)
    return env_path, env_contents


def _render_service_env_contents(
    *, service: dict[str, object], region: str, secret_cache: dict[str, str]
) -> str | None:
    environment = {str(key): str(value) for key, value in (service.get("environment") or {}).items()}
    secret_arns = {str(key): str(value) for key, value in (service.get("secret_arns") or {}).items()}

    if not environment and not secret_arns:
        return None

    lines = [f"{key}={value}" for key, value in environment.items()]
    for key, secret_arn in secret_arns.items():
        lines.append(f"{key}={_resolve_secret(secret_arn=secret_arn, region=region, cache=secret_cache)}")

    return "\n".join(lines) + "\n"


def _load_current_runtime_images(default_image_map: dict[str, str]) -> dict[str, str]:
    if not RUNTIME_IMAGES_PATH.exists():
        return dict(default_image_map)

    try:
        raw_contents = RUNTIME_IMAGES_PATH.read_text(encoding="utf8").strip()
        if not raw_contents:
            return dict(default_image_map)
        parsed = json.loads(raw_contents)
        if isinstance(parsed, dict):
            return {str(key): str(value) for key, value in parsed.items()}
    except Exception:
        pass

    return dict(default_image_map)


def _load_release_manifest(raw_manifest: str) -> dict[str, object] | None:
    if not raw_manifest and RELEASE_MANIFEST_PATH.exists():
        raw_manifest = RELEASE_MANIFEST_PATH.read_text(encoding="utf8").strip()

    if not raw_manifest:
        return None

    parsed = json.loads(raw_manifest)
    if not isinstance(parsed, dict):
        raise RuntimeError("RELEASE_MANIFEST_JSON must be a JSON object")

    services = parsed.get("services")
    if not isinstance(services, list):
        raise RuntimeError("RELEASE_MANIFEST_JSON must include a services list")

    normalized_services: list[dict[str, object]] = []
    for service in services:
        if not isinstance(service, dict):
            raise RuntimeError("RELEASE_MANIFEST_JSON services entries must be objects")
        service_name = str(service.get("service", "")).strip()
        action = str(service.get("action", "")).strip()
        if not service_name:
            raise RuntimeError("RELEASE_MANIFEST_JSON services entries must include service")
        if action not in {"deploy", "remove"}:
            raise RuntimeError(f"{service_name} must use action deploy or remove")
        normalized_service = {
            "service": service_name,
            "action": action,
        }
        if action == "deploy":
            image_uri = str(service.get("imageUri", "")).strip()
            if not image_uri:
                raise RuntimeError(f"{service_name} deploy action requires imageUri")
            normalized_service["imageUri"] = image_uri
            if "runtimeSpec" in service:
                normalized_service["runtimeSpec"] = _normalize_runtime_spec(
                    service["runtimeSpec"],
                    service_name=service_name,
                )
        normalized_services.append(normalized_service)

    return {
        "releaseId": str(parsed.get("releaseId", "")).strip(),
        "wave": _parse_optional_int(parsed.get("wave")),
        "waveLabel": str(parsed.get("waveLabel", "")).strip(),
        "services": normalized_services,
    }


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


def _remove_service_env(container_name: str) -> None:
    env_path = SERVICE_ENV_DIR / f"{container_name}.env"
    try:
        env_path.unlink()
    except FileNotFoundError:
        pass


def _ensure_network() -> None:
    network_exists = True
    try:
        run(["docker", "network", "inspect", "ev-dashboard"])
    except subprocess.CalledProcessError:
        network_exists = False

    if not network_exists:
        run(["docker", "network", "create", "ev-dashboard"])


def _build_before_snapshot(
    *,
    service_definitions: list[dict[str, object]],
    current_image_map: dict[str, str],
    release_manifest: dict[str, object] | None,
) -> dict[str, object]:
    if release_manifest is None:
        return {"services": {}}

    definitions_by_service_name = {
        str(service_definition["service_name"]): service_definition for service_definition in service_definitions
    }
    current_state = _load_current_state()
    current_services = current_state.get("services", {})
    snapshot_services: dict[str, object] = {}

    for release_service in release_manifest["services"]:
        service_name = str(release_service["service"])
        if service_name in current_services:
            snapshot_services[service_name] = current_services[service_name]
            continue

        service_definition = definitions_by_service_name[service_name]
        image_uri = current_image_map.get(service_name)
        if image_uri:
            snapshot_services[service_name] = _build_state_entry(
                service=_build_runtime_service(
                    service_name=service_name,
                    image_uri=image_uri,
                    runtime_spec=_runtime_spec_from_service_definition(service_definition),
                ),
                environment="unknown",
                image_uri=image_uri,
                rendered_env_contents=None,
                timestamp=_timestamp_now(),
            )
        else:
            snapshot_services[service_name] = {
                "exists": False,
                "serviceName": service_name,
                "containerName": service_definition["container_name"],
                "updatedAt": _timestamp_now(),
            }

    return {"services": snapshot_services}


def _update_current_state(
    *,
    environment: str,
    deploy_services: list[dict[str, object]],
    remove_services: list[dict[str, object]],
) -> None:
    current_state = _load_current_state()
    services = current_state.setdefault("services", {})
    timestamp = _timestamp_now()

    for service_definition in remove_services:
        services.pop(str(service_definition["service_name"]), None)

    for service in deploy_services:
        services[str(service["service_name"])] = _build_state_entry(
            service=service,
            environment=environment,
            image_uri=str(service["image"]),
            rendered_env_contents=service.get("rendered_env_contents"),
            timestamp=timestamp,
        )

    current_state["environment"] = environment
    current_state["updatedAt"] = timestamp
    _write_json_atomic(_current_state_path(), current_state)


def _build_state_entry(
    *,
    service: dict[str, object],
    environment: str,
    image_uri: str,
    rendered_env_contents: str | None,
    timestamp: str,
) -> dict[str, object]:
    runtime_spec = {
        "containerName": service["container_name"],
        "containerPort": service.get("container_port"),
        "hostPort": service.get("host_port"),
        "environment": service.get("environment") or {},
        "secretArns": service.get("secret_arns") or {},
    }
    return {
        "exists": True,
        "environment": environment,
        "serviceName": service["service_name"],
        "imageUri": image_uri,
        "imageDigest": _resolve_image_digest(image_uri),
        "containerName": service["container_name"],
        "containerPort": service.get("container_port"),
        "hostPort": service.get("host_port"),
        "runtimeSpec": runtime_spec,
        "envHash": _sha256_text(rendered_env_contents) if rendered_env_contents is not None else None,
        "specHash": _sha256_json({"imageUri": image_uri, **runtime_spec}),
        "updatedAt": timestamp,
        "lastHealthyAt": timestamp,
    }


def _record_release_started(*, release_manifest: dict[str, object], before_snapshot: dict[str, object]) -> None:
    release_id = str(release_manifest["releaseId"])
    journal = _load_release_journal(release_id)
    if not journal:
        journal = {
            "releaseId": release_id,
            "startedAt": _timestamp_now(),
            "status": "running",
            "targetManifest": {
                "releaseId": release_id,
                "services": {},
            },
            "before": {
                "services": {},
            },
            "waves": [],
        }
    elif journal.get("status") in {"failed", "succeeded", "rolled_back"}:
        raise RuntimeError(f"{release_id} is already in terminal state {journal.get('status')}")

    current_state = _load_current_state()
    if current_state.get("repairRequired"):
        raise RuntimeError("app host requires repair before the next release can start")

    target_services = journal["targetManifest"]["services"]
    for service in release_manifest["services"]:
        target_services[str(service["service"])] = {
            "action": service["action"],
            **({"imageUri": service["imageUri"]} if service.get("imageUri") else {}),
            **({"runtimeSpec": service["runtimeSpec"]} if service.get("runtimeSpec") else {}),
        }

    before_services = journal["before"]["services"]
    for service_name, state in before_snapshot["services"].items():
        before_services.setdefault(service_name, state)

    rollback_services = _build_rollback_services(before_snapshot, release_manifest)

    rollback_plan = journal.get("rollbackPlan")
    if not isinstance(rollback_plan, dict):
        rollback_plan = {
            "releaseId": f"{release_id}-rollback",
            "direction": "rollback",
            "waves": [],
        }
        journal["rollbackPlan"] = rollback_plan

    rollback_plan["releaseId"] = f"{release_id}-rollback"
    rollback_plan["direction"] = "rollback"
    rollback_waves = rollback_plan.setdefault("waves", [])
    wave_number = release_manifest.get("wave")
    wave_label = release_manifest.get("waveLabel")
    if wave_number is not None:
        existing_rollback_wave = next((wave for wave in rollback_waves if wave["wave"] == wave_number), None)
        rollback_wave_payload = {
            "wave": wave_number,
            "label": wave_label,
            "services": rollback_services,
        }
        if existing_rollback_wave is None:
            rollback_waves.append(rollback_wave_payload)
        else:
            existing_rollback_wave.update(rollback_wave_payload)

    if wave_number is not None:
        existing_wave = next((wave for wave in journal["waves"] if wave["wave"] == wave_number), None)
        if existing_wave is None:
            journal["waves"].append(
                {
                    "wave": wave_number,
                    "label": wave_label,
                    "services": [service["service"] for service in release_manifest["services"]],
                    "status": "running",
                    "startedAt": _timestamp_now(),
                }
            )
        else:
            if existing_wave.get("status") in {"applied", "rolled_back"}:
                raise RuntimeError(f"wave {wave_number} of {release_id} is already closed")
            existing_wave["label"] = wave_label
            existing_wave["services"] = [service["service"] for service in release_manifest["services"]]
            existing_wave["status"] = "running"
            existing_wave["startedAt"] = existing_wave.get("startedAt") or _timestamp_now()

    journal["updatedAt"] = _timestamp_now()
    _write_json_atomic(_release_journal_path(release_id), journal)


def _mark_release_wave_applied(release_manifest: dict[str, object]) -> None:
    release_id = str(release_manifest["releaseId"])
    journal = _load_release_journal(release_id)
    journal["updatedAt"] = _timestamp_now()
    wave_number = release_manifest.get("wave")
    if wave_number is not None:
        for wave in journal.get("waves", []):
            if wave["wave"] == wave_number:
                wave["status"] = "applied"
                wave["appliedAt"] = journal["updatedAt"]
                break
    _write_json_atomic(_release_journal_path(release_id), journal)


def _mark_release_failed(release_manifest: dict[str, object], reason: str) -> None:
    release_id = str(release_manifest["releaseId"])
    journal = _require_release_journal(release_id)
    _assert_release_status(journal, allowed_statuses={"running"})
    journal["status"] = "failed"
    journal["failureReason"] = reason
    journal["updatedAt"] = _timestamp_now()
    wave_number = release_manifest.get("wave")
    if wave_number is not None:
        for wave in journal.get("waves", []):
            if wave["wave"] == wave_number:
                wave["status"] = "failed"
                wave["failedAt"] = journal["updatedAt"]
                wave["failureReason"] = reason
                break
    _write_json_atomic(_release_journal_path(release_id), journal)


def _load_current_state() -> dict[str, object]:
    return _load_json_file(
        _current_state_path(),
        {
            "environment": "unknown",
            "repairRequired": False,
            "updatedAt": "",
            "services": {},
        },
    )


def _detect_runtime_drift(current_state: dict[str, object]) -> dict[str, object] | None:
    drift_services: list[dict[str, object]] = []
    current_state_path = _current_state_path()
    if not current_state_path.exists():
        return {
            "detectedAt": _timestamp_now(),
            "severity": "critical",
            "services": [
                {
                    "service": "(host)",
                    "severity": "critical",
                    "reasons": ["state_missing"],
                    "expected": {"statePath": str(current_state_path)},
                    "actual": {"statePathExists": False},
                }
            ],
        }

    services = current_state.get("services", {})
    if not isinstance(services, dict):
        return {
            "detectedAt": _timestamp_now(),
            "severity": "critical",
            "services": [
                {
                    "service": "(host)",
                    "severity": "critical",
                    "reasons": ["state_invalid"],
                    "expected": {"servicesType": "dict"},
                    "actual": {"servicesType": type(services).__name__},
                }
            ],
        }

    for service_name, service_state in services.items():
        if not isinstance(service_state, dict) or not service_state.get("exists"):
            continue
        service_drift = _detect_service_runtime_drift(str(service_name), service_state)
        if service_drift is not None:
            drift_services.append(service_drift)

    if not drift_services:
        return None

    severity_rank = {"minor": 1, "medium": 2, "critical": 3}
    overall_severity = max(drift_services, key=lambda entry: severity_rank.get(str(entry["severity"]), 0))["severity"]
    return {
        "detectedAt": _timestamp_now(),
        "severity": overall_severity,
        "services": drift_services,
    }


def _can_attempt_limited_self_heal(
    *, current_state: dict[str, object], drift_report: dict[str, object]
) -> bool:
    services = current_state.get("services", {})
    if not isinstance(services, dict) or current_state.get("repairRequired"):
        return False

    last_known_good = _load_json_file(_last_known_good_path(), {})
    last_known_good_services = last_known_good.get("services", {})
    if not isinstance(last_known_good_services, dict) or not last_known_good_services:
        return False

    drift_services = drift_report.get("services", [])
    if not isinstance(drift_services, list) or not drift_services:
        return False

    for drift_service in drift_services:
        if not isinstance(drift_service, dict):
            return False
        if str(drift_service.get("severity")) != "minor":
            return False
        reasons = drift_service.get("reasons", [])
        if not isinstance(reasons, list) or not reasons:
            return False
        if not set(str(reason) for reason in reasons).issubset({"container_missing", "container_not_running"}):
            return False

        service_name = str(drift_service.get("service", "")).strip()
        if not service_name:
            return False
        current_service = services.get(service_name)
        last_known_good_service = last_known_good_services.get(service_name)
        if not isinstance(current_service, dict) or not isinstance(last_known_good_service, dict):
            return False
        if not current_service.get("exists") or not last_known_good_service.get("exists"):
            return False
        if not _service_state_matches_last_known_good(current_service, last_known_good_service):
            return False
        runtime_spec = current_service.get("runtimeSpec")
        if not isinstance(runtime_spec, dict):
            return False
        if not str(current_service.get("imageUri", "")).strip():
            return False

    return True


def _detect_service_runtime_drift(service_name: str, service_state: dict[str, object]) -> dict[str, object] | None:
    expected = {
        "containerName": service_state.get("containerName"),
        "imageUri": service_state.get("imageUri"),
        "hostPort": service_state.get("hostPort"),
        "containerPort": service_state.get("containerPort"),
        "envHash": service_state.get("envHash"),
    }
    container_name = str(expected["containerName"] or "").strip()
    if not container_name:
        return {
            "service": service_name,
            "severity": "critical",
            "reasons": ["state_missing_container_name"],
            "expected": expected,
            "actual": {},
        }

    actual = _inspect_container_state(container_name)
    reasons: list[str] = []
    severity = "minor"

    if not actual["exists"]:
        reasons.append("container_missing")
    elif not actual["running"]:
        reasons.append("container_not_running")
    if actual["exists"]:
        if actual.get("imageUri") != expected["imageUri"]:
            reasons.append("image_mismatch")
            severity = "medium"

        if actual.get("hostPort") != expected["hostPort"] or actual.get("containerPort") != expected["containerPort"]:
            reasons.append("port_binding_mismatch")
            severity = "medium"

        if actual.get("containerName") != expected["containerName"]:
            reasons.append("container_name_mismatch")
            severity = "medium"

    if actual.get("envHash") != expected["envHash"]:
        reasons.append("env_hash_mismatch")
        severity = "medium"

    if not reasons:
        return None

    if len(reasons) > 1 and severity == "minor":
        severity = "critical"

    return {
        "service": service_name,
        "severity": severity,
        "reasons": reasons,
        "expected": expected,
        "actual": actual,
    }


def _service_state_matches_last_known_good(
    current_service: dict[str, object], last_known_good_service: dict[str, object]
) -> bool:
    keys = ("imageUri", "containerName", "containerPort", "hostPort", "envHash", "runtimeSpec")
    return all(current_service.get(key) == last_known_good_service.get(key) for key in keys)


def _attempt_limited_self_heal(
    *, current_state: dict[str, object], drift_report: dict[str, object]
) -> None:
    services = current_state.get("services", {})
    environment = str(current_state.get("environment") or "unknown")
    region = require_env("AWS_REGION")
    secret_cache: dict[str, str] = {}
    healed_services: list[dict[str, object]] = []
    registries: set[str] = set()

    for drift_service in drift_report.get("services", []):
        service_name = str(drift_service["service"])
        service_state = services[service_name]
        runtime_spec = service_state["runtimeSpec"]
        image_uri = str(service_state["imageUri"])
        registries.add(image_uri.split("/", 1)[0])
        healed_services.append(
            _build_runtime_service(
                service_name=service_name,
                image_uri=image_uri,
                runtime_spec=runtime_spec,
            )
        )

    for registry in sorted(registries):
        password = run_output(["aws", "ecr", "get-login-password", "--region", region])
        run(["docker", "login", "--username", "AWS", "--password-stdin", registry], input_text=password)

    _ensure_network()
    for service in healed_services:
        run(["docker", "pull", service["image"]])

    for service in healed_services:
        env_path, env_contents = _write_service_env(
            service=service,
            region=region,
            secret_cache=secret_cache,
        )
        _remove_container(str(service["container_name"]))
        command = [
            "docker",
            "run",
            "-d",
            "--name",
            str(service["container_name"]),
            "--restart",
            "unless-stopped",
            "--network",
            "ev-dashboard",
        ]
        if env_path is not None:
            command.extend(["--env-file", str(env_path)])
        if service.get("container_port") and service.get("host_port"):
            command.extend(["-p", f"{service['host_port']}:{service['container_port']}"])
        command.append(str(service["image"]))
        run(command)
        service["rendered_env_contents"] = env_contents

    _update_current_state(
        environment=environment,
        deploy_services=healed_services,
        remove_services=[],
    )
    updated_state = _load_current_state()
    updated_state["lastSelfHeal"] = {
        "detectedAt": drift_report.get("detectedAt"),
        "healedAt": _timestamp_now(),
        "services": [str(service["service_name"]) for service in healed_services],
    }
    updated_state.pop("lastDetectedDrift", None)
    updated_state.pop("lastSelfHealFailure", None)
    _write_json_atomic(_current_state_path(), updated_state)


def _inspect_container_state(container_name: str) -> dict[str, object]:
    try:
        raw_output = run_output(
            [
                "docker",
                "inspect",
                "--type",
                "container",
                container_name,
            ]
        )
        parsed_output = json.loads(raw_output)
    except Exception:
        return {
            "exists": False,
            "containerName": container_name,
            "running": False,
            "status": "missing",
            "imageUri": None,
            "hostPort": None,
            "containerPort": None,
            "envHash": _read_service_env_hash(container_name),
        }

    if not isinstance(parsed_output, list) or not parsed_output:
        return {
            "exists": False,
            "containerName": container_name,
            "running": False,
            "status": "missing",
            "imageUri": None,
            "hostPort": None,
            "containerPort": None,
            "envHash": _read_service_env_hash(container_name),
        }

    container = parsed_output[0]
    if not isinstance(container, dict):
        raise RuntimeError(f"docker inspect output for {container_name} must be an object")

    state = container.get("State") or {}
    config = container.get("Config") or {}
    network_settings = container.get("NetworkSettings") or {}
    return {
        "exists": True,
        "containerName": str(container.get("Name", f"/{container_name}")).lstrip("/"),
        "running": bool((state or {}).get("Running", False)),
        "status": str((state or {}).get("Status", "")),
        "imageUri": (config or {}).get("Image"),
        **_extract_port_binding(network_settings.get("Ports")),
        "envHash": _read_service_env_hash(container_name),
    }


def _extract_port_binding(raw_ports: object) -> dict[str, object]:
    if not isinstance(raw_ports, dict) or not raw_ports:
        return {
            "hostPort": None,
            "containerPort": None,
        }

    for container_port_key, mappings in raw_ports.items():
        container_port = str(container_port_key).split("/", 1)[0]
        if not isinstance(mappings, list) or not mappings:
            continue
        first_mapping = mappings[0]
        if not isinstance(first_mapping, dict):
            continue
        host_port = first_mapping.get("HostPort")
        return {
            "hostPort": int(host_port) if host_port not in ("", None) else None,
            "containerPort": int(container_port) if container_port not in ("", None) else None,
        }

    return {
        "hostPort": None,
        "containerPort": None,
    }


def _read_service_env_hash(container_name: str) -> str | None:
    env_path = SERVICE_ENV_DIR / f"{container_name}.env"
    if not env_path.exists():
        return None
    return _sha256_text(env_path.read_text(encoding="utf8"))


def _load_release_journal(release_id: str) -> dict[str, object]:
    return _load_json_file(_release_journal_path(release_id), {})


def _require_release_journal(release_id: str) -> dict[str, object]:
    journal = _load_release_journal(release_id)
    if not journal:
        raise RuntimeError(f"{release_id} does not have a release journal")
    return journal


def _load_json_file(path: Path, default: dict[str, object]) -> dict[str, object]:
    if not path.exists():
        return dict(default)

    try:
        raw_contents = path.read_text(encoding="utf8").strip()
        if not raw_contents:
            return dict(default)
        parsed = json.loads(raw_contents)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    return dict(default)


def _write_json_atomic(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(f"{path.suffix}.tmp")
    temporary_path.write_text(f"{json.dumps(payload, sort_keys=True)}\n", encoding="utf8")
    temporary_path.replace(path)


def _current_state_path() -> Path:
    return BASE_DIR / STATE_DIR_NAME / CURRENT_STATE_FILE_NAME


def _last_known_good_path() -> Path:
    return BASE_DIR / STATE_DIR_NAME / LAST_KNOWN_GOOD_FILE_NAME


def _release_journal_path(release_id: str) -> Path:
    safe_release_id = release_id.replace("/", "_")
    return BASE_DIR / STATE_DIR_NAME / RELEASES_DIR_NAME / f"{safe_release_id}.json"


def _assert_release_status(journal: dict[str, object], *, allowed_statuses: set[str]) -> None:
    status = str(journal.get("status", "")).strip()
    if status not in allowed_statuses:
        allowed = ", ".join(sorted(allowed_statuses))
        raise RuntimeError(f"release status {status or '(empty)'} is not allowed; expected one of: {allowed}")


def _build_rollback_services(
    before_snapshot: dict[str, object],
    release_manifest: dict[str, object],
) -> list[dict[str, object]]:
    rollback_services: list[dict[str, object]] = []
    before_services = before_snapshot["services"]
    for release_service in sorted(release_manifest["services"], key=lambda service: str(service["service"])):
        service_name = str(release_service["service"])
        state = before_services.get(service_name, {})
        if state.get("exists"):
            rollback_service = {
                "service": service_name,
                "action": "deploy",
                "imageUri": state.get("imageUri"),
                "runtimeSpec": state.get("runtimeSpec"),
            }
        else:
            rollback_service = {
                "service": service_name,
                "action": "remove",
            }
        rollback_services.append(rollback_service)
    return rollback_services


def _build_rollback_waves(
    *,
    journal: dict[str, object],
    rollback_plan: dict[str, object],
    through_wave: int | None,
) -> list[dict[str, object]]:
    journal_waves = {
        int(wave["wave"]): wave
        for wave in journal.get("waves", [])
        if isinstance(wave, dict) and wave.get("wave") is not None
    }
    eligible_statuses = {"applied", "failed", "running"}
    rollback_waves = [
        wave
        for wave in rollback_plan.get("waves", [])
        if (
            isinstance(wave, dict)
            and wave.get("wave") is not None
            and int(wave["wave"]) in journal_waves
            and journal_waves[int(wave["wave"])].get("status") in eligible_statuses
            and (through_wave is None or int(wave["wave"]) <= through_wave)
        )
    ]
    rollback_waves.sort(key=lambda wave: int(wave["wave"]), reverse=True)
    return rollback_waves


def _runtime_spec_from_service_definition(service_definition: dict[str, object]) -> dict[str, object]:
    return {
        "containerName": service_definition["container_name"],
        "containerPort": service_definition.get("container_port"),
        "hostPort": service_definition.get("host_port"),
        "environment": service_definition.get("environment") or {},
        "secretArns": service_definition.get("secret_arns") or {},
    }


def _normalize_runtime_spec(raw_runtime_spec: object, *, service_name: str) -> dict[str, object]:
    if not isinstance(raw_runtime_spec, dict):
        raise RuntimeError(f"{service_name} runtimeSpec must be an object")

    container_name = str(raw_runtime_spec.get("containerName", "")).strip()
    if not container_name:
        raise RuntimeError(f"{service_name} runtimeSpec.containerName is required")

    environment = raw_runtime_spec.get("environment") or {}
    if not isinstance(environment, dict):
        raise RuntimeError(f"{service_name} runtimeSpec.environment must be an object")

    secret_arns = raw_runtime_spec.get("secretArns") or {}
    if not isinstance(secret_arns, dict):
        raise RuntimeError(f"{service_name} runtimeSpec.secretArns must be an object")

    return {
        "container_name": container_name,
        "container_port": _parse_optional_int(raw_runtime_spec.get("containerPort")),
        "host_port": _parse_optional_int(raw_runtime_spec.get("hostPort")),
        "environment": {str(key): str(value) for key, value in environment.items()},
        "secret_arns": {str(key): str(value) for key, value in secret_arns.items()},
    }


def _mark_release_wave_rolled_back(release_id: str, wave_number: int) -> None:
    journal = _require_release_journal(release_id)
    for wave in journal.get("waves", []):
        if wave.get("wave") == wave_number:
            wave["status"] = "rolled_back"
            wave["rolledBackAt"] = _timestamp_now()
            break
    journal["updatedAt"] = _timestamp_now()
    _write_json_atomic(_release_journal_path(release_id), journal)


def _resolve_image_digest(image_uri: str) -> str | None:
    try:
        raw_digests = run_output(
            [
                "docker",
                "image",
                "inspect",
                image_uri,
                "--format",
                "{{json .RepoDigests}}",
            ]
        )
        parsed_digests = json.loads(raw_digests)
        if isinstance(parsed_digests, list) and parsed_digests:
            return str(parsed_digests[0])
    except Exception:
        return None

    return None


def _sha256_json(payload: object) -> str:
    normalized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return _sha256_text(normalized)


def _sha256_text(payload: str | None) -> str | None:
    if payload is None:
        return None
    return f"sha256:{hashlib.sha256(payload.encode('utf8')).hexdigest()}"


def _timestamp_now() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


@contextmanager
def _reconcile_lock():
    RECONCILE_LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RECONCILE_LOCK_PATH.open("w", encoding="utf8") as lock_file:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
