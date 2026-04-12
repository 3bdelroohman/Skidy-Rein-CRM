const fs = require('fs');
const path = require('path');

const root = process.cwd();
const backupSource = path.join(root, 'src', 'app', 'page.backup.tsx');
const backupTargetDir = path.join(root, '_ops', 'route-backups');
const backupTarget = path.join(backupTargetDir, 'page.backup.tsx');
const nextDir = path.join(root, '.next');

function log(msg) {
  process.stdout.write(msg + '\n');
}

try {
  fs.mkdirSync(backupTargetDir, { recursive: true });

  if (fs.existsSync(backupSource)) {
    if (fs.existsSync(backupTarget)) {
      fs.rmSync(backupTarget, { force: true });
    }
    fs.renameSync(backupSource, backupTarget);
    log('[OK] moved src/app/page.backup.tsx -> _ops/route-backups/page.backup.tsx');
  } else {
    log('[OK] no src/app/page.backup.tsx found');
  }

  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    log('[OK] removed .next');
  } else {
    log('[OK] no .next folder found');
  }

  log('[DONE] route-types cleanup finished');
} catch (error) {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
}
