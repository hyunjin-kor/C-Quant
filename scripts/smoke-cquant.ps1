param(
    [ValidateSet("dir", "portable", "all")]
    [string]$Mode = "all",
    [int]$StartupTimeoutSec = 25,
    [int]$StableSeconds = 4
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$stopScript = Join-Path $PSScriptRoot "stop-running-cquant.ps1"

function Invoke-CleanShutdown {
    & $stopScript | Out-Host
    Start-Sleep -Milliseconds 400
}

function Find-CQuantWindowProcess {
    $targets = @("C-Quant", "C-Quant-0.1.0")

    return Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $targets -contains $_.ProcessName -and $_.MainWindowHandle -ne 0 -and -not [string]::IsNullOrWhiteSpace($_.MainWindowTitle)
    } | Select-Object -First 1
}

function Wait-ForWindowProcess {
    param(
        [System.Diagnostics.Process]$Process,
        [int]$TimeoutSec
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)

    while ((Get-Date) -lt $deadline) {
        $Process.Refresh()

        if ($Process.HasExited) {
            $windowProcess = Find-CQuantWindowProcess

            if ($null -ne $windowProcess) {
                return $windowProcess
            }

            throw "Process exited before creating a window. Exit code: $($Process.ExitCode)"
        }

        if ($Process.MainWindowHandle -ne 0 -and -not [string]::IsNullOrWhiteSpace($Process.MainWindowTitle)) {
            return $Process.MainWindowTitle
        }

        $windowProcess = Find-CQuantWindowProcess

        if ($null -ne $windowProcess) {
            return $windowProcess
        }

        Start-Sleep -Milliseconds 500
    }

    throw "Timed out waiting for the main window after ${TimeoutSec}s."
}

function Assert-StableProcess {
    param(
        [System.Diagnostics.Process]$Process,
        [int]$StableSeconds
    )

    $deadline = (Get-Date).AddSeconds($StableSeconds)

    while ((Get-Date) -lt $deadline) {
        $Process.Refresh()

        if ($Process.HasExited) {
            throw "Process exited during the ${StableSeconds}s stability window. Exit code: $($Process.ExitCode)"
        }

        Start-Sleep -Milliseconds 500
    }
}

function Test-CQuantExecutable {
    param(
        [string]$Label,
        [string]$ExecutablePath
    )

    if (-not (Test-Path -LiteralPath $ExecutablePath)) {
        throw "Missing executable for '$Label': $ExecutablePath"
    }

    Write-Host "[INFO] Starting smoke check for $Label"
    Invoke-CleanShutdown

    $process = $null

    try {
        $process = Start-Process -FilePath $ExecutablePath -WorkingDirectory (Split-Path -Parent $ExecutablePath) -PassThru
        $windowProcess = Wait-ForWindowProcess -Process $process -TimeoutSec $StartupTimeoutSec

        if ($windowProcess -is [string]) {
            $windowTitle = $windowProcess
            $stableProcess = $process
        }
        else {
            $windowTitle = $windowProcess.MainWindowTitle
            $stableProcess = $windowProcess
        }

        Assert-StableProcess -Process $stableProcess -StableSeconds $StableSeconds

        [pscustomobject]@{
            label = $Label
            path = $ExecutablePath
            pid = $stableProcess.Id
            title = $windowTitle
            startup_timeout_sec = $StartupTimeoutSec
            stable_seconds = $StableSeconds
            status = "passed"
        }
    }
    finally {
        Invoke-CleanShutdown
    }
}

$targets = switch ($Mode) {
    "dir" {
        @(
            [pscustomobject]@{
                label = "win-unpacked"
                path = Join-Path $repoRoot "release\win-unpacked\C-Quant.exe"
            }
        )
    }
    "portable" {
        @(
            [pscustomobject]@{
                label = "portable"
                path = Join-Path $repoRoot "release\C-Quant-0.1.0.exe"
            }
        )
    }
    default {
        @(
            [pscustomobject]@{
                label = "win-unpacked"
                path = Join-Path $repoRoot "release\win-unpacked\C-Quant.exe"
            },
            [pscustomobject]@{
                label = "portable"
                path = Join-Path $repoRoot "release\C-Quant-0.1.0.exe"
            }
        )
    }
}

$results = @()

foreach ($target in $targets) {
    $results += Test-CQuantExecutable -Label $target.label -ExecutablePath $target.path
}

Write-Host ""
Write-Host "Smoke summary"
$results | ForEach-Object {
    Write-Host ("[PASS] {0} | title: {1} | pid: {2}" -f $_.label, $_.title, $_.pid)
}
