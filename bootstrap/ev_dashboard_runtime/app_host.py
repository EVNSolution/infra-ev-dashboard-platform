from __future__ import annotations

import json
import subprocess
from pathlib import Path

from ev_dashboard_runtime.common import require_env, run, run_output, write_text

BASE_DIR = Path("/opt/ev-dashboard")
RUNTIME_IMAGES_PATH = BASE_DIR / "runtime-images.json"
ACCOUNT_ACCESS_ENV_PATH = BASE_DIR / "account-access.env"
PROOF_GATEWAY_CONFIG_PATH = BASE_DIR / "nginx.ec2-proof.conf"


def verify_app() -> int:
    return reconcile_app()


def reconcile_app() -> int:
    region = require_env("AWS_REGION")
    image_map_param = require_env("IMAGE_MAP_PARAM")
    data_host_address = require_env("DATA_HOST_ADDRESS")
    apex_domain = require_env("APEX_DOMAIN")
    api_domain = require_env("API_DOMAIN")

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

    front_image = image_map["front-web-console"]
    gateway_image = image_map["edge-api-gateway"]
    account_access_image = image_map["service-account-access"]

    registries = sorted({image.split("/", 1)[0] for image in [front_image, gateway_image, account_access_image]})
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

    postgres_secret_arn = require_env("ACCOUNT_ACCESS_POSTGRES_SECRET_ARN")
    django_secret_arn = require_env("ACCOUNT_ACCESS_DJANGO_SECRET_ARN")
    jwt_secret_arn = require_env("ACCOUNT_ACCESS_JWT_SECRET_ARN")

    account_access_postgres_password = run_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            postgres_secret_arn,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ]
    )
    account_access_django_secret = run_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            django_secret_arn,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ]
    )
    account_access_jwt_secret = run_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            jwt_secret_arn,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ]
    )

    account_access_env = "\n".join(
        [
            f"POSTGRES_HOST={data_host_address}",
            "POSTGRES_PORT=5432",
            "POSTGRES_DB=account_auth",
            "POSTGRES_USER=account_auth",
            f"POSTGRES_PASSWORD={account_access_postgres_password}",
            f"REDIS_URL=redis://{data_host_address}:6379/0",
            f"DJANGO_SECRET_KEY={account_access_django_secret}",
            f"JWT_SECRET_KEY={account_access_jwt_secret}",
            f"DJANGO_ALLOWED_HOSTS={api_domain},account-auth-api,localhost,127.0.0.1",
            f"CSRF_TRUSTED_ORIGINS=https://{apex_domain},https://{api_domain}",
            "",
        ]
    )
    write_text(ACCOUNT_ACCESS_ENV_PATH, account_access_env)
    write_text(PROOF_GATEWAY_CONFIG_PATH, render_proof_gateway_config())

    for container_name in ["web-console", "account-auth-api", "edge-api-gateway"]:
        _remove_container(container_name)

    run(["docker", "pull", front_image])
    run(
        [
            "docker",
            "run",
            "-d",
            "--name",
            "web-console",
            "--restart",
            "unless-stopped",
            "--network",
            "ev-dashboard",
            "-p",
            "5174:5174",
            front_image,
        ]
    )
    run(["docker", "pull", account_access_image])
    run(
        [
            "docker",
            "run",
            "-d",
            "--name",
            "account-auth-api",
            "--restart",
            "unless-stopped",
            "--network",
            "ev-dashboard",
            "--env-file",
            str(ACCOUNT_ACCESS_ENV_PATH),
            "-p",
            "8000:8000",
            account_access_image,
        ]
    )
    run(["docker", "pull", gateway_image])
    run(
        [
            "docker",
            "run",
            "-d",
            "--name",
            "edge-api-gateway",
            "--restart",
            "unless-stopped",
            "--network",
            "ev-dashboard",
            "-p",
            "8080:8080",
            "-v",
            f"{PROOF_GATEWAY_CONFIG_PATH}:/etc/nginx/nginx.conf:ro",
            gateway_image,
        ]
    )

    return 0


def _remove_container(container_name: str) -> None:
    try:
        run(["docker", "rm", "-f", container_name])
    except Exception:
        pass


def render_proof_gateway_config() -> str:
    return "\n".join(
        [
            "worker_processes auto;",
            "",
            "events {",
            "    worker_connections 1024;",
            "}",
            "",
            "http {",
            "    map $http_upgrade $connection_upgrade {",
            "        default upgrade;",
            "        '' close;",
            "    }",
            "",
            "    server {",
            "        listen 8080;",
            "",
            "        location = /healthz {",
            "            access_log off;",
            "            return 200;",
            "        }",
            "",
            "        location = /openapi.yaml {",
            "            proxy_pass http://account-auth-api:8000;",
            "            proxy_http_version 1.1;",
            "            proxy_set_header Host $proxy_host;",
            "        }",
            "",
            "        location /swagger/ {",
            "            proxy_pass http://account-auth-api:8000;",
            "            proxy_http_version 1.1;",
            "            proxy_set_header Host $proxy_host;",
            "        }",
            "",
            "        location /redoc/ {",
            "            proxy_pass http://account-auth-api:8000;",
            "            proxy_http_version 1.1;",
            "            proxy_set_header Host $proxy_host;",
            "        }",
            "",
            "        location = /admin/account-access {",
            "            return 301 /admin/account-access/;",
            "        }",
            "",
            "        location ^~ /admin/account-access/ {",
            "            proxy_pass http://account-auth-api:8000;",
            "            proxy_http_version 1.1;",
            "            proxy_set_header Host $proxy_host;",
            "        }",
            "",
            "        location ^~ /static/admin/ {",
            "            proxy_pass http://account-auth-api:8000;",
            "            proxy_http_version 1.1;",
            "            proxy_set_header Host $proxy_host;",
            "        }",
            "",
            "        location /api/auth/ {",
            "            rewrite ^/api/auth/(.*)$ /$1 break;",
            "            proxy_pass http://account-auth-api:8000;",
            "            proxy_http_version 1.1;",
            "            proxy_set_header Host $proxy_host;",
            "        }",
            "",
            "        location / {",
            "            proxy_pass http://web-console:5174;",
            "            proxy_http_version 1.1;",
            "            proxy_set_header Host $proxy_host;",
            "            proxy_set_header Upgrade $http_upgrade;",
            "            proxy_set_header Connection $connection_upgrade;",
            "        }",
            "    }",
            "}",
            "",
        ]
    )
