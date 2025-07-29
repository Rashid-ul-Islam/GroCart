@echo off
REM Dual Branch Push Script for Windows
REM Usage: dual-push.bat "Your commit message"

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo ❌ Error: Please provide a commit message
    echo Usage: dual-push.bat "Your commit message"
    exit /b 1
)

set "COMMIT_MESSAGE=%~1"

for /f "tokens=*" %%i in ('git branch --show-current') do set "CURRENT_BRANCH=%%i"

echo 🚀 Starting dual-branch push process...
echo 📝 Commit message: %COMMIT_MESSAGE%
echo 🌟 Current branch: %CURRENT_BRANCH%

REM Step 1: Commit changes to current branch
echo.
echo 📦 Step 1: Committing to current branch (%CURRENT_BRANCH%)...
git add .
git commit -m "%COMMIT_MESSAGE%"
git push origin %CURRENT_BRANCH%

REM Get the commit hash
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set "COMMIT_HASH=%%i"
echo ✅ Committed to %CURRENT_BRANCH%: %COMMIT_HASH%

REM Step 2: Cherry-pick to main branch
echo.
echo 🍒 Step 2: Cherry-picking to main branch...
git stash push -m "temp-stash-%time%" 2>nul || echo Nothing to stash
git checkout main
git pull origin main

echo 🍒 Cherry-picking commit %COMMIT_HASH%...
git cherry-pick %COMMIT_HASH%
if !errorlevel! equ 0 (
    echo ✅ Successfully cherry-picked to main
    git push origin main
    echo ✅ Pushed to main branch
) else (
    echo ❌ Cherry-pick failed. You may need to resolve conflicts manually.
    echo 🔧 Run: git cherry-pick --continue after resolving conflicts
    exit /b 1
)

REM Step 3: Return to original branch
echo.
echo 🔄 Step 3: Returning to %CURRENT_BRANCH%...
git checkout %CURRENT_BRANCH%
git stash pop 2>nul || echo No stash to restore

echo.
echo 🎉 SUCCESS! Changes pushed to both branches:
echo    ✅ %CURRENT_BRANCH%: %COMMIT_HASH%
echo    ✅ main: (cherry-picked)
echo.
echo 🌐 Both branches are now updated on GitHub!

pause
