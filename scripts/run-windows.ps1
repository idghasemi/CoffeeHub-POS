$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) { throw "Run scripts\setup-windows.ps1 first." }

$BackendProcess = Start-Process -PassThru -NoNewWindow -FilePath $Python -WorkingDirectory $Backend -ArgumentList @(
  "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"
)
try {
  Set-Location $Frontend
  npm run dev -- --host 127.0.0.1
}
finally {
  if ($BackendProcess -and -not $BackendProcess.HasExited) { Stop-Process -Id $BackendProcess.Id -Force }
}
