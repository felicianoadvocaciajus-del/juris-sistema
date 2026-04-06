@echo off
title JurisSystem - Backup
echo ============================================
echo   JurisSystem - Fazendo Backup
echo ============================================
echo.

cd /d "C:\Users\Administrador\Documents\Documents\juris-sistema"

npm run backup

echo.
echo Backup salvo na pasta: infra\backups\
echo.
pause
