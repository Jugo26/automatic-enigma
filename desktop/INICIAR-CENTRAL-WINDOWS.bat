@echo off
setlocal
cd /d "%~dp0shared-server"
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js 20+ nao encontrado.
 pause
 exit /b 1
)
if not exist "admin.key" (
 for /f %%K in ('node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"') do echo %%K>admin.key
)
set /p ADMIN_KEY=<admin.key
set HOST=127.0.0.1
set PORT=8787
echo Central local: http://127.0.0.1:8787
echo Chave administrativa armazenada em shared-server\admin.key
node server.mjs
if errorlevel 1 pause
