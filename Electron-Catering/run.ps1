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

# Check that dependencies are actually installed (not just that the folder exists)
$viteBin = Join-Path "node_modules\.bin" "vite.cmd"
if (-not (Test-Path $viteBin)) {
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
}

# Run dev server with Electron
npm run dev
