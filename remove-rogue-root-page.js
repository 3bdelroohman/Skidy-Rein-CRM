const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'page.tsx');
const backupDir = path.join(root, '_ops', 'rogue-root-files');

if (!fs.existsSync(pagePath)) {
  console.log('[OK] no root page.tsx found');
  process.exit(0);
}

const content = fs.readFileSync(pagePath, 'utf8');
const looksRogue = content.includes('selectedTrackId') || content.includes('LeadFormValues') || content.includes('toInitialValues');

fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `page.tsx.bak`);
fs.copyFileSync(pagePath, backupPath);
fs.unlinkSync(pagePath);
console.log(`[OK] moved rogue root page.tsx -> ${path.relative(root, backupPath)}`);
if (!looksRogue) {
  console.log('[WARN] root page.tsx did not match expected rogue pattern, but it was still backed up and removed because Next was compiling ./page.tsx');
}

const nextDir = path.join(root, '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[OK] removed .next cache');
}
console.log('[DONE] root route cleanup finished');
