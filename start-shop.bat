@echo off
REM Ruby Debby Fashion Home - double-click to start the shop
cd /d C:\Users\Hp\.cline\data\workspaces\chat\ruby-debby-fashion-home
echo Starting Ruby Debby shop...
echo Then open http://localhost:3000 in your browser
echo.
echo [1/3] Checking Node...
node -v
if errorlevel 1 (
  echo.
  echo ERROR: Node.js not found. Install it from https://nodejs.org (LTS), then double-click this file again.
  pause
  exit /b 1
)
echo [2/3] Checking npm...
call npm.cmd -v
if errorlevel 1 (
  echo.
  echo ERROR: npm did not respond.
  pause
  exit /b 1
)
echo [3/3] Starting the shop server...
call npm.cmd run dev
pause
