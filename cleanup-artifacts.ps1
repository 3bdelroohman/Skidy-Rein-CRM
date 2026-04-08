# Run from the project root: C:\Users\3bdel\Documents\skidy-rein-crm

$artifactFolders = @(
  "skidy-rein-crm-phase8-9-action-center-live-notifications",
  "password_note_fix",
  "actioncenter_fix_full",
  "final_rolefix",
  "phase6",
  "phase789_combined",
  "phase7_batch2",
  "phase7_batch3_work",
  "phase_next_nav_cleanup",
  "phase_next_security",
  "skidy_final",
  "skidy_output",
  "skidy_phase6_build_fix",
  "skidy_work",
  "workfix"
)

foreach ($folder in $artifactFolders) {
  if (Test-Path $folder) {
    Remove-Item $folder -Recurse -Force
    Write-Host "Removed $folder"
  }
}

# Remove phase zip files and helper notes accidentally committed in the repo root
Get-ChildItem -File -Filter "skidy-rein-crm-*.zip" | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -File -Filter "PHASE*.md" | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -File -Filter "*.zip" | Where-Object { $_.Name -like "skidy-*" } | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Artifact cleanup finished."
