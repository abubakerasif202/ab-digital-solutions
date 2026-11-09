# Install AB Web Studio's reusable design system into an existing OpenDesign clone.
# Does not edit any website repositories or configure external agents.
param(
    [string]$OpenDesignPath = "$HOME\open-design"
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $OpenDesignPath).Path
if (-not (Test-Path -LiteralPath (Join-Path $root 'package.json'))) {
    throw "Not an OpenDesign repository: $root"
}
$repoPackage = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
if ($repoPackage.name -ne 'open-design') { throw 'Refusing to install into a non-OpenDesign repository.' }
$source = Join-Path $PSScriptRoot 'design-systems\ab-web-studio'
$target = Join-Path $root 'design-systems\ab-web-studio'
if (-not (Test-Path -LiteralPath $source)) { throw "Kit files not found: $source" }
if (Test-Path -LiteralPath $target) { throw "Design system already exists: $target (no files were overwritten)." }
New-Item -Path $target -ItemType Directory | Out-Null
Copy-Item -LiteralPath (Join-Path $source 'DESIGN.md') -Destination $target
Copy-Item -LiteralPath (Join-Path $source 'tokens.css') -Destination $target
$manifest = Get-Content -LiteralPath (Join-Path $source 'manifest.json') -Raw | ConvertFrom-Json
$manifest.source.path = $target
$manifest | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $target 'manifest.json') -Encoding utf8
Write-Host "Installed: $target" -ForegroundColor Green
Write-Host 'Refresh the OpenDesign Design System picker and choose AB Web Studio — Gilt & Ruby.'
Write-Host 'This only installed the brand package; the website repositories remain unchanged.'
