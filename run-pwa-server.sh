#!/usr/bin/env bash
# Start the FastAPI + PWA server using the project venv (not system uvicorn).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${ROOT}"
exec "${ROOT}/venv/bin/python" -m uvicorn danger_detection.app.pwa_server:app \
  --host 127.0.0.1 --port 8000 "$@"
