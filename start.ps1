$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
& node "dist/apps/server/index.js"
exit $LASTEXITCODE
