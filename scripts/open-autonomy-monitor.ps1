param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$serverScript = Join-Path $repoRoot "tools\autonomy-monitor\server.mjs"
$url = "http://127.0.0.1:4781"

function Test-Monitor {
    try {
        $response = Invoke-WebRequest -Uri "$url/api/status" -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Stop-ExistingMonitor {
    $matching = Get-CimInstance Win32_Process |
        Where-Object {
            $_.Name -eq "node.exe" -and (
                $_.CommandLine -like "*autonomy-monitor/server.mjs*" -or
                $_.CommandLine -like "*autonomy-monitor\\server.mjs*"
            )
        }

    foreach ($process in $matching) {
        Stop-Process -Id $process.ProcessId -Force
    }
}

if (-not (Test-Path $serverScript)) {
    throw "Missing monitor server at $serverScript"
}

Stop-ExistingMonitor
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Set-Location '$repoRoot'; node '$serverScript'"
) | Out-Null

Start-Sleep -Seconds 2

if (-not (Test-Monitor)) {
    throw "Autonomy monitor failed to start at $url"
}

Start-Process $url | Out-Null
Write-Host "Autonomy monitor opened at $url"
