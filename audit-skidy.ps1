$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== SKIDY REIN CRM :: ROOT AUDIT ===" -ForegroundColor Cyan
Write-Host ""

$root = Get-Location
$issues = @()

function Add-Issue($message) {
    $script:issues += $message
    Write-Host "✗ $message" -ForegroundColor Red
}

function Add-Ok($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Add-Warn($message) {
    Write-Host "! $message" -ForegroundColor Yellow
}

# 1) Check unwanted artifact folders/files in root
Write-Host "1) Checking artifact contamination..." -ForegroundColor White

$artifactPatterns = @(
    "skidy-payments-batch*",
    "*.zip",
    "*artifact*",
    "*batch*"
)

$artifactHits = @()

foreach ($pattern in $artifactPatterns) {
    $artifactHits += Get-ChildItem -Force -Path $root -Filter $pattern -ErrorAction SilentlyContinue
}

$artifactHits = $artifactHits | Sort-Object FullName -Unique | Where-Object {
    $_.Name -notin @("node_modules", ".next")
}

if ($artifactHits.Count -gt 0) {
    foreach ($hit in $artifactHits) {
        Add-Issue "Artifact found in root: $($hit.FullName)"
    }
} else {
    Add-Ok "No batch/zip/artifact contamination found in root"
}

# 2) Check for demo/mock/fake/sample strings inside src
Write-Host ""
Write-Host "2) Scanning for demo/mock/fake/sample fallbacks..." -ForegroundColor White

$scanTerms = @(
    "demo",
    "mock",
    "fake",
    "sample data",
    "dummy",
    "fallback data",
    "hardcoded"
)

$srcPath = Join-Path $root "src"

if (-not (Test-Path $srcPath)) {
    Add-Issue "src folder not found"
} else {
    $matches = @()
    foreach ($term in $scanTerms) {
        $matches += Get-ChildItem -Path $srcPath -Recurse -Include *.ts,*.tsx,*.js,*.jsx `
            | Select-String -Pattern $term -SimpleMatch -ErrorAction SilentlyContinue
    }

    $matches = $matches | Where-Object {
        $_.Path -notmatch "\\.next\\" -and $_.Path -notmatch "\\node_modules\\"
    }

    if ($matches.Count -gt 0) {
        Add-Warn "Potential fallback/demo references found:"
        $matches |
            Sort-Object Path, LineNumber |
            Select-Object -First 60 |
            ForEach-Object {
                Write-Host ("  - {0}:{1} :: {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim()) -ForegroundColor Yellow
            }
    } else {
        Add-Ok "No obvious demo/mock/fake strings found in src"
    }
}

# 3) Check payments service exports
Write-Host ""
Write-Host "3) Verifying payments service structure..." -ForegroundColor White

$paymentsService = Join-Path $root "src\services\payments.service.ts"

if (-not (Test-Path $paymentsService)) {
    Add-Issue "payments.service.ts not found"
} else {
    $requiredExports = @(
        "export async function getPayments",
        "export async function getPaymentById",
        "export async function createPayment",
        "export async function updatePayment",
        "export async function archivePayment",
        "export async function restorePayment",
        "export async function deletePayment"
    )

    $serviceContent = Get-Content $paymentsService -Raw

    foreach ($exp in $requiredExports) {
        if ($serviceContent -like "*$exp*") {
            Add-Ok "Found: $exp"
        } else {
            Add-Issue "Missing export in payments.service.ts -> $exp"
        }
    }
}

# 4) Check invoice/payment pages existence
Write-Host ""
Write-Host "4) Checking required payments pages..." -ForegroundColor White

$requiredFiles = @(
    "src\app\(dashboard)\payments\page.tsx",
    "src\app\(dashboard)\payments\new\page.tsx",
    "src\app\(dashboard)\payments\[id]\page.tsx",
    "src\app\(dashboard)\payments\[id]\invoice\page.tsx",
    "src\components\payments\payment-invoice-view.tsx",
    "src\types\database.types.ts"
)

foreach ($file in $requiredFiles) {
    $full = Join-Path $root $file
    if (Test-Path $full) {
        Add-Ok "Exists: $file"
    } else {
        Add-Issue "Missing file: $file"
    }
}

# 5) Check archive/delete UI hooks
Write-Host ""
Write-Host "5) Checking archive/delete usage in payment details page..." -ForegroundColor White

$paymentDetailsPage = Join-Path $root "src\app\(dashboard)\payments\[id]\page.tsx"

if (Test-Path $paymentDetailsPage) {
    $pageContent = Get-Content $paymentDetailsPage -Raw

    $requiredUsages = @(
        "archivePayment",
        "restorePayment",
        "deletePayment"
    )

    foreach ($usage in $requiredUsages) {
        if ($pageContent -like "*$usage*") {
            Add-Ok "Payment details page uses: $usage"
        } else {
            Add-Issue "Payment details page missing usage: $usage"
        }
    }
} else {
    Add-Issue "Payment details page not found"
}

# 6) Check middleware deprecation
Write-Host ""
Write-Host "6) Checking deprecated middleware file..." -ForegroundColor White

$middlewareFile = Join-Path $root "src\middleware.ts"
$rootMiddlewareFile = Join-Path $root "middleware.ts"
$proxyFile = Join-Path $root "proxy.ts"
$srcProxyFile = Join-Path $root "src\proxy.ts"

if (Test-Path $middlewareFile -or Test-Path $rootMiddlewareFile) {
    Add-Warn "middleware file exists. Build is fine now, but Next 16 recommends migrating to proxy.ts"
} elseif (Test-Path $proxyFile -or Test-Path $srcProxyFile) {
    Add-Ok "proxy file exists"
} else {
    Add-Warn "No middleware.ts or proxy.ts found"
}

# 7) Summary
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Add-Ok "Audit passed with no hard issues"
    Write-Host ""
    Write-Host "Recommended next step: Real Data Audit for dashboard/reports/lists" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host ""
    Write-Host "Hard issues found:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}