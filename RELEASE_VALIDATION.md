# CoffeeHub release validation

| Check | Command | Status | Note |
|---|---|---|---|
| ✅ python-compileall | `python -m compileall -q` | passed |  |
| ✅ create-python-venv | `/opt/pyvenv/bin/python -m venv /mnt/data/.coffeehub-release-venv` | passed |  |
| ✅ upgrade-pip | `pip install --upgrade pip` | passed |  |
| ⚠️ install-backend-dependencies | `—` | warning | No requirements.txt or pyproject.toml found |
| ❌ fastapi-import | `import main:app` | failed |  |
| ❌ backend-import-scan | `import all backend modules` | failed |  |
| ❌ backend-tests | `pytest -q` | failed |  |
| ❌ frontend-dependencies | `npm ci --prefer-offline --no-audit --no-fund` | failed |  |
| ✅ acceptance-login-ui | `semantic release audit` | passed |  |
| ✅ acceptance-seeded-admin | `semantic release audit` | passed | initial compatibility accounts found |
| ✅ acceptance-role-guards | `semantic release audit` | passed |  |
| ✅ acceptance-customer-gender | `semantic release audit` | passed |  |
| ✅ acceptance-wallet-ledger | `semantic release audit` | passed |  |
| ✅ acceptance-payment-methods | `semantic release audit` | passed |  |
| ✅ acceptance-invoice-history | `semantic release audit` | passed |  |
| ✅ acceptance-jpg-export | `semantic release audit` | passed |  |
| ✅ acceptance-print-pdf | `semantic release audit` | passed |  |
| ✅ acceptance-persian-date | `semantic release audit` | passed |  |
| ✅ acceptance-gender-sales-report | `semantic release audit` | passed |  |
| ✅ acceptance-backup-download-restore | `semantic release audit` | passed |  |
| ❌ acceptance-idempotency | `semantic release audit` | failed | financial retry protection |
| ❌ acceptance-write-locking | `semantic release audit` | failed | SQLite mutable reads occur after write lock |
| ✅ acceptance-no-settings-route | `semantic release audit` | passed | settings route/navigation removed |
| ❌ acceptance-no-direct-async-jpg-handler | `semantic release audit` | failed | no unobserved async JPG event promise |
| ✅ acceptance-admin-own-password-flow | `semantic release audit` | passed | current administrator uses verified personal change flow |
| ✅ acceptance-docs | `semantic release audit` | passed |  |
| ✅ acceptance-linux-windows-scripts | `semantic release audit` | passed |  |
| ✅ acceptance-clean-runtime-data | `semantic release audit` | passed |  |

## Mandatory failures

```json
[
  {
    "name": "fastapi-import",
    "command": "import main:app",
    "status": "failed",
    "returncode": 1,
    "note": ""
  },
  {
    "name": "backend-import-scan",
    "command": "import all backend modules",
    "status": "failed",
    "returncode": 1,
    "note": ""
  },
  {
    "name": "backend-tests",
    "command": "pytest -q",
    "status": "failed",
    "returncode": 1,
    "note": ""
  },
  {
    "name": "frontend-dependencies",
    "command": "npm ci --prefer-offline --no-audit --no-fund",
    "status": "failed",
    "returncode": 1,
    "note": ""
  }
]
```

## Acceptance findings

```json
[
  {
    "name": "acceptance-idempotency",
    "command": "semantic release audit",
    "status": "failed",
    "returncode": 1,
    "note": "financial retry protection"
  },
  {
    "name": "acceptance-write-locking",
    "command": "semantic release audit",
    "status": "failed",
    "returncode": 1,
    "note": "SQLite mutable reads occur after write lock"
  },
  {
    "name": "acceptance-no-direct-async-jpg-handler",
    "command": "semantic release audit",
    "status": "failed",
    "returncode": 1,
    "note": "no unobserved async JPG event promise"
  }
]
```
