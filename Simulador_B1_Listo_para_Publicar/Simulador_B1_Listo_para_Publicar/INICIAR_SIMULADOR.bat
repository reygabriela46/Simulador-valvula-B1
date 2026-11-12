@echo off
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 main.py
) else (
  python main.py
)
echo.
echo Si el programa se cerro inesperadamente, lee el mensaje anterior.
pause
