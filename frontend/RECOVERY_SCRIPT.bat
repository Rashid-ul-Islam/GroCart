@echo off
echo ========================================
echo   RECOVERY SCRIPT FOR VITE CONFLICT
echo ========================================
echo.
echo This script will restore your original package.json files
echo.
pause
echo.
echo Restoring original package.json...
copy package.json.backup package.json
copy package-lock.json.backup package-lock.json

echo.
echo Cleaning node_modules...
rmdir /s /q node_modules

echo.
echo Reinstalling original dependencies...
npm install

echo.
echo ========================================
echo   RECOVERY COMPLETE!
echo ========================================
echo Your original configuration has been restored.
pause
