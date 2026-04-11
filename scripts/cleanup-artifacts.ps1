$paths = @(
  ".\\skidy-rein-crm-schedule-typesafe-build-fix",
  ".\\skidy-rein-crm-schedule-typesafe-build-fix.zip",
  ".\\skidy-rein-crm-schedule-full-restore-fix.zip",
  ".\\skidy-rein-crm-leads-complete-fix.zip",
  ".\\skidy-rein-crm-schedule-runtime-fix.zip",
  ".\\skidy-rein-crm-consolidated-fix-and-handoff.zip"
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item $p -Recurse -Force
    Write-Host "Removed $p"
  }
}
