$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$release = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $root "version.json") | ConvertFrom-Json
$zip = Join-Path $root ("Elan-GitHub-Vercel-{0}.zip" -f $release.version)
$source = @(
  "index.html",
  "styles.css",
  "app.js",
  "logic.js",
  "logic.test.js",
  "version.json",
  "CHANGELOG.md",
  "AGENTS.md",
  "manifest.webmanifest",
  "sw.js",
  "package.json",
  "vercel.json",
  "README.md",
  ".gitignore",
  ".vercelignore",
  "scripts",
  "icons"
) | ForEach-Object { Join-Path $root $_ }

if (Test-Path -LiteralPath $zip) {
  Remove-Item -LiteralPath $zip
}

Compress-Archive -LiteralPath $source -DestinationPath $zip -CompressionLevel Optimal
Write-Output $zip
