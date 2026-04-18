param(
    [string]$Goal = "Advance the highest-priority unchecked item in docs/autonomy-state.md",
    [string]$Focus = "",
    [switch]$WithPackaging,
    [switch]$SkipBuild,
    [string]$StateFile = "docs/autonomy-state.md",
    [string]$OutputDir = ".autonomy"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot "autonomy-common.ps1")

function Write-Utf8File {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $directory = Split-Path -Parent $Path
    if ($directory) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Get-FirstOpenQueueItem {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return $null
    }

    foreach ($line in Get-Content $Path) {
        if ($line -match '^- \[ \] (.+)$') {
            return $matches[1].Trim()
        }
    }

    return $null
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][scriptblock]$Action
    )

    $startedAt = Get-Date
    $output = ""
    $exitCode = 0

    try {
        $output = (& $Action | Out-String)
        if ($LASTEXITCODE -ne $null) {
            $exitCode = $LASTEXITCODE
        }
    } catch {
        $output = ($_ | Out-String)
        $exitCode = 1
    }

    $duration = [math]::Round(((Get-Date) - $startedAt).TotalSeconds, 2)
    $trimmedOutput = $output.TrimEnd()
    if (-not $trimmedOutput) {
        $trimmedOutput = "(no output)"
    }

    return New-Object psobject -Property @{
        Label = $Label
        Success = ($exitCode -eq 0)
        ExitCode = $exitCode
        DurationSeconds = $duration
        Output = $trimmedOutput
    }
}

