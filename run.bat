@echo off

REM Start Flask backend
start /B python app.py

REM Wait for backend to start
timeout /t 2 >nul

REM Start frontend server
start python -m http.server 8080

REM Open browser
start http://localhost:8080/index.html

REM Instructions to stop servers
echo.
echo To stop the servers, close the command windows or use Task Manager.
pause