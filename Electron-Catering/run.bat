@echo off
REM Double-click this file to launch the app on Windows.
REM It just runs run.ps1 with a relaxed execution policy for this process only
REM (does not change your system-wide PowerShell execution policy).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
pause
