function Write-Utf8Json {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Value
    )

    $directory = Split-Path -Parent $Path
    if ($directory) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    $json = $Value | ConvertTo-Json -Depth 12
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, $utf8NoBom)
}

function Get-IsoTimestamp {
    return (Get-Date).ToUniversalTime().ToString("o")
}

function Get-AutonomyPaths {
    param([Parameter(Mandatory = $true)][string]$RepoRoot)

    $autonomyRoot = Join-Path $RepoRoot ".autonomy"
    return @{
        AutonomyRoot = $autonomyRoot
        Control = Join-Path $autonomyRoot "control.json"
        Backlog = Join-Path $autonomyRoot "backlog.json"
        BaseState = Join-Path $autonomyRoot "base-state.json"
        EventsDir = Join-Path $autonomyRoot "events"
        LatestCycle = Join-Path $autonomyRoot "latest-cycle.md"
        RunsDir = Join-Path $autonomyRoot "runs"
    }
}

function Read-JsonObject {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path $Path)) {
        return [pscustomobject]@{}
    }

    return Get-Content $Path -Raw | ConvertFrom-Json
}

function Ensure-NoteProperty {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [Parameter(Mandatory = $true)][string]$Name,
        $Value
    )

    if ($Object.PSObject.Properties.Name -contains $Name) {
        $Object.$Name = $Value
    } else {
        $Object | Add-Member -MemberType NoteProperty -Name $Name -Value $Value
    }
}

function Get-PropOrDefault {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [Parameter(Mandatory = $true)][string]$Name,
        $Default = $null
    )

    if ($null -eq $Object) {
        return $Default
    }

    if ($Object.PSObject.Properties.Name -contains $Name) {
        $value = $Object.$Name
        if ($null -ne $value -and -not ([string]$value -eq "" -and $value -is [string])) {
            return $value
        }
    }

    return $Default
}

