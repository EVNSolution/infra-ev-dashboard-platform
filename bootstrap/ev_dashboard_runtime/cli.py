from __future__ import annotations

import argparse
import sys

from ev_dashboard_runtime.app_host import reconcile_app, verify_app
from ev_dashboard_runtime.data_host import bootstrap_data, verify_data


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ev-dashboard-runtime")
    parser.add_argument(
        "command",
        choices=["verify-app", "verify-data", "reconcile-app", "bootstrap-data"],
    )
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

    raise RuntimeError(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
