from __future__ import annotations

import base64
import json
import time
from pathlib import Path

from ev_dashboard_runtime.common import require_env, run, run_output, write_text

BASE_DIR = Path("/opt/ev-dashboard-data")


def verify_data() -> int:
    return bootstrap_data()


def bootstrap_data() -> int:
    device_name = require_env("DEVICE_NAME")
    mount_path = require_env("MOUNT_PATH")
    region = require_env("AWS_REGION")
    postgres_version = require_env("POSTGRES_VERSION")
    redis_version = require_env("REDIS_VERSION")
    postgres_superuser_secret_arn = require_env("POSTGRES_SUPERUSER_SECRET_ARN")
    databases = json.loads(base64.b64decode(require_env("DATA_HOST_DATABASES_B64")).decode("utf8"))

    for _ in range(60):
        if Path(device_name).exists():
            break
        time.sleep(5)
    else:
        raise RuntimeError(f"Device {device_name} did not appear in time")

    try:
        run(["blkid", device_name])
    except Exception:
        run(["mkfs", "-t", "xfs", device_name])

    run(["mkdir", "-p", f"{mount_path}/postgres", f"{mount_path}/redis"])
    fstab_line = f"{device_name} {mount_path} xfs defaults,nofail 0 2\n"
    fstab_path = Path("/etc/fstab")
    current_fstab = fstab_path.read_text(encoding="utf8")
    if device_name not in current_fstab:
        fstab_path.write_text(current_fstab + fstab_line, encoding="utf8")
    run(["mount", "-a"])

    postgres_superuser_password = run_output(
        [
            "aws",
            "secretsmanager",
            "get-secret-value",
            "--secret-id",
            postgres_superuser_secret_arn,
            "--region",
            region,
            "--query",
            "SecretString",
            "--output",
            "text",
        ]
    )
    write_text(
        BASE_DIR / "postgres.env",
        "\n".join(
            [
                "POSTGRES_USER=postgres",
                "POSTGRES_DB=postgres",
                f"POSTGRES_PASSWORD={postgres_superuser_password}",
                "",
            ]
        ),
    )

    _remove_container("ev-dashboard-postgres")
    _remove_container("ev-dashboard-redis")

    run(["docker", "pull", f"postgres:{postgres_version}"])
    run(
        [
            "docker",
            "run",
            "-d",
            "--name",
            "ev-dashboard-postgres",
            "--restart",
            "unless-stopped",
            "--env-file",
            str(BASE_DIR / "postgres.env"),
            "-p",
            "5432:5432",
            "-v",
            f"{mount_path}/postgres:/var/lib/postgresql/data",
            f"postgres:{postgres_version}",
        ]
    )
    run(["docker", "pull", f"redis:{redis_version}"])
    run(
        [
            "docker",
            "run",
            "-d",
            "--name",
            "ev-dashboard-redis",
            "--restart",
            "unless-stopped",
            "-p",
            "6379:6379",
            "-v",
            f"{mount_path}/redis:/data",
            f"redis:{redis_version}",
            "redis-server",
            "--appendonly",
            "yes",
        ]
    )

    for _ in range(60):
        try:
            run(["docker", "exec", "ev-dashboard-postgres", "pg_isready", "-U", "postgres"])
            break
        except Exception:
            time.sleep(2)
    else:
        raise RuntimeError("Postgres did not become ready in time")

    for database in databases:
        password = run_output(
            [
                "aws",
                "secretsmanager",
                "get-secret-value",
                "--secret-id",
                database["passwordSecretArn"],
                "--region",
                region,
                "--query",
                "SecretString",
                "--output",
                "text",
            ]
        )
        role_sql = "\n".join(
            [
                "DO $$",
                "BEGIN",
                f"  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{database['username']}') THEN",
                f"    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '{database['username']}', '{password}');",
                "  ELSE",
                f"    EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', '{database['username']}', '{password}');",
                "  END IF;",
                "END $$;",
                "",
            ]
        )
        run(
            [
                "docker",
                "exec",
                "-i",
                "ev-dashboard-postgres",
                "psql",
                "-U",
                "postgres",
                "-d",
                "postgres",
                "-v",
                "ON_ERROR_STOP=1",
            ],
            input_text=role_sql,
        )

        database_exists = run_output(
            [
                "docker",
                "exec",
                "ev-dashboard-postgres",
                "psql",
                "-U",
                "postgres",
                "-d",
                "postgres",
                "-tAc",
                f"SELECT 1 FROM pg_database WHERE datname='{database['databaseName']}'",
            ]
        )
        if database_exists.strip() != "1":
            run(
                [
                    "docker",
                    "exec",
                    "ev-dashboard-postgres",
                    "psql",
                    "-U",
                    "postgres",
                    "-d",
                    "postgres",
                    "-c",
                    f"CREATE DATABASE {database['databaseName']} OWNER {database['username']};",
                ]
            )

    return 0


def _remove_container(container_name: str) -> None:
    try:
        run(["docker", "rm", "-f", container_name])
    except Exception:
        pass
