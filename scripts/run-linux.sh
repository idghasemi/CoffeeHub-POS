#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

if [[ ! -x "$BACKEND/.venv/bin/python" ]]; then
  echo "Run ./scripts/setup-linux.sh first." >&2
  exit 1
fi

cleanup() {
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$BACKEND"
"$BACKEND/.venv/bin/python" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

cd "$FRONTEND"
npm run dev -- --host 127.0.0.1
