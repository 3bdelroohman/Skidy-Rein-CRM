const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'src', 'app', '(dashboard)', 'teachers', '[id]', 'page.tsx');
if (!fs.existsSync(target)) {
  console.error('[FAIL] target file not found:', target);
  process.exit(1);
}

let text = fs.readFileSync(target, 'utf8');
const before = 'value={teacher.email} href={`mailto:${teacher.email}`}';
const after = 'value={teacher.email ?? t(locale, "غير متوفر", "N/A")} href={teacher.email ? `mailto:${teacher.email}` : undefined}';

if (text.includes(after)) {
  console.log('[OK] teacher email null fix already applied');
  process.exit(0);
}

if (!text.includes(before)) {
  console.log('[INFO] exact target snippet not found; no changes made');
  process.exit(0);
}

text = text.replace(before, after);
fs.writeFileSync(target, text, 'utf8');
console.log('[OK] applied teacher email null fix');
