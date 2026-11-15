param([string]$OutputPath = (Join-Path $PSScriptRoot '..\dist\Atualizar GrepoPilot Desktop.exe'))

$ErrorActionPreference = 'Stop'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) {
    throw 'Compilador do .NET Framework 4 não encontrado.'
}
$output = [IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($output)) -Force | Out-Null
$compilerArgs = @('/nologo', '/target:winexe', '/platform:x64', '/optimize+', '/codepage:65001', "/out:$output",
    '/reference:System.Web.Extensions.dll', '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll',
    (Join-Path $PSScriptRoot 'GrepoPilotUpdater.cs'))
& $compiler @compilerArgs
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o atualizador.' }
Get-Item -LiteralPath $output
