param(
  [string]$Root = ".",
  [string]$Output = "project-inventory.txt"
)

$rootPath = Resolve-Path $Root
"Project inventory for: $rootPath" | Out-File -FilePath $Output -Encoding utf8
"Generated at: $(Get-Date -Format s)" | Out-File -FilePath $Output -Encoding utf8 -Append
"" | Out-File -FilePath $Output -Encoding utf8 -Append

Get-ChildItem -Path $rootPath -Recurse -Force |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\.git\\' } |
  Sort-Object FullName |
  ForEach-Object {
    $type = if ($_.PSIsContainer) { "DIR " } else { "FILE" }
    $relative = $_.FullName.Substring($rootPath.Path.Length).TrimStart('\\')
    if (-not $_.PSIsContainer) {
      $size = $_.Length
      "$type`t$relative`t$size" | Out-File -FilePath $Output -Encoding utf8 -Append
    } else {
      "$type`t$relative" | Out-File -FilePath $Output -Encoding utf8 -Append
    }
  }

Write-Host "Done. Inventory saved to $Output"
