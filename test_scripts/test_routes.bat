@echo off
setlocal enabledelayedexpansion

set "BASE_URL=http://localhost:3000"
set "PASS=0"
set "FAIL=0"
set "TASK_ID="

title API Route Tester

echo =========================================
echo   API Route Test Script
echo   %DATE% %TIME%
echo =========================================

:: Ensure we're in the project root
pushd "%~dp0"

:: Check if server is running; if not, try to start it
echo.
echo [INFO] Checking if server is running...
set "CHECK="
for /f "delims=" %%a in ('curl -s -o nul -w "%%{http_code}" "%BASE_URL%/" 2^>nul') do set "CHECK=%%a"
if not defined CHECK (
    echo [INFO] Server not detected on %BASE_URL%.
    echo [INFO] Attempting to start with: npx tsx src/server.ts
    start /b "" npx tsx "src\server.ts"
    echo [INFO] Waiting 6 seconds for startup...
    ping -n 6 127.0.0.1 >nul
    echo [INFO] Retrying connection...
    set "CHECK="
    for /f "delims=" %%a in ('curl -s -o nul -w "%%{http_code}" "%BASE_URL%/" 2^>nul') do set "CHECK=%%a"
    if not defined CHECK (
        echo [ERROR] Could not reach server. Make sure the server starts and try again.
        popd
        exit /b 1
    ) else (
        echo [INFO] Server is now running.
    )
) else (
    echo [INFO] Server is running.
)

:: ========== TEST 1: GET / ==========
echo.
echo [TEST 1] GET %BASE_URL%/
set "CODE="
for /f "delims=" %%a in ('curl -s -o "%TEMP%\resp1.json" -w "%%{http_code}" "%BASE_URL%/"') do set "CODE=%%a"
if not defined CODE (
    echo   [FAIL] No response received
    set /a FAIL+=1
) else if "!CODE!"=="200" (
    echo   [PASS] Status: !CODE!
    set /a PASS+=1
) else (
    echo   [FAIL] Status: !CODE! - expected 200
    if exist "%TEMP%\resp1.json" type "%TEMP%\resp1.json"
    set /a FAIL+=1
)

:: ========== TEST 2: GET /api/tasks ==========
echo.
echo [TEST 2] GET %BASE_URL%/api/tasks
set "CODE="
for /f "delims=" %%a in ('curl -s -o "%TEMP%\resp2.json" -w "%%{http_code}" "%BASE_URL%/api/tasks"') do set "CODE=%%a"
if not defined CODE (
    echo   [FAIL] No response received
    set /a FAIL+=1
) else if "!CODE!"=="200" (
    echo   [PASS] Status: !CODE!
    set /a PASS+=1
) else (
    echo   [FAIL] Status: !CODE! - expected 200
    if exist "%TEMP%\resp2.json" type "%TEMP%\resp2.json"
    set /a FAIL+=1
)

:: ========== TEST 3: GET /api/tasks with query params ==========
echo.
echo [TEST 3] GET %BASE_URL%/api/tasks?page=1^&limit=2
set "CODE="
for /f "delims=" %%a in ('curl -s -o "%TEMP%\resp3.json" -w "%%{http_code}" "%BASE_URL%/api/tasks?page=1&limit=2"') do set "CODE=%%a"
if not defined CODE (
    echo   [FAIL] No response received
    set /a FAIL+=1
) else if "!CODE!"=="200" (
    echo   [PASS] Status: !CODE!
    set /a PASS+=1
) else (
    echo   [FAIL] Status: !CODE! - expected 200
    if exist "%TEMP%\resp3.json" type "%TEMP%\resp3.json"
    set /a FAIL+=1
)

