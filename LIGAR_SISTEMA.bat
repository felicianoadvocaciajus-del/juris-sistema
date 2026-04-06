@echo off
title JurisSystem - Sistema do Escritorio
echo ============================================
echo   JurisSystem - Iniciando...
echo ============================================
echo.

cd /d "C:\Users\Administrador\Documents\Documents\juris-sistema"

echo Verificando banco de dados...
powershell -Command "& 'C:\Program Files\PostgreSQL\16\bin\pg_isready.exe' -h localhost -p 5432" >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] PostgreSQL nao esta rodando. Iniciando...
    net start postgresql-x64-16 >nul 2>&1
    timeout /t 3 >nul
)

echo Banco de dados OK!
echo.

REM Descobrir IP da rede
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /c:"192.168"') do set MEUIP=%%a
set MEUIP=%MEUIP: =%

echo Iniciando o sistema...
echo Aguarde uns 30 segundos...
echo.
echo ============================================
echo   ACESSO AO SISTEMA:
echo.
echo   Neste computador:
echo     http://localhost:3000
echo.
echo   De outro computador na mesma rede Wi-Fi:
echo     http://%MEUIP%:3000
echo.
echo   Login: admin@juris.local
echo ============================================
echo.
echo Para desligar: feche esta janela ou aperte Ctrl+C
echo.

REM Abre o navegador automaticamente apos 5 segundos
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

npm run dev
