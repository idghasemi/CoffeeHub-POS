$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw "Python is required." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is required." }

Set-Location $Backend
python -m venv .venv
& (Join-Path $Backend ".venv\Scripts\python.exe") -m pip install --upgrade pip
& (Join-Path $Backend ".venv\Scripts\python.exe") -m pip install -e .

Set-Location $Frontend
npm ci

$ExampleEnv = Join-Path $Root ".env.example"
$EnvFile = Join-Path $Root ".env"
if ((Test-Path $ExampleEnv) -and -not (Test-Path $EnvFile)) {
  Copy-Item $ExampleEnv $EnvFile
  Write-Host "Created .env from .env.example; replace secrets before production."
}
Write-Host "CoffeeHub dependencies installed successfully."