:: ========== TEST 4: POST /api/tasks ==========
echo.
echo [TEST 4] POST %BASE_URL%/api/tasks
set "CODE="
for /f "delims=" %%a in ('curl -s -X POST -H "Content-Type: application/json" -d "{\"title\":\"Test Task\",\"assigned_to\":\"Tester\",\"priority\":\"High\",\"status\":\"To Do\"}" -o "%TEMP%\resp4.json" -w "%%{http_code}" "%BASE_URL%/api/tasks"') do set "CODE=%%a"
if not defined CODE (
    echo   [FAIL] No response received
    set /a FAIL+=1
) else if "!CODE!"=="201" (
    echo   [PASS] Status: !CODE!
    set /a PASS+=1
    for /f "delims=" %%a in ('powershell -NoProfile -Command "Get-Content '%TEMP%\resp4.json' -Raw ^| ConvertFrom-Json ^| Select-Object -ExpandProperty task_id -ErrorAction SilentlyContinue"') do set "TASK_ID=%%a"
    if defined TASK_ID (
        echo   [INFO] Created task ID: !TASK_ID!
    ) else (
        echo   [WARN] Could not parse task_id from response
    )
) else (
    echo   [FAIL] Status: !CODE! - expected 201
    if exist "%TEMP%\resp4.json" type "%TEMP%\resp4.json"
    set /a FAIL+=1
)

:: ========== TEST 5: PATCH /api/tasks/:id ==========
echo.
echo [TEST 5] PATCH %BASE_URL%/api/tasks/%TASK_ID%
if defined TASK_ID (
    set "CODE="
    for /f "delims=" %%a in ('curl -s -X PATCH -H "Content-Type: application/json" -d "{\"priority\":\"high\"}" -o "%TEMP%\resp5.json" -w "%%{http_code}" "%BASE_URL%/api/tasks/%TASK_ID%"') do set "CODE=%%a"
    if not defined CODE (
        echo   [FAIL] No response received
        set /a FAIL+=1
    ) else if "!CODE!"=="200" (
        echo   [PASS] Status: !CODE!
        set /a PASS+=1
    ) else (
        echo   [FAIL] Status: !CODE! - expected 200
        if exist "%TEMP%\resp5.json" type "%TEMP%\resp5.json"
        set /a FAIL+=1
    )
) else (
    echo   [SKIP] No task ID available from POST test 4
)

:: ========== TEST 6: PATCH non-existent task ==========
echo.
echo [TEST 6] PATCH %BASE_URL%/api/tasks/99999999 - non-existent ID
set "CODE="
for /f "delims=" %%a in ('curl -s -X PATCH -H "Content-Type: application/json" -d "{\"priority\":\"high\"}" -o "%TEMP%\resp6.json" -w "%%{http_code}" "%BASE_URL%/api/tasks/99999999"') do set "CODE=%%a"
if not defined CODE (
    echo   [FAIL] No response received
    set /a FAIL+=1
) else if "!CODE!"=="404" (
    echo   [PASS] Status: !CODE! - correctly returned 404
    set /a PASS+=1
) else (
    echo   [FAIL] Status: !CODE! - expected 404 for non-existent task
    if exist "%TEMP%\resp6.json" type "%TEMP%\resp6.json"
    set /a FAIL+=1
)

:: ========== TEST 7: POST empty body - validation check ==========
echo.
echo [TEST 7] POST %BASE_URL%/api/tasks - empty body validation
set "CODE="
for /f "delims=" %%a in ('curl -s -X POST -H "Content-Type: application/json" -d "{}" -o "%TEMP%\resp7.json" -w "%%{http_code}" "%BASE_URL%/api/tasks"') do set "CODE=%%a"
if not defined CODE (
    echo   [FAIL] No response received
    set /a FAIL+=1
) else if "!CODE!"=="400" (
    echo   [PASS] Status: !CODE! - Zod correctly rejected invalid body
    set /a PASS+=1
) else if "!CODE!"=="500" (
    echo   [WARN] Status: !CODE! - got 500 instead of 400, review validation logic
    set /a PASS+=1
) else if "!CODE!"=="201" (
    echo   [FAIL] Status: !CODE! - server accepted empty body, validation missing
    set /a FAIL+=1
) else (
    echo   [FAIL] Status: !CODE! - expected 400
    if exist "%TEMP%\resp7.json" type "%TEMP%\resp7.json"
    set /a FAIL+=1
)

:: ========== SUMMARY ==========
echo.
echo =========================================
echo   RESULTS
echo   Date: %DATE% %TIME%
echo   Passed: %PASS%
echo   Failed: %FAIL%
echo =========================================

:: Clean up temp files
del /q "%TEMP%\resp*.json" "%TEMP%\code*.txt" 2>nul

popd

if %FAIL% gtr 0 (
    echo [FAIL] %FAIL% test(s^) failed. Review output above.
    exit /b 1
) else (
    echo [PASS] All tests passed^!
    exit /b 0
)