function Initialize-ControlSchema {
    param(
        [Parameter(Mandatory = $true)]$Control,
        [Parameter(Mandatory = $true)][string]$RepoRoot
    )

    $repoName = Split-Path $RepoRoot -Leaf
    Ensure-NoteProperty -Object $Control -Name "version" -Value ([int](Get-PropOrDefault -Object $Control -Name "version" -Default 1))
    Ensure-NoteProperty -Object $Control -Name "mode" -Value ([string](Get-PropOrDefault -Object $Control -Name "mode" -Default "idle"))
    Ensure-NoteProperty -Object $Control -Name "session_name" -Value ([string](Get-PropOrDefault -Object $Control -Name "session_name" -Default ($repoName + "-autonomy")))

    if (-not $Control.PSObject.Properties.Name.Contains("session_id") -or [string]::IsNullOrWhiteSpace([string]$Control.session_id)) {
        $generatedSessionId = "session-" + (Get-Date -Format "yyyyMMdd-HHmmss")
        Ensure-NoteProperty -Object $Control -Name "session_id" -Value $generatedSessionId
    }

    Ensure-NoteProperty -Object $Control -Name "stop_on_user_return" -Value ([bool](Get-PropOrDefault -Object $Control -Name "stop_on_user_return" -Default $true))
    Ensure-NoteProperty -Object $Control -Name "last_resume_command" -Value ([string](Get-PropOrDefault -Object $Control -Name "last_resume_command" -Default ""))
    Ensure-NoteProperty -Object $Control -Name "last_stop_reason" -Value ([string](Get-PropOrDefault -Object $Control -Name "last_stop_reason" -Default ""))
    Ensure-NoteProperty -Object $Control -Name "active_task_id" -Value ($Control.active_task_id)
    Ensure-NoteProperty -Object $Control -Name "cycle_count" -Value ([int](Get-PropOrDefault -Object $Control -Name "cycle_count" -Default 0))
    Ensure-NoteProperty -Object $Control -Name "updated_at" -Value ([string](Get-PropOrDefault -Object $Control -Name "updated_at" -Default (Get-IsoTimestamp)))

    if (-not $Control.PSObject.Properties.Name.Contains("lease") -or $null -eq $Control.lease) {
        Ensure-NoteProperty -Object $Control -Name "lease" -Value ([pscustomobject]@{
            owner = $null
            acquired_at = $null
            expires_at = $null
        })
    } else {
        Ensure-NoteProperty -Object $Control.lease -Name "owner" -Value $Control.lease.owner
        Ensure-NoteProperty -Object $Control.lease -Name "acquired_at" -Value $Control.lease.acquired_at
        Ensure-NoteProperty -Object $Control.lease -Name "expires_at" -Value $Control.lease.expires_at
    }

    if (-not $Control.PSObject.Properties.Name.Contains("budget") -or $null -eq $Control.budget) {
        Ensure-NoteProperty -Object $Control -Name "budget" -Value ([pscustomobject]@{
            max_cycle_minutes = 30
            max_repeated_task_cycles = 3
            max_events = 200
        })
    } else {
        Ensure-NoteProperty -Object $Control.budget -Name "max_cycle_minutes" -Value ([int](Get-PropOrDefault -Object $Control.budget -Name "max_cycle_minutes" -Default 30))
        Ensure-NoteProperty -Object $Control.budget -Name "max_repeated_task_cycles" -Value ([int](Get-PropOrDefault -Object $Control.budget -Name "max_repeated_task_cycles" -Default 3))
        Ensure-NoteProperty -Object $Control.budget -Name "max_events" -Value ([int](Get-PropOrDefault -Object $Control.budget -Name "max_events" -Default 200))
    }

    if (-not $Control.PSObject.Properties.Name.Contains("telemetry") -or $null -eq $Control.telemetry) {
        Ensure-NoteProperty -Object $Control -Name "telemetry" -Value ([pscustomobject]@{
            last_event_id = $null
            last_event_index = -1
            last_event_type = $null
            last_cycle_status = $null
        })
    } else {
        Ensure-NoteProperty -Object $Control.telemetry -Name "last_event_id" -Value $Control.telemetry.last_event_id
        Ensure-NoteProperty -Object $Control.telemetry -Name "last_event_index" -Value ([int](Get-PropOrDefault -Object $Control.telemetry -Name "last_event_index" -Default -1))
        Ensure-NoteProperty -Object $Control.telemetry -Name "last_event_type" -Value $Control.telemetry.last_event_type
        Ensure-NoteProperty -Object $Control.telemetry -Name "last_cycle_status" -Value $Control.telemetry.last_cycle_status
    }

    if (-not $Control.PSObject.Properties.Name.Contains("stuck_detection") -or $null -eq $Control.stuck_detection) {
        Ensure-NoteProperty -Object $Control -Name "stuck_detection" -Value ([pscustomobject]@{
            enabled = $true
            state = "clear"
            repeated_task_cycles = 0
            consecutive_failed_cycles = 0
            last_checked_at = $null
            last_flagged_at = $null
            detail = "No stuck signal yet."
        })
    } else {
        Ensure-NoteProperty -Object $Control.stuck_detection -Name "enabled" -Value ([bool](Get-PropOrDefault -Object $Control.stuck_detection -Name "enabled" -Default $true))
        Ensure-NoteProperty -Object $Control.stuck_detection -Name "state" -Value ([string](Get-PropOrDefault -Object $Control.stuck_detection -Name "state" -Default "clear"))
        Ensure-NoteProperty -Object $Control.stuck_detection -Name "repeated_task_cycles" -Value ([int](Get-PropOrDefault -Object $Control.stuck_detection -Name "repeated_task_cycles" -Default 0))
        Ensure-NoteProperty -Object $Control.stuck_detection -Name "consecutive_failed_cycles" -Value ([int](Get-PropOrDefault -Object $Control.stuck_detection -Name "consecutive_failed_cycles" -Default 0))
        Ensure-NoteProperty -Object $Control.stuck_detection -Name "last_checked_at" -Value $Control.stuck_detection.last_checked_at
        Ensure-NoteProperty -Object $Control.stuck_detection -Name "last_flagged_at" -Value $Control.stuck_detection.last_flagged_at
        Ensure-NoteProperty -Object $Control.stuck_detection -Name "detail" -Value ([string](Get-PropOrDefault -Object $Control.stuck_detection -Name "detail" -Default "No stuck signal yet."))
    }

    return $Control
}

