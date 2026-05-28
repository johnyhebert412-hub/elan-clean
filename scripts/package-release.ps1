$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $PSScriptRoot
$parent = Split-Path -Parent $project
$release = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $project "version.json") | ConvertFrom-Json
$zip = Join-Path $parent ("Elan-{0}-stable.zip" -f $release.version)
$source = @(
  ".gitignore",
  "app.js",
  "CHANGELOG.md",
  "index.html",
  "manifest.webmanifest",
  "package.json",
  "README.md",
  "styles.css",
  "sw.js",
  "vercel.json",
  "version.json",
  "icons",
  "scripts"
) | ForEach-Object { Join-Path $project $_ }

if (Test-Path -LiteralPath $zip) {
  Remove-Item -LiteralPath $zip
}

Compress-Archive -LiteralPath $source -DestinationPath $zip -CompressionLevel Optimal
Write-Output $zip
