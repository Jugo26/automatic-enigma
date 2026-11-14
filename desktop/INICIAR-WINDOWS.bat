@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title GrepoPilot Desktop - Iniciar
where node.exe >nul 2>&1
if errorlevel 1 goto :missing_node
where npm.cmd >nul 2>&1
if errorlevel 1 goto :missing_node
if not exist "node_modules\electron\package.json" (
  echo [INFO] Instalando dependencias pela primeira vez...
  call npm.cmd install --no-audit --no-fund
  if errorlevel 1 goto :failed
)
echo [INFO] Abrindo GrepoPilot Desktop...
call npm.cmd start
if errorlevel 1 goto :failed
exit /b 0
:missing_node
echo [ERRO] Instale o Node.js LTS em https://nodejs.org/
goto :failed
:failed
echo [ERRO] Falha ao iniciar. A mensagem acima indica a causa.
pause
exit /b 1
