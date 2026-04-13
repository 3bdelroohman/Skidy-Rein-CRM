const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'types', 'crm.ts');
if (!fs.existsSync(file)) {
  console.error('[FAIL] src/types/crm.ts not found');
  process.exit(1);
}

let text = fs.readFileSync(file, 'utf8');
const exportLine = 'export type { CourseType, StudentStatus, EmploymentType, PaymentStatus, PaymentMethod, LeadSource, LeadStage, LeadTemperature, LossReason, Priority, FollowUpType, CommChannel, UserRole } from "@/types/common.types";';

if (!text.includes(exportLine)) {
  text += '\n\n' + exportLine + '\n';
  fs.writeFileSync(file, text, 'utf8');
  console.log('[OK] added common type re-exports to src/types/crm.ts');
} else {
  console.log('[OK] re-export line already exists');
}
