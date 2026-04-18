param(
    [ValidateSet("start", "resume", "pause", "stop", "idle", "status")]
    [string]$Action = "status",
    [string]$Reason = "",
    [string]$ResumeCommand = "",
    [string]$SessionName = "",
    [switch]$NoStopOnUserReturn
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Release-Lease {
    param([Parameter(Mandatory = $true)]$Control)

    $Control.lease.owner = $null
    $Control.lease.acquired_at = $null
    $Control.lease.expires_at = $null
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
. (Join-Path $PSScriptRoot "autonomy-common.ps1")
$paths = Get-AutonomyPaths -RepoRoot $repoRoot
$controlPath = $paths.Control

if (-not (Test-Path $controlPath)) {
    throw "Missing .autonomy/control.json. Initialize the autonomy scaffold first."
}

$control = Get-Content $controlPath -Raw | ConvertFrom-Json
$backlog = Read-JsonObject -Path $paths.Backlog
$control = Initialize-ControlSchema -Control $control -RepoRoot $repoRoot
$shouldPersist = $true
$eventType = $null
$eventPayload = $null

switch ($Action) {
    "start" {
        $control.mode = "running"
        $control.stop_on_user_return = (-not $NoStopOnUserReturn.IsPresent)
        $control.last_resume_command = if ($ResumeCommand) { $ResumeCommand } else { "autonomous-mode-start" }
        $control.last_stop_reason = ""
        $control.active_task_id = $null
        $control.session_id = "session-" + (Get-Date -Format "yyyyMMdd-HHmmss")
        if ($SessionName) {
            $control.session_name = $SessionName
        } elseif (-not $control.session_name) {
            $control.session_name = ((Split-Path $repoRoot -Leaf) + "-autonomy")
        }
        Release-Lease -Control $control
        $eventType = "control.started"
        $eventPayload = @{
            resume_command = $control.last_resume_command
            stop_on_user_return = $control.stop_on_user_return
            session_name = $control.session_name
        }
    }
    "resume" {
        $control.mode = "running"
        $control.stop_on_user_return = (-not $NoStopOnUserReturn.IsPresent)
        $control.last_resume_command = if ($ResumeCommand) { $ResumeCommand } else { "autonomous-mode-resume" }
        $control.last_stop_reason = ""
        if ($SessionName) {
            $control.session_name = $SessionName
        }
        Release-Lease -Control $control
        $eventType = "control.resumed"
        $eventPayload = @{
            resume_command = $control.last_resume_command
            stop_on_user_return = $control.stop_on_user_return
            session_name = $control.session_name
        }
    }
    "pause" {
        $control.mode = "paused"
        $control.last_stop_reason = if ($Reason) { $Reason } else { "Paused by operator" }
        Release-Lease -Control $control
        $eventType = "control.paused"
        $eventPayload = @{
            reason = $control.last_stop_reason
        }
    }
    "stop" {
        $control.mode = "stopped"
        $control.last_stop_reason = if ($Reason) { $Reason } else { "Stopped by operator" }
        $control.active_task_id = $null
        Release-Lease -Control $control
        $eventType = "control.stopped"
        $eventPayload = @{
            reason = $control.last_stop_reason
        }
    }
    "idle" {
        $control.mode = "idle"
        $control.last_stop_reason = if ($Reason) { $Reason } else { "Returned to idle by operator" }
        $control.active_task_id = $null
        Release-Lease -Control $control
        $eventType = "control.idled"
        $eventPayload = @{
            reason = $control.last_stop_reason
        }
    }
    "status" {
        $shouldPersist = $false
    }
}

if ($shouldPersist) {
    $control.updated_at = Get-IsoTimestamp
    Update-StuckDetection -RepoRoot $repoRoot -Control $control | Out-Null
    if ($eventType) {
        Add-AutonomyEvent -RepoRoot $repoRoot -Control $control -Type $eventType -Payload $eventPayload | Out-Null
    }
    Write-Utf8Json -Path $controlPath -Value $control
    Write-AutonomyBaseState -RepoRoot $repoRoot -Control $control -Backlog $backlog -Latest @{
        source = "control"
        action = $Action
        reason = $control.last_stop_reason
    }
}

$statusLines = @(
    "mode: $($control.mode)",
    "session_name: $($control.session_name)",
    "stop_on_user_return: $($control.stop_on_user_return)",
    "active_task_id: $($control.active_task_id)",
    "cycle_count: $($control.cycle_count)",
    "last_resume_command: $($control.last_resume_command)",
    "last_stop_reason: $($control.last_stop_reason)",
    "updated_at: $($control.updated_at)"
)

Write-Host ($statusLines -join [Environment]::NewLine)
