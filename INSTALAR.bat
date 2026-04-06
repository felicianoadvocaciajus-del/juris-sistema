@echo off
chcp 65001 >nul
title JurisSystem - Instalacao
color 0A

echo.
echo ============================================
echo   JURISSYSTEM - INSTALACAO AUTOMATICA
echo ============================================
echo.

:: Check Docker
echo [1/5] Verificando Docker Desktop...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Docker Desktop nao encontrado!
    echo.
    echo Baixe e instale o Docker Desktop em:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    echo Depois de instalar, abra o Docker Desktop,
    echo espere ele iniciar e rode este script novamente.
    echo.
    pause
    exit /b 1
)
echo    Docker encontrado!

:: Check Node
echo [2/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Baixe e instale o Node.js em:
    echo https://nodejs.org/
    echo.
    echo Depois de instalar, rode este script novamente.
    echo.
    pause
    exit /b 1
)
echo    Node.js encontrado!

:: Install dependencies
echo [3/5] Instalando dependencias (pode demorar)...
call npm install >nul 2>&1
echo    Dependencias instaladas!

:: Start Docker containers
echo [4/5] Subindo banco de dados...
docker compose up -d
echo    Banco de dados rodando!

:: Wait for database and setup
echo [5/5] Configurando banco de dados...
timeout /t 10 /nobreak >nul
call npm run db:generate >nul 2>&1
call npm run db:push >nul 2>&1
call npm run db:seed >nul 2>&1
echo    Banco configurado!

echo.
echo ============================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo ============================================
echo.
echo Para abrir o sistema, execute: ABRIR.bat
echo.
pause
