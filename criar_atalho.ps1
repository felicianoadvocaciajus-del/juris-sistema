$desktop = [Environment]::GetFolderPath('Desktop')
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$desktop\JurisSystem.lnk")
$Shortcut.TargetPath = 'C:\Users\Administrador\Documents\Documents\juris-sistema\ABRIR.bat'
$Shortcut.WorkingDirectory = 'C:\Users\Administrador\Documents\Documents\juris-sistema'
$Shortcut.Description = 'JurisSystem - Sistema do Escritorio'
$Shortcut.IconLocation = 'C:\Users\Administrador\Documents\Documents\juris-sistema\juris.ico'
$Shortcut.Save()
Write-Host "Atalho criado em: $desktop\JurisSystem.lnk"
