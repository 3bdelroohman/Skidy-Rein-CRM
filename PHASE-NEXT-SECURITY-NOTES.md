# Phase Next — Account Security

## Included in this batch
- Added a full password change section to Settings.
- Password update uses Supabase Auth `updateUser()` on the current logged-in account.
- Added password validation rules:
  - 8+ characters
  - contains letters
  - contains numbers
  - confirmation matches
- Added show/hide password toggles.
- Added operational security note explaining that the current session may need to be refreshed if expired.

## Updated file
- `src/app/(dashboard)/settings/page.tsx`
