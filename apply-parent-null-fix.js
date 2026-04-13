const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', '(dashboard)', 'parents', '[id]', 'page.tsx');
if (!fs.existsSync(filePath)) {
  console.error('[ERROR] file not found:', filePath);
  process.exit(1);
}
let content = fs.readFileSync(filePath, 'utf8');
let changed = false;

const replacements = [
  ['parentName: parent.fullName,', 'parentName: parent?.fullName ?? "",'],
  ['parentPhone: parent.phone,', 'parentPhone: parent?.phone ?? "",'],
];
for (const [from, to] of replacements) {
  if (content.includes(from)) {
    content = content.replace(from, to);
    changed = true;
    console.log('[OK] patched:', from);
  }
}

if (!changed) {
  console.log('[INFO] target lines not found; no changes made');
} else {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[DONE] parent null fix applied');
}
