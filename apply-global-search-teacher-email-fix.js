const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const target = path.join(process.cwd(), 'src', 'components', 'layout', 'global-search.tsx');
if (!fs.existsSync(target)) {
  console.error('[ERROR] target file not found:', target);
  process.exit(1);
}

let content = fs.readFileSync(target, 'utf8');
const before = 'subtitle={item.email}';
const after = 'subtitle={item.email ?? item.phone ?? t(locale, "غير متوفر", "N/A")}';

if (content.includes(after)) {
  console.log('[OK] global search teacher email fix already applied');
} else if (content.includes(before)) {
  content = content.replace(before, after);
  fs.writeFileSync(target, content, 'utf8');
  console.log('[OK] applied global search teacher email fix');
} else {
  console.log('[INFO] target lines not found; no changes made');
}
