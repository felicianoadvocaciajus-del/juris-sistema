@echo off
echo Configurando regras de firewall para Juris Sistema...
echo.

netsh advfirewall firewall delete rule name="Juris Web 3001" >nul 2>&1
netsh advfirewall firewall delete rule name="Juris API 4000" >nul 2>&1
netsh advfirewall firewall delete rule name="Juris Evolution 8085" >nul 2>&1

netsh advfirewall firewall add rule name="Juris Web 3001" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="Juris API 4000" dir=in action=allow protocol=TCP localport=4000
netsh advfirewall firewall add rule name="Juris Evolution 8085" dir=in action=allow protocol=TCP localport=8085

echo.
echo Portas liberadas: 3001 (Web), 4000 (API), 8085 (Evolution)
echo Sistema acessivel em: http://192.168.15.13:3001
echo.
pause