function Update-StateSnapshot {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Snapshot
    )

    $startMarker = "<!-- AUTONOMY:LAST-RUN:START -->"
    $endMarker = "<!-- AUTONOMY:LAST-RUN:END -->"
    $content = Get-Content $Path -Raw
    $replacement = ($startMarker, $Snapshot.TrimEnd(), $endMarker) -join "`r`n"

    if ($content.Contains($startMarker) -and $content.Contains($endMarker)) {
        $pattern = [regex]::Escape($startMarker) + '.*?' + [regex]::Escape($endMarker)
        $updated = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    } else {
        $updated = ($content.TrimEnd(), "", "## Latest Cycle Snapshot", $replacement) -join "`r`n"
    }

    Write-Utf8File -Path $Path -Content $updated
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$statePath = (Resolve-Path (Join-Path $repoRoot $StateFile)).Path
$outputRoot = Join-Path $repoRoot $OutputDir
$paths = Get-AutonomyPaths -RepoRoot $repoRoot
$control = Read-JsonObject -Path $paths.Control
$backlog = Read-JsonObject -Path $paths.Backlog
$control = Initialize-ControlSchema -Control $control -RepoRoot $repoRoot
$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
$commit = (git rev-parse --short HEAD).Trim()
$gitStatusLines = @(git status --short)
$dirtyCount = $gitStatusLines.Count
$firstOpenItem = Get-FirstOpenQueueItem -Path $statePath
$focusText = if ($Focus) { $Focus } else { "none specified" }
$queueText = if ($firstOpenItem) { $firstOpenItem } else { "no unchecked queue item found" }
$latestRelativePath = ($OutputDir.TrimEnd('\') + "/latest-cycle.md")

New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null

$currentTaskRecord = Get-CurrentTaskRecord -Control $control -Backlog $backlog
if (-not $control.active_task_id -and $null -ne $currentTaskRecord) {
    $control.active_task_id = $currentTaskRecord.id
}
$control.updated_at = Get-IsoTimestamp
Add-AutonomyEvent -RepoRoot $repoRoot -Control $control -Type "cycle.started" -Payload @{
    goal = $Goal
    focus = $Focus
    with_packaging = $WithPackaging.IsPresent
    skip_build = $SkipBuild.IsPresent
    branch = $branch
    commit = $commit
} | Out-Null
Write-Utf8Json -Path $paths.Control -Value $control
Write-AutonomyBaseState -RepoRoot $repoRoot -Control $control -Backlog $backlog -Latest @{
    goal = $Goal
    focus = $Focus
    phase = "cycle.started"
}

$results = @()
if (-not $SkipBuild) {
    $results += Invoke-Step -Label "build" -Action { & cmd.exe /c "npm.cmd run build 2>&1" }
}

if ($WithPackaging) {
    $results += Invoke-Step -Label "package:dir" -Action { & cmd.exe /c "npm.cmd run package:dir 2>&1" }
    $results += Invoke-Step -Label "package:portable" -Action { & cmd.exe /c "npm.cmd run package:portable 2>&1" }
}

$failedResults = @($results | Where-Object { -not $_.Success })
$overallStatus = if ($failedResults.Count -eq 0) { "green" } else { "attention" }

$verificationLines = @()
if ($results.Count -eq 0) {
    $verificationLines += "- No verification command was executed."
} else {
    foreach ($result in $results) {
        $status = if ($result.Success) { "passed" } else { "failed (exit $($result.ExitCode))" }
        $verificationLines += ('- `{0}`: {1} in {2}s' -f ('npm.cmd run ' + $result.Label), $status, $result.DurationSeconds)
        Add-AutonomyEvent -RepoRoot $repoRoot -Control $control -Type "verification.step" -Payload @{
            label = $result.Label
            success = $result.Success
            exit_code = $result.ExitCode
            duration_seconds = $result.DurationSeconds
        } | Out-Null
    }
}

$gitStatusBlock = if ($gitStatusLines.Count -gt 0) {
    $gitStatusLines -join "`r`n"
} else {
    "(clean working tree)"
}

$reportLines = @(
    "# Autonomous Cycle Report",
    "",
    "- Timestamp: $timestamp",
    "- Goal: $Goal",
    "- Focus: $focusText",
    "- Overall verification status: $overallStatus",
    "- Branch: $branch",
    "- Commit: $commit",
    "- Dirty files: $dirtyCount",
    "- First open queue item: $queueText",
    "",
    "## Verification Summary",
    ""
)
$reportLines += $verificationLines
$reportLines += @(
    "",
    "## Git Status Snapshot",
    "",
    '```text',
    $gitStatusBlock,
    '```'
)

foreach ($result in $results) {
    $resultStatus = if ($result.Success) { "passed" } else { "failed (exit $($result.ExitCode))" }
    $reportLines += @(
        "",
        "## $($result.Label)",
        "",
        "- Result: $resultStatus",
        "- Duration: $($result.DurationSeconds)s",
        "",
        '```text',
        $result.Output,
        '```'
    )
}

$report = $reportLines -join "`r`n"
$reportPath = Join-Path $outputRoot "cycle-$runId.md"
$latestPath = Join-Path $outputRoot "latest-cycle.md"

Write-Utf8File -Path $reportPath -Content $report
Write-Utf8File -Path $latestPath -Content $report

$snapshotLines = @(
    "- Timestamp: $timestamp",
    "- Goal: $Goal",
    "- Focus: $focusText",
    "- Overall verification status: $overallStatus",
    "- Verification:"
)
$snapshotLines += $verificationLines
$snapshotLines += @(
    "- Dirty files at cycle end: $dirtyCount",
    "- First open queue item: $queueText",
    "- Full report: $latestRelativePath"
)

$snapshot = $snapshotLines -join "`r`n"
Update-StateSnapshot -Path $statePath -Snapshot $snapshot

$control.cycle_count = [int]$control.cycle_count + 1
$control.updated_at = Get-IsoTimestamp
$control.telemetry.last_cycle_status = $overallStatus
Update-StuckDetection -RepoRoot $repoRoot -Control $control | Out-Null
Add-AutonomyEvent -RepoRoot $repoRoot -Control $control -Type $(if ($failedResults.Count -gt 0) { "cycle.failed" } else { "cycle.completed" }) -Payload @{
    goal = $Goal
    focus = $focusText
    verification_status = $overallStatus
    dirty_files = $dirtyCount
    first_open_queue_item = $queueText
    report = $latestRelativePath
} | Out-Null
Write-Utf8Json -Path $paths.Control -Value $control
Write-AutonomyBaseState -RepoRoot $repoRoot -Control $control -Backlog $backlog -Latest @{
    goal = $Goal
    focus = $focusText
    verification_status = $overallStatus
    report = $latestRelativePath
}

Write-Host "Autonomy cycle report written to $latestPath"
Write-Host "State ledger updated at $statePath"

if ($failedResults.Count -gt 0) {
    exit 1
}
