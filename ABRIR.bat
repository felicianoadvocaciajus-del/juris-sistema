@echo off
chcp 65001 >nul
title JurisSystem
color 0A

echo.
echo ============================================
echo   JURISSYSTEM - INICIANDO...
echo ============================================
echo.

:: Start Docker containers
echo Subindo banco de dados...
docker compose up -d >nul 2>&1
echo Banco de dados OK!

:: Wait for DB
timeout /t 5 /nobreak >nul

:: Start API
echo Iniciando API...
start /b cmd /c "cd apps\api && npm run dev > nul 2>&1"

:: Wait for API
timeout /t 10 /nobreak >nul

:: Start Frontend
echo Iniciando sistema...
start /b cmd /c "cd apps\web && npx next dev -H 0.0.0.0 -p 3001 > nul 2>&1"

:: Wait for frontend
timeout /t 8 /nobreak >nul

echo.
echo ============================================
echo   SISTEMA PRONTO!
echo ============================================
echo.
echo Acesse no navegador:
echo.
echo    http://localhost:3001
echo.
echo Login: admin@juris.local
echo Senha: mudar123
echo.
echo NAO FECHE ESTA JANELA enquanto usar o sistema.
echo Para parar, feche esta janela.
echo.

:: Open browser
start http://localhost:3001

:: Keep window open
pause >nul
