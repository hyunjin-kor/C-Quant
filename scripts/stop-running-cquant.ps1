$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$targets = @("C-Quant", "C-Quant-0.1.0")
$processes = Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $targets -contains $_.ProcessName
}

if (-not $processes) {
    Write-Host "No running C-Quant process found."
    exit 0
}

$processes | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 500
Write-Host ("Stopped {0} running C-Quant process(es)." -f $processes.Count)
