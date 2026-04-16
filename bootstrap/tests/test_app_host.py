from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ev_dashboard_runtime import app_host


class AppHostPartialReconcileTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.tempdir.name)
        self.runtime_images_path = self.base_dir / "runtime-images.json"
        self.service_env_dir = self.base_dir / "service-env"
        self.reconcile_lock_path = self.base_dir / "app-reconcile.lock"
        self.state_dir = self.base_dir / "state"

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def test_partial_release_restarts_only_changed_service(self) -> None:
        commands: list[list[str]] = []
        writes: dict[str, str] = {}

        with (
            patch.object(app_host, "BASE_DIR", self.base_dir),
            patch.object(app_host, "RUNTIME_IMAGES_PATH", self.runtime_images_path),
            patch.object(app_host, "SERVICE_ENV_DIR", self.service_env_dir),
            patch.object(app_host, "RECONCILE_LOCK_PATH", self.reconcile_lock_path),
            patch.object(app_host, "require_env", side_effect=self._env_lookup),
            patch.object(
                app_host,
                "optional_env",
                side_effect=lambda name: self._release_manifest_json() if name == "RELEASE_MANIFEST_JSON" else "",
            ),
            patch.object(app_host, "run_output", side_effect=self._run_output),
            patch.object(app_host, "run", side_effect=lambda command, input_text=None: commands.append(list(command))),
            patch.object(app_host, "write_text", side_effect=lambda path, contents: self._write_text(path, contents, writes)),
        ):
            self.runtime_images_path.write_text(
                json.dumps(
                    {
                        "front-web-console": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front-old",
                        "service-account-access": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old",
                    }
                ),
                encoding="utf8",
            )

            exit_code = app_host.reconcile_app()

        self.assertEqual(exit_code, 0)
        self.assertIn(
            ["docker", "pull", "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-new"],
            commands,
        )
        self.assertIn(["docker", "rm", "-f", "account-auth-api"], commands)
        self.assertNotIn(["docker", "rm", "-f", "web-console"], commands)
        self.assertNotIn(
            ["docker", "pull", "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front-old"],
            commands,
        )
        self.assertIn(
            str(self.service_env_dir / "account-auth-api.env"),
            writes,
        )
        self.assertEqual(
            json.loads(writes[str(self.runtime_images_path)].strip()),
            {
                "front-web-console": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front-old",
                "service-account-access": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-new",
            },
        )
        current_state = json.loads((self.state_dir / "current-state.json").read_text(encoding="utf8"))
        self.assertEqual(current_state["services"]["service-account-access"]["imageUri"], "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-new")
        self.assertEqual(current_state["services"]["service-account-access"]["exists"], True)
        release_journal = json.loads((self.state_dir / "releases" / "dev-account-access.json").read_text(encoding="utf8"))
        self.assertEqual(release_journal["status"], "running")
        self.assertEqual(release_journal["waves"][0]["status"], "applied")
        self.assertEqual(release_journal["rollbackPlan"]["direction"], "rollback")
        self.assertEqual(release_journal["rollbackPlan"]["waves"][0]["services"][0]["action"], "deploy")
        self.assertEqual(
            release_journal["rollbackPlan"]["waves"][0]["services"][0]["runtimeSpec"]["containerName"],
            "account-auth-api",
        )
        self.assertEqual(
            release_journal["rollbackPlan"]["waves"][0]["services"][0]["imageUri"],
            "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old",
        )
        self.assertNotIn("rollbackManifest", release_journal)

    def test_partial_release_remove_action_cleans_up_only_target_service(self) -> None:
        commands: list[list[str]] = []
        writes: dict[str, str] = {}

        with (
            patch.object(app_host, "BASE_DIR", self.base_dir),
            patch.object(app_host, "RUNTIME_IMAGES_PATH", self.runtime_images_path),
            patch.object(app_host, "SERVICE_ENV_DIR", self.service_env_dir),
            patch.object(app_host, "RECONCILE_LOCK_PATH", self.reconcile_lock_path),
            patch.object(app_host, "require_env", side_effect=self._env_lookup_remove),
            patch.object(
                app_host,
                "optional_env",
                side_effect=lambda name: self._release_manifest_json_remove() if name == "RELEASE_MANIFEST_JSON" else "",
            ),
            patch.object(app_host, "run_output", side_effect=self._run_output_remove),
            patch.object(app_host, "run", side_effect=lambda command, input_text=None: commands.append(list(command))),
            patch.object(app_host, "write_text", side_effect=lambda path, contents: self._write_text(path, contents, writes)),
        ):
            self.runtime_images_path.write_text(
                json.dumps(
                    {
                        "front-web-console": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front-old",
                        "service-account-access": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old",
                    }
                ),
                encoding="utf8",
            )

            env_path = self.service_env_dir / "account-auth-api.env"
            env_path.parent.mkdir(parents=True, exist_ok=True)
            env_path.write_text("TOKEN=value\n", encoding="utf8")

            exit_code = app_host.reconcile_app()

        self.assertEqual(exit_code, 0)
        self.assertIn(["docker", "rm", "-f", "account-auth-api"], commands)
        self.assertNotIn(["docker", "rm", "-f", "web-console"], commands)
        self.assertFalse(env_path.exists())
        self.assertEqual(
            json.loads(writes[str(self.runtime_images_path)].strip()),
            {
                "front-web-console": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front-old"
            },
        )
        current_state = json.loads((self.state_dir / "current-state.json").read_text(encoding="utf8"))
        self.assertNotIn("service-account-access", current_state["services"])
        release_journal = json.loads((self.state_dir / "releases" / "dev-account-access-remove.json").read_text(encoding="utf8"))
        self.assertEqual(release_journal["rollbackPlan"]["waves"][0]["services"][0]["action"], "deploy")
        self.assertEqual(
            release_journal["rollbackPlan"]["waves"][0]["services"][0]["runtimeSpec"]["containerName"],
            "account-auth-api",
        )
        self.assertEqual(
            release_journal["rollbackPlan"]["waves"][0]["services"][0]["imageUri"],
            "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old",
        )
        self.assertNotIn("rollbackManifest", release_journal)

    def test_finalize_release_captures_last_known_good_snapshot(self) -> None:
        current_state_path = self.state_dir / "current-state.json"
        release_journal_path = self.state_dir / "releases" / "release-001.json"
        current_state_path.parent.mkdir(parents=True, exist_ok=True)
        release_journal_path.parent.mkdir(parents=True, exist_ok=True)
        current_state_path.write_text(
            json.dumps(
                {
                    "environment": "dev",
                    "updatedAt": "2026-04-16T10:00:00+09:00",
                    "services": {"service-account-access": {"exists": True, "imageUri": "repo/account:sha"}},
                }
            ),
            encoding="utf8",
        )
        release_journal_path.write_text(
            json.dumps(
                {
                    "releaseId": "release-001",
                    "status": "running",
                    "waves": [{"wave": 1, "label": "backend", "status": "applied", "services": ["service-account-access"]}],
                }
            ),
            encoding="utf8",
        )

        with (
            patch.object(app_host, "BASE_DIR", self.base_dir),
            patch.object(app_host, "RECONCILE_LOCK_PATH", self.reconcile_lock_path),
        ):
            exit_code = app_host.finalize_app_release("release-001")

        self.assertEqual(exit_code, 0)
        last_known_good = json.loads((self.state_dir / "last-known-good.json").read_text(encoding="utf8"))
        self.assertEqual(last_known_good["releaseId"], "release-001")
        updated_journal = json.loads(release_journal_path.read_text(encoding="utf8"))
        self.assertEqual(updated_journal["status"], "succeeded")

    def test_assert_release_ready_self_heals_minor_container_drift(self) -> None:
        commands: list[list[str]] = []
        writes: dict[str, str] = {}
        current_state_path = self.state_dir / "current-state.json"
        current_state_path.parent.mkdir(parents=True, exist_ok=True)
        service_state = {
            "exists": True,
            "serviceName": "service-account-access",
            "imageUri": "repo/account:sha-account-old",
            "containerName": "account-auth-api",
            "containerPort": 8000,
            "hostPort": 8001,
            "runtimeSpec": {
                "containerName": "account-auth-api",
                "containerPort": 8000,
                "hostPort": 8001,
                "environment": {"ACCOUNT_MODE": "live"},
                "secretArns": {},
            },
            "envHash": app_host._sha256_text("ACCOUNT_MODE=live\n"),
            "updatedAt": "2026-04-16T12:00:00+09:00",
        }
        current_state_path.write_text(
            json.dumps(
                {
                    "environment": "dev",
                    "repairRequired": False,
                    "updatedAt": "2026-04-16T12:00:00+09:00",
                    "services": {
                        "service-account-access": service_state,
                    },
                }
            ),
            encoding="utf8",
        )
        (self.state_dir / "last-known-good.json").write_text(
            json.dumps(
                {
                    "releaseId": "release-001",
                    "capturedAt": "2026-04-16T12:00:00+09:00",
                    "services": {
                        "service-account-access": service_state,
                    },
                }
            ),
            encoding="utf8",
        )
        env_path = self.service_env_dir / "account-auth-api.env"
        env_path.parent.mkdir(parents=True, exist_ok=True)
        env_path.write_text("ACCOUNT_MODE=live\n", encoding="utf8")

        inspect_calls = {"count": 0}

        def run_output_side_effect(command: list[str]) -> str:
            if command[:3] == ["docker", "inspect", "--type"]:
                inspect_calls["count"] += 1
                if inspect_calls["count"] == 1:
                    raise RuntimeError("container missing")
                return json.dumps(
                    [
                        {
                            "Name": "/account-auth-api",
                            "Config": {"Image": "repo/account:sha-account-old"},
                            "State": {"Running": True, "Status": "running"},
                            "NetworkSettings": {
                                "Ports": {
                                    "8000/tcp": [{"HostPort": "8001"}],
                                }
                            },
                        }
                    ]
                )

            if command[1:3] == ["ecr", "get-login-password"]:
                return "password"

            if command[1:3] == ["docker", "image"]:
                return json.dumps(["repo/account@sha256:account-old"])

            raise AssertionError(f"Unexpected command: {command}")

        with (
            patch.object(app_host, "BASE_DIR", self.base_dir),
            patch.object(app_host, "SERVICE_ENV_DIR", self.service_env_dir),
            patch.object(app_host, "RECONCILE_LOCK_PATH", self.reconcile_lock_path),
            patch.object(app_host, "require_env", side_effect=lambda name: {"AWS_REGION": "ap-northeast-2"}[name]),
            patch.object(app_host, "run_output", side_effect=run_output_side_effect),
            patch.object(app_host, "run", side_effect=lambda command, input_text=None: commands.append(list(command))),
            patch.object(app_host, "write_text", side_effect=lambda path, contents: self._write_text(path, contents, writes)),
        ):
            exit_code = app_host.assert_app_release_ready()

        self.assertEqual(exit_code, 0)
        self.assertIn(["docker", "rm", "-f", "account-auth-api"], commands)
        self.assertIn(["docker", "pull", "repo/account:sha-account-old"], commands)
        run_command = next(command for command in commands if command[:6] == ["docker", "run", "-d", "--name", "account-auth-api", "--restart"])
        self.assertIn("8001:8000", run_command)
        updated_state = json.loads(current_state_path.read_text(encoding="utf8"))
        self.assertFalse(updated_state["repairRequired"])
        self.assertIn("lastSelfHeal", updated_state)
        self.assertEqual(updated_state["lastSelfHeal"]["services"], ["service-account-access"])
        self.assertNotIn("lastDetectedDrift", updated_state)

    def test_assert_release_ready_blocks_when_host_requires_repair(self) -> None:
        current_state_path = self.state_dir / "current-state.json"
        current_state_path.parent.mkdir(parents=True, exist_ok=True)
        current_state_path.write_text(
            json.dumps(
                {
                    "environment": "dev",
                    "repairRequired": True,
                    "repairRequiredReason": "rollback failed",
                    "updatedAt": "2026-04-16T12:00:00+09:00",
                    "services": {},
                }
            ),
            encoding="utf8",
        )

        with (
            patch.object(app_host, "BASE_DIR", self.base_dir),
            patch.object(app_host, "RECONCILE_LOCK_PATH", self.reconcile_lock_path),
        ):
            with self.assertRaisesRegex(RuntimeError, "requires repair before the next release can start: rollback failed"):
                app_host.assert_app_release_ready()

    def test_assert_release_ready_blocks_when_runtime_drift_is_detected(self) -> None:
        current_state_path = self.state_dir / "current-state.json"
        current_state_path.parent.mkdir(parents=True, exist_ok=True)
        current_state_path.write_text(
            json.dumps(
                {
                    "environment": "dev",
                    "repairRequired": False,
                    "updatedAt": "2026-04-16T12:00:00+09:00",
                    "services": {
                        "service-account-access": {
                            "exists": True,
                            "serviceName": "service-account-access",
                            "imageUri": "repo/account:sha-account-old",
                            "containerName": "account-auth-api",
                            "containerPort": 8000,
                            "hostPort": 8001,
                            "runtimeSpec": {
                                "containerName": "account-auth-api",
                                "containerPort": 8000,
                                "hostPort": 8001,
                                "environment": {"ACCOUNT_MODE": "live"},
                                "secretArns": {},
                            },
                            "envHash": "sha256:expected",
                            "updatedAt": "2026-04-16T12:00:00+09:00",
                        }
                    },
                }
            ),
            encoding="utf8",
        )
        env_path = self.service_env_dir / "account-auth-api.env"
        env_path.parent.mkdir(parents=True, exist_ok=True)
        env_path.write_text("ACCOUNT_MODE=live\n", encoding="utf8")

        with (
            patch.object(app_host, "BASE_DIR", self.base_dir),
            patch.object(app_host, "SERVICE_ENV_DIR", self.service_env_dir),
            patch.object(app_host, "RECONCILE_LOCK_PATH", self.reconcile_lock_path),
            patch.object(app_host, "run_output", side_effect=self._run_output_drift_detected),
        ):
            with self.assertRaisesRegex(RuntimeError, "runtime drift detected"):
                app_host.assert_app_release_ready()

        updated_state = json.loads(current_state_path.read_text(encoding="utf8"))
        self.assertTrue(updated_state["repairRequired"])
        self.assertIn("runtime drift detected", updated_state["repairRequiredReason"])
        self.assertEqual(updated_state["lastDetectedDrift"]["services"][0]["service"], "service-account-access")
        self.assertEqual(updated_state["lastDetectedDrift"]["services"][0]["severity"], "medium")
        self.assertIn("image_mismatch", updated_state["lastDetectedDrift"]["services"][0]["reasons"])

    def test_rollback_release_replays_reverse_wave_plan(self) -> None:
        commands: list[list[str]] = []
        writes: dict[str, str] = {}
        self.runtime_images_path.write_text(
            json.dumps(
                {
                    "service-account-access": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-new",
                    "edge-api-gateway": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway-new",
                }
            ),
            encoding="utf8",
        )
        current_state_path = self.state_dir / "current-state.json"
        current_state_path.parent.mkdir(parents=True, exist_ok=True)
        current_state_path.write_text(
            json.dumps(
                {
                    "environment": "dev",
                    "repairRequired": False,
                    "updatedAt": "2026-04-16T12:00:00+09:00",
                    "services": {
                        "service-account-access": {"exists": True, "imageUri": "repo/account:new"},
                        "edge-api-gateway": {"exists": True, "imageUri": "repo/gateway:new"},
                    },
                }
            ),
            encoding="utf8",
        )
        release_journal_path = self.state_dir / "releases" / "release-rollback.json"
        release_journal_path.parent.mkdir(parents=True, exist_ok=True)
        release_journal_path.write_text(
            json.dumps(
                {
                    "releaseId": "release-rollback",
                    "status": "failed",
                    "waves": [
                        {"wave": 1, "label": "backend", "status": "applied", "services": ["service-account-access"]},
                        {"wave": 3, "label": "edge", "status": "failed", "services": ["edge-api-gateway"]},
                    ],
                    "rollbackPlan": {
                        "releaseId": "release-rollback-rollback",
                        "direction": "rollback",
                        "waves": [
                            {
                                "wave": 1,
                                "label": "backend",
                                "services": [
                                    {
                                        "service": "service-account-access",
                                        "action": "deploy",
                                        "imageUri": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old",
                                        "runtimeSpec": {
                                            "containerName": "account-auth-api-legacy",
                                            "containerPort": 9000,
                                            "hostPort": 9001,
                                            "environment": {"ACCOUNT_MODE": "legacy"},
                                            "secretArns": {"TOKEN": "arn:aws:secretsmanager:legacy-token"},
                                        },
                                    }
                                ],
                            },
                            {
                                "wave": 3,
                                "label": "edge",
                                "services": [
                                    {
                                        "service": "edge-api-gateway",
                                        "action": "deploy",
                                        "imageUri": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway-old",
                                        "runtimeSpec": {
                                            "containerName": "edge-api-gateway-legacy",
                                            "containerPort": 9080,
                                            "hostPort": 9080,
                                            "environment": {"GATEWAY_PROFILE": "legacy"},
                                            "secretArns": {},
                                        },
                                    }
                                ],
                            },
                        ],
                    },
                }
            ),
            encoding="utf8",
        )

        with (
            patch.object(app_host, "BASE_DIR", self.base_dir),
            patch.object(app_host, "RUNTIME_IMAGES_PATH", self.runtime_images_path),
            patch.object(app_host, "SERVICE_ENV_DIR", self.service_env_dir),
            patch.object(app_host, "RECONCILE_LOCK_PATH", self.reconcile_lock_path),
            patch.object(app_host, "require_env", side_effect=self._env_lookup_runtime_with_gateway),
            patch.object(app_host, "optional_env", return_value="dev"),
            patch.object(app_host, "run_output", side_effect=self._run_output_runtime_with_gateway),
            patch.object(app_host, "run", side_effect=lambda command, input_text=None: commands.append(list(command))),
            patch.object(app_host, "write_text", side_effect=lambda path, contents: self._write_text(path, contents, writes)),
        ):
            exit_code = app_host.rollback_app_release("release-rollback", "wave smoke failed")

        self.assertEqual(exit_code, 0)
        self.assertLess(commands.index(["docker", "rm", "-f", "edge-api-gateway"]), commands.index(["docker", "rm", "-f", "account-auth-api"]))
        self.assertIn(["docker", "rm", "-f", "edge-api-gateway"], commands)
        self.assertIn(["docker", "rm", "-f", "account-auth-api"], commands)
        gateway_run = next(command for command in commands if command[:6] == ["docker", "run", "-d", "--name", "edge-api-gateway-legacy", "--restart"])
        account_run = next(command for command in commands if command[:6] == ["docker", "run", "-d", "--name", "account-auth-api-legacy", "--restart"])
        self.assertIn("9080:9080", gateway_run)
        self.assertIn("9001:9000", account_run)
        self.assertIn(str(self.service_env_dir / "edge-api-gateway-legacy.env"), gateway_run)
        self.assertIn(str(self.service_env_dir / "account-auth-api-legacy.env"), account_run)
        current_state = json.loads((self.state_dir / "current-state.json").read_text(encoding="utf8"))
        self.assertFalse(current_state["repairRequired"])
        self.assertEqual(current_state["services"]["service-account-access"]["imageUri"], "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old")
        self.assertEqual(current_state["services"]["service-account-access"]["containerName"], "account-auth-api-legacy")
        self.assertEqual(current_state["services"]["service-account-access"]["runtimeSpec"]["environment"], {"ACCOUNT_MODE": "legacy"})
        self.assertEqual(current_state["services"]["edge-api-gateway"]["containerName"], "edge-api-gateway-legacy")
        updated_journal = json.loads(release_journal_path.read_text(encoding="utf8"))
        self.assertEqual(updated_journal["status"], "rolled_back")
        self.assertEqual(updated_journal["waves"][0]["status"], "rolled_back")
        self.assertEqual(updated_journal["waves"][1]["status"], "rolled_back")

    def _env_lookup(self, name: str) -> str:
        values = {
            "AWS_REGION": "ap-northeast-2",
            "IMAGE_MAP_PARAM": "/runtime/image-map",
            "SERVICE_MANIFEST_SECRET_ARN": "arn:aws:secretsmanager:service-manifest",
            "SERVICE_SECRET_MAP_SECRET_ARN": "arn:aws:secretsmanager:secret-map",
        }
        return values[name]

    def _env_lookup_remove(self, name: str) -> str:
        values = {
            "AWS_REGION": "ap-northeast-2",
            "IMAGE_MAP_PARAM": "/runtime/image-map",
            "SERVICE_MANIFEST_SECRET_ARN": "arn:aws:secretsmanager:service-manifest",
            "SERVICE_SECRET_MAP_SECRET_ARN": "arn:aws:secretsmanager:secret-map",
        }
        return values[name]

    def _env_lookup_runtime_with_gateway(self, name: str) -> str:
        values = {
            "AWS_REGION": "ap-northeast-2",
            "IMAGE_MAP_PARAM": "/runtime/image-map",
            "SERVICE_MANIFEST_SECRET_ARN": "arn:aws:secretsmanager:service-manifest",
            "SERVICE_SECRET_MAP_SECRET_ARN": "arn:aws:secretsmanager:secret-map",
        }
        return values[name]

    def _release_manifest_json(self) -> str:
        return json.dumps(
            {
                "releaseId": "dev-account-access",
                "wave": 1,
                "waveLabel": "independent-backend-services",
                "services": [
                    {
                        "service": "service-account-access",
                        "action": "deploy",
                        "imageUri": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-new",
                    }
                ],
            }
        )

    def _release_manifest_json_remove(self) -> str:
        return json.dumps(
            {
                "releaseId": "dev-account-access-remove",
                "wave": 1,
                "waveLabel": "independent-backend-services",
                "services": [
                    {
                        "service": "service-account-access",
                        "action": "remove",
                    }
                ],
            }
        )

    def _run_output(self, command: list[str]) -> str:
        if command[1:3] == ["ssm", "get-parameter"]:
            return json.dumps(
                {
                    "front-web-console": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front-old",
                    "service-account-access": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old",
                }
            )

        if command[1:3] == ["ecr", "get-login-password"]:
            return "password"

        if command[1:3] == ["secretsmanager", "get-secret-value"]:
            if any("secret-map" in part for part in command):
                return json.dumps({"ACCOUNT_ACCESS__TOKEN": "arn:aws:secretsmanager:token"})
            if any("service-manifest" in part for part in command):
                return json.dumps(
                    [
                        {
                            "id": "FRONT",
                            "imageMapKey": "front-web-console",
                            "containerName": "web-console",
                            "enabled": True,
                            "containerPort": 5174,
                            "hostPort": 5174,
                            "environment": {},
                            "secretKeys": [],
                        },
                        {
                            "id": "ACCOUNT_ACCESS",
                            "imageMapKey": "service-account-access",
                            "containerName": "account-auth-api",
                            "enabled": True,
                            "containerPort": 8000,
                            "hostPort": 8001,
                            "environment": {"ACCOUNT_MODE": "live"},
                            "secretKeys": ["TOKEN"],
                        },
                    ]
                )
            if any("token" in part for part in command):
                return "resolved-token"

        raise AssertionError(f"Unexpected command: {command}")

    def _run_output_remove(self, command: list[str]) -> str:
        if command[1:3] == ["ssm", "get-parameter"]:
            return json.dumps(
                {
                    "front-web-console": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/front-web-console:sha-front-old",
                    "service-account-access": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-old",
                }
            )

        if command[1:3] == ["secretsmanager", "get-secret-value"]:
            if any("secret-map" in part for part in command):
                return json.dumps({})
            if any("service-manifest" in part for part in command):
                return json.dumps(
                    [
                        {
                            "id": "FRONT",
                            "imageMapKey": "front-web-console",
                            "containerName": "web-console",
                            "enabled": True,
                            "containerPort": 5174,
                            "hostPort": 5174,
                            "environment": {},
                            "secretKeys": [],
                        },
                        {
                            "id": "ACCOUNT_ACCESS",
                            "imageMapKey": "service-account-access",
                            "containerName": "account-auth-api",
                            "enabled": True,
                            "containerPort": 8000,
                            "hostPort": 8001,
                            "environment": {},
                            "secretKeys": [],
                        },
                    ]
                )
            if any("legacy-token" in part for part in command):
                return "legacy-token-value"

        raise AssertionError(f"Unexpected command: {command}")

    def _run_output_runtime_with_gateway(self, command: list[str]) -> str:
        if command[1:3] == ["ssm", "get-parameter"]:
            return json.dumps(
                {
                    "service-account-access": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/service-account-access:sha-account-new",
                    "edge-api-gateway": "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/edge-api-gateway:sha-gateway-new",
                }
            )

        if command[1:3] == ["ecr", "get-login-password"]:
            return "password"

        if command[1:3] == ["docker", "image"]:
            target = command[3]
            return json.dumps([f"{target.replace(':', '@sha256:')}"])

        if command[1:3] == ["secretsmanager", "get-secret-value"]:
            if any("secret-map" in part for part in command):
                return json.dumps({})
            if any("service-manifest" in part for part in command):
                return json.dumps(
                    [
                        {
                            "id": "ACCOUNT_ACCESS",
                            "imageMapKey": "service-account-access",
                            "containerName": "account-auth-api",
                            "enabled": True,
                            "containerPort": 8000,
                            "hostPort": 8001,
                            "environment": {},
                            "secretKeys": [],
                        },
                        {
                            "id": "GATEWAY",
                            "imageMapKey": "edge-api-gateway",
                            "containerName": "edge-api-gateway",
                            "enabled": True,
                            "containerPort": 8080,
                            "hostPort": 8080,
                            "environment": {},
                            "secretKeys": [],
                        },
                    ]
                )
            if any("legacy-token" in part for part in command):
                return "legacy-token-value"

        raise AssertionError(f"Unexpected command: {command}")

    def _write_text(self, path: Path, contents: str, writes: dict[str, str]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(contents, encoding="utf8")
        writes[str(path)] = contents

    def _run_output_drift_detected(self, command: list[str]) -> str:
        if command[:3] == ["docker", "inspect", "--type"]:
            return json.dumps(
                [
                    {
                        "Name": "/account-auth-api",
                        "Config": {"Image": "repo/account:sha-account-new"},
                        "State": {"Running": True, "Status": "running"},
                        "NetworkSettings": {
                            "Ports": {
                                "8000/tcp": [{"HostPort": "8001"}],
                            }
                        },
                    }
                ]
            )

        raise AssertionError(f"Unexpected command: {command}")


if __name__ == "__main__":
    unittest.main()
