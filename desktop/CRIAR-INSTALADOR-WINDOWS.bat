@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title GrepoPilot Desktop - Criar instalador
set "LOG=%~dp0instalador.log"

> "%LOG%" echo GrepoPilot Desktop - criacao do instalador
>> "%LOG%" echo Diretorio: %CD%
echo.
echo ===============================================
echo  GREPOPILOT DESKTOP - CRIAR INSTALADOR
 echo ===============================================
echo.
echo Registro de erros: "%LOG%"
echo.

where node.exe >nul 2>&1
if errorlevel 1 goto :missing_node
where npm.cmd >nul 2>&1
if errorlevel 1 goto :missing_npm

echo [1/3] Instalando dependencias. Aguarde...
call npm.cmd install --no-audit --no-fund >> "%LOG%" 2>&1
if errorlevel 1 goto :build_failed

echo [2/3] Verificando os arquivos...
call npm.cmd run check >> "%LOG%" 2>&1
if errorlevel 1 goto :build_failed

echo [3/3] Gerando instalador para Windows (x64)...
call npm.cmd run dist >> "%LOG%" 2>&1
if errorlevel 1 goto :build_failed

echo.
echo [SUCESSO] Instalador criado na pasta:
echo %CD%\dist
echo.
echo Pressione qualquer tecla para fechar esta janela.
pause >nul
exit /b 0

:missing_node
echo [ERRO] Node.js nao encontrado. Instale a versao LTS em:
echo https://nodejs.org/
echo Depois feche e reabra este arquivo .bat.
goto :failed

:missing_npm
echo [ERRO] npm.cmd nao encontrado no PATH.
echo Reinstale Node.js LTS, habilitando a adicao ao PATH.
goto :failed

:build_failed
echo.
echo [ERRO] Falha ao criar o instalador.
echo ==== DETALHES DO ERRO ====
type "%LOG%"
echo ==== FIM DOS DETALHES ====
echo Consulte o arquivo instalador.log nesta pasta.
goto :failed

:failed
echo.
echo Pressione qualquer tecla para fechar esta janela.
pause >nul
exit /b 1
