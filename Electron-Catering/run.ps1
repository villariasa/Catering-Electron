#Requires -Version 5.0
$ErrorActionPreference = "Stop"

# Always run from the script's own directory, regardless of where it was launched from
Set-Location -Path $PSScriptRoot

Write-Host "Launching Jayraldine's Catering Desktop App..." -ForegroundColor Cyan

# Verify Node.js is installed
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js was not found on PATH. Install it from https://nodejs.org (LTS version) and re-run this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

function Install-Dependencies {
    Write-Host "Installing npm dependencies (this can take a few minutes on first run)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "npm install failed." -ForegroundColor Red
        Write-Host "If the error mentions node-gyp, Python, or a C++ compiler, install 'Desktop development with C++' via Visual Studio Build Tools:" -ForegroundColor Yellow
        Write-Host "  https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Content -Path "node_modules\.platform-marker" -Value "win32"
}

# node_modules contains OS-specific native binaries (rollup, sqlite3, etc). If this
# folder was copied over from another OS instead of installed fresh here, those
# binaries won't run on Windows and commands fail with confusing native-module errors.
# Track which OS node_modules was installed for, and auto-reinstall if it doesn't
# match this machine, so no manual "delete node_modules" steps are ever needed.
$platformMarker = "node_modules\.platform-marker"
$needsInstall = $false

if (-not (Test-Path "node_modules")) {
    $needsInstall = $true
} elseif (-not (Test-Path $platformMarker)) {
    Write-Host "node_modules exists but wasn't installed by this script (likely copied from another machine/OS)." -ForegroundColor Yellow
    $needsInstall = $true
} else {
    $recordedPlatform = (Get-Content $platformMarker -Raw).Trim()
    if ($recordedPlatform -ne "win32") {
        Write-Host "node_modules was installed for a different OS. Native binaries will not work on Windows." -ForegroundColor Yellow
        $needsInstall = $true
    }
}

if ($needsInstall) {
    if (Test-Path "node_modules") {
        Write-Host "Removing incompatible node_modules..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "node_modules"
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json"
    }
    Install-Dependencies
}

# Run dev server with Electron
npm run dev