function Get-RecentAutonomyEvents {
    param(
        [Parameter(Mandatory = $true)][string]$RepoRoot,
        [int]$Limit = 12
    )

    $paths = Get-AutonomyPaths -RepoRoot $RepoRoot
    if (-not (Test-Path $paths.EventsDir)) {
        return @()
    }

    $events = Get-ChildItem -Path $paths.EventsDir -Filter "*.json" |
        Sort-Object Name -Descending |
        Select-Object -First $Limit |
        ForEach-Object {
            try {
                Get-Content $_.FullName -Raw | ConvertFrom-Json
            } catch {
                $null
            }
        } |
        Where-Object { $null -ne $_ }

    return @($events)
}

function Trim-AutonomyEvents {
    param(
        [Parameter(Mandatory = $true)][string]$EventsDir,
        [Parameter(Mandatory = $true)][int]$MaxEvents
    )

    if (-not (Test-Path $EventsDir)) {
        return
    }

    $files = @(Get-ChildItem -Path $EventsDir -Filter "*.json" | Sort-Object Name)
    if ($files.Count -le $MaxEvents) {
        return
    }

    $filesToRemove = $files | Select-Object -First ($files.Count - $MaxEvents)
    foreach ($file in $filesToRemove) {
        Remove-Item -LiteralPath $file.FullName -Force
    }
}

function Add-AutonomyEvent {
    param(
        [Parameter(Mandatory = $true)][string]$RepoRoot,
        [Parameter(Mandatory = $true)]$Control,
        [Parameter(Mandatory = $true)][string]$Type,
        $Payload = $null,
        [string]$Source = "system"
    )

    $paths = Get-AutonomyPaths -RepoRoot $RepoRoot
    Initialize-ControlSchema -Control $Control -RepoRoot $RepoRoot | Out-Null

    $existingMaxIndex = -1
    if (Test-Path $paths.EventsDir) {
        $existingIndexes = @(Get-ChildItem -Path $paths.EventsDir -Filter "*.json" |
            ForEach-Object {
                if ($_.BaseName -match '^event-(\d+)') {
                    [int]$matches[1]
                }
            })

        if ($existingIndexes.Count -gt 0) {
            $existingMaxIndex = ($existingIndexes | Measure-Object -Maximum).Maximum
        }
    }

    $nextIndex = [Math]::Max([int]$Control.telemetry.last_event_index, [int]$existingMaxIndex) + 1
    $eventId = "evt-{0:d6}" -f $nextIndex
    $timestamp = Get-IsoTimestamp
    $safeType = (($Type -replace "[^a-zA-Z0-9]+", "-").Trim("-").ToLower())
    if ([string]::IsNullOrWhiteSpace($safeType)) {
        $safeType = "event"
    }

    $eventObject = [ordered]@{
        index = $nextIndex
        id = $eventId
        timestamp = $timestamp
        session_id = $Control.session_id
        source = $Source
        type = $Type
        mode = $Control.mode
        active_task_id = $Control.active_task_id
        payload = $Payload
    }

    New-Item -ItemType Directory -Path $paths.EventsDir -Force | Out-Null
    $eventPath = Join-Path $paths.EventsDir ("event-{0:d5}-{1}.json" -f $nextIndex, $safeType)
    Write-Utf8Json -Path $eventPath -Value $eventObject

    $Control.telemetry.last_event_id = $eventId
    $Control.telemetry.last_event_index = $nextIndex
    $Control.telemetry.last_event_type = $Type
    Trim-AutonomyEvents -EventsDir $paths.EventsDir -MaxEvents ([int]$Control.budget.max_events)

    return [pscustomobject]$eventObject
}

