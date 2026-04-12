$ErrorActionPreference = "Stop"

$projectRoot = Get-Location
$batchFolder = Join-Path $projectRoot "skidy-payments-batch-1"

if (!(Test-Path $batchFolder)) {
  Write-Error "Folder 'skidy-payments-batch-1' not found in project root."
}

$files = @(
  @{ From = "src/services/payments.service.ts"; To = "src/services/payments.service.ts" },
  @{ From = "src/app/(dashboard)/payments/page.tsx"; To = "src/app/(dashboard)/payments/page.tsx" },
  @{ From = "src/app/(dashboard)/payments/new/page.tsx"; To = "src/app/(dashboard)/payments/new/page.tsx" },
  @{ From = "src/app/(dashboard)/payments/[id]/page.tsx"; To = "src/app/(dashboard)/payments/[id]/page.tsx" },
  @{ From = "src/components/payments/payment-invoice-view.tsx"; To = "src/components/payments/payment-invoice-view.tsx" },
  @{ From = "src/types/database.types.ts"; To = "src/types/database.types.ts" }
)

foreach ($file in $files) {
  $from = Join-Path $batchFolder $file.From
  $to = Join-Path $projectRoot $file.To
  $toDir = Split-Path $to -Parent

  if (!(Test-Path $from)) {
    Write-Error "Missing file in batch: $from"
  }

  if (!(Test-Path $toDir)) {
    New-Item -ItemType Directory -Force -Path $toDir | Out-Null
  }

  Copy-Item $from $to -Force
  Write-Host "Copied $($file.From)"
}

Remove-Item $batchFolder -Recurse -Force
Write-Host "Removed artifact folder: skidy-payments-batch-1"
Write-Host "Batch applied successfully."
