param(
  [switch]$IncludeStartMenu
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$electronExe = Join-Path $projectRoot 'node_modules\electron\dist\electron.exe'
$iconPath = Join-Path $projectRoot 'assets\icon.ico'

if (-not (Test-Path $electronExe)) {
  throw "Electron executable not found at: $electronExe. Run npm install first."
}
if (-not (Test-Path $iconPath)) {
  throw "App icon not found at: $iconPath."
}

$wsh = New-Object -ComObject WScript.Shell
$desktopPath = [Environment]::GetFolderPath('Desktop')
$shortcutPaths = @((Join-Path $desktopPath 'BSMA Student Tracker.lnk'))

if ($IncludeStartMenu) {
  $programsDir = [Environment]::GetFolderPath('Programs')
  $shortcutPaths += (Join-Path $programsDir 'BSMA Student Tracker.lnk')
}

foreach ($lnkPath in $shortcutPaths) {
  $sc = $wsh.CreateShortcut($lnkPath)
  $sc.TargetPath = $electronExe
  $sc.Arguments = "`"$projectRoot`""
  $sc.WorkingDirectory = $projectRoot
  $sc.IconLocation = "$iconPath,0"
  $sc.Description = 'BSMA Student Tracker'
  $sc.WindowStyle = 1
  $sc.Save()
  Write-Output "Created shortcut: $lnkPath"
}
