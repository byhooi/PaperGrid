$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    foreach ($source in @('config.js', 'layout.js', 'render.js', 'exports.js', 'app.js', 'assets/papergrid-font.js')) {
        node --check $source
        if ($LASTEXITCODE -ne 0) { throw "JavaScript syntax check failed: $source" }
    }
    foreach ($asset in @('assets/jspdf-4.2.1.umd.min.js', 'assets/PaperGridSans.ttf', 'assets/jsPDF-LICENSE.txt', 'assets/NotoSansSC-OFL.txt')) {
        if (-not (Test-Path -LiteralPath $asset)) { throw "Missing offline asset: $asset" }
    }
    node scripts/test_layout.js
    if ($LASTEXITCODE -ne 0) { throw 'Layout regression checks failed' }
    git diff --check
    if ($LASTEXITCODE -ne 0) { throw 'Whitespace check failed' }
    Write-Output 'Syntax, layout, offline assets and whitespace checks passed.'
} finally {
    Pop-Location
}