function Get-CurrentTaskRecord {
    param(
        [Parameter(Mandatory = $true)]$Control,
        $Backlog
    )

    $tasks = @()
    if ($null -ne $Backlog -and $Backlog.PSObject.Properties.Name -contains "tasks") {
        $tasks = @($Backlog.tasks)
    }

    if ($null -ne $Control.active_task_id) {
        $matching = $tasks | Where-Object { $_.id -eq $Control.active_task_id } | Select-Object -First 1
        if ($null -ne $matching) {
            return $matching
        }
    }

    return $tasks | Where-Object { $_.status -eq "in_progress" } | Select-Object -First 1
}

function Update-StuckDetection {
    param(
        [Parameter(Mandatory = $true)][string]$RepoRoot,
        [Parameter(Mandatory = $true)]$Control
    )

    Initialize-ControlSchema -Control $Control -RepoRoot $RepoRoot | Out-Null

    if (-not $Control.stuck_detection.enabled) {
        $Control.stuck_detection.state = "disabled"
        $Control.stuck_detection.detail = "Stuck detection is disabled."
        $Control.stuck_detection.last_checked_at = Get-IsoTimestamp
        return $Control.stuck_detection
    }

    $recentCycleEvents = Get-RecentAutonomyEvents -RepoRoot $RepoRoot -Limit 12 |
        Where-Object { $_.type -in @("cycle.completed", "cycle.failed") }

    $repeatCount = 0
    $failureCount = 0
    $activeTask = [string](Get-PropOrDefault -Object $Control -Name "active_task_id" -Default "")
    foreach ($event in $recentCycleEvents) {
        if ($event.active_task_id -eq $activeTask -and -not [string]::IsNullOrWhiteSpace($activeTask)) {
            $repeatCount += 1
        } else {
            break
        }
    }

    foreach ($event in $recentCycleEvents) {
        if ($event.type -eq "cycle.failed") {
            $failureCount += 1
        } else {
            break
        }
    }

    $state = "clear"
    $detail = "No stuck signal yet."
    if ($failureCount -ge 2) {
        $state = "at_risk"
        $detail = "Recent cycle failures are repeating without a successful recovery."
    } elseif ($repeatCount -ge [int]$Control.budget.max_repeated_task_cycles) {
        $state = "at_risk"
        $detail = "The same active task has repeated across multiple cycles. A human or strategy shift may be needed."
    }

    $Control.stuck_detection.state = $state
    $Control.stuck_detection.repeated_task_cycles = $repeatCount
    $Control.stuck_detection.consecutive_failed_cycles = $failureCount
    $Control.stuck_detection.last_checked_at = Get-IsoTimestamp
    $Control.stuck_detection.detail = $detail
    if ($state -eq "at_risk") {
        $Control.stuck_detection.last_flagged_at = $Control.stuck_detection.last_checked_at
    }

    return $Control.stuck_detection
}

function Write-AutonomyBaseState {
    param(
        [Parameter(Mandatory = $true)][string]$RepoRoot,
        [Parameter(Mandatory = $true)]$Control,
        $Backlog = $null,
        $Latest = $null
    )

    Initialize-ControlSchema -Control $Control -RepoRoot $RepoRoot | Out-Null
    $paths = Get-AutonomyPaths -RepoRoot $RepoRoot
    $currentTask = Get-CurrentTaskRecord -Control $Control -Backlog $Backlog
    $openTasks = @()
    if ($null -ne $Backlog -and $Backlog.PSObject.Properties.Name -contains "tasks") {
        $openTasks = @($Backlog.tasks | Where-Object { $_.status -ne "done" })
    }

    $baseState = [ordered]@{
        version = 1
        generated_at = Get-IsoTimestamp
        session_id = $Control.session_id
        session_name = $Control.session_name
        mode = $Control.mode
        execution_status = if ($Control.lease.owner) { "active" } elseif ($Control.mode -eq "running") { "armed" } else { $Control.mode }
        stop_on_user_return = $Control.stop_on_user_return
        active_task_id = $Control.active_task_id
        current_task = $currentTask
        cycle_count = $Control.cycle_count
        budget = $Control.budget
        stuck_detection = $Control.stuck_detection
        telemetry = $Control.telemetry
        open_tasks_count = $openTasks.Count
        updated_at = $Control.updated_at
        latest = $Latest
    }

    Write-Utf8Json -Path $paths.BaseState -Value $baseState
}
