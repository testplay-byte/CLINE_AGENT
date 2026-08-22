# ACUTE-CODE environment verification. PowerShell 5.1+ compatible.
$ErrorActionPreference = 'Continue'

$script:Rows = New-Object System.Collections.Generic.List[object]
$script:RequiredFailures = 0

function Get-FirstVersionLine([string]$Command) {
    try {
        $output = & $Command --version 2>&1
        if ($LASTEXITCODE -ne 0 -or -not $output) { return '' }
        return ([string](@($output)[0])).Trim()
    } catch {
        return ''
    }
}

function Add-Row([string]$Tool, [bool]$Required, [bool]$Passed, [string]$Detail) {
    $status = 'PASS'
    if (-not $Passed) {
        if ($Required) {
            $status = 'FAIL'
            $script:RequiredFailures++
        } else {
            $status = 'FAIL (optional)'
        }
    }
    [void]$script:Rows.Add([pscustomobject]@{
        Tool     = $Tool
        Required = $(if ($Required) { 'yes' } else { 'no' })
        Status   = $status
        Version  = $Detail
    })
}

$gitVersion = Get-FirstVersionLine 'git'
Add-Row 'git' $true ($gitVersion -like 'git version *') "$(if ($gitVersion) { $gitVersion } else { 'not found' })"

$nodeVersion = Get-FirstVersionLine 'node'
$nodeMajor = 0
if ($nodeVersion -match '^v(\d+)\.') { $nodeMajor = [int]$Matches[1] }
Add-Row 'node >= 22' $true ($nodeMajor -ge 22) "$(if ($nodeVersion) { $nodeVersion } else { 'not found (need >= v22)' })"

$pnpmVersion = Get-FirstVersionLine 'pnpm'
Add-Row 'pnpm' $true ($pnpmVersion -match '^\d') "$(if ($pnpmVersion) { $pnpmVersion } else { 'not found' })"

$rustcVersion = Get-FirstVersionLine 'rustc'
Add-Row 'rustc (optional)' $false ($rustcVersion -like 'rustc*') "$(if ($rustcVersion) { $rustcVersion } else { 'not found (optional; CI covers Rust builds)' })"

$cargoVersion = Get-FirstVersionLine 'cargo'
Add-Row 'cargo (optional)' $false ($cargoVersion -like 'cargo*') "$(if ($cargoVersion) { $cargoVersion } else { 'not found (optional; CI covers Rust builds)' })"

$script:Rows | Format-Table -AutoSize

if ($script:RequiredFailures -gt 0) {
    Write-Host "VERIFY-ENV: FAILED - $script:RequiredFailures required tool(s) missing or too old." -ForegroundColor Red
    exit 1
}
Write-Host 'VERIFY-ENV: PASSED.' -ForegroundColor Green
exit 0