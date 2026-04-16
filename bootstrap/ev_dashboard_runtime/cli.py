from __future__ import annotations

import argparse
import sys

from ev_dashboard_runtime.app_host import (
    assert_app_release_ready,
    finalize_app_release,
    mark_app_release_failed,
    rollback_app_release,
    reconcile_app,
    verify_app,
)
from ev_dashboard_runtime.data_host import bootstrap_data, verify_data


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ev-dashboard-runtime")
    parser.add_argument(
        "command",
        choices=[
            "verify-app",
            "verify-data",
            "reconcile-app",
            "bootstrap-data",
            "assert-app-release-ready",
            "finalize-app-release",
            "mark-app-release-failed",
            "rollback-app-release",
        ],
    )
    parser.add_argument("--release-id")
    parser.add_argument("--reason")
    parser.add_argument("--through-wave", type=int)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.command == "verify-app":
        return verify_app()
    if args.command == "verify-data":
        return verify_data()
    if args.command == "reconcile-app":
        return reconcile_app()
    if args.command == "bootstrap-data":
        return bootstrap_data()
    if args.command == "assert-app-release-ready":
        return assert_app_release_ready()
    if args.command == "finalize-app-release":
        if not args.release_id:
            raise RuntimeError("--release-id is required for finalize-app-release")
        return finalize_app_release(args.release_id)
    if args.command == "mark-app-release-failed":
        if not args.release_id:
            raise RuntimeError("--release-id is required for mark-app-release-failed")
        return mark_app_release_failed(args.release_id, args.reason or "")
    if args.command == "rollback-app-release":
        if not args.release_id:
            raise RuntimeError("--release-id is required for rollback-app-release")
        return rollback_app_release(args.release_id, args.reason or "", args.through_wave)

    raise RuntimeError(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
