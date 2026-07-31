#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

cd "$BACKEND"
PYTHON="python3"
[[ -x .venv/bin/python ]] && PYTHON=.venv/bin/python
"$PYTHON" -m compileall -q .
if "$PYTHON" -c "import pytest" >/dev/null 2>&1; then
  "$PYTHON" -m pytest -q
fi

cd "$FRONTEND"
npm run build

if npm run --silent 2>/dev/null | grep -q lint; then
  npm run lint
fi

echo "Release verification passed."
