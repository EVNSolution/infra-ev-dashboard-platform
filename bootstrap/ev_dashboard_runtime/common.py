from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Iterable, Sequence


def run(command: Sequence[str], *, input_text: str | None = None) -> None:
    subprocess.run(list(command), check=True, text=True, input=input_text)


def run_output(command: Sequence[str]) -> str:
    completed = subprocess.run(list(command), check=True, text=True, capture_output=True)
    return completed.stdout.strip()


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def optional_env(name: str) -> str:
    return os.environ.get(name, "").strip()


def write_text(path: Path, contents: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents, encoding="utf8")


def load_json_env(name: str):
    return json.loads(require_env(name))
