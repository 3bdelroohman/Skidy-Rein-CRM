import { listLeads } from "@/services/leads.service";
import { listParentsWithRelations, listStudentsWithRelations } from "@/services/relations.service";

export interface OwnerSnapshotItem {
  key: string;
  displayName: string;
  leadCount: number;
  wonLeadCount: number;
  parentCount: number;
  studentCount: number;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function titleize(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : "Unassigned";
}

export async function getOwnerSnapshot(): Promise<OwnerSnapshotItem[]> {
  const [leads, students, parents] = await Promise.all([
    listLeads(),
    listStudentsWithRelations(),
    listParentsWithRelations(),
  ]);

  const bucket = new Map<string, OwnerSnapshotItem>();

  const ensure = (name: string | null | undefined) => {
    const key = normalizeName(name) || '__unassigned__';
    if (!bucket.has(key)) {
      bucket.set(key, {
        key,
        displayName: titleize(name),
        leadCount: 0,
        wonLeadCount: 0,
        parentCount: 0,
        studentCount: 0,
      });
    }
    return bucket.get(key)!;
  };

  leads.forEach((lead) => {
    const entry = ensure(lead.assignedToName);
    entry.leadCount += 1;
    if (lead.stage === 'won') entry.wonLeadCount += 1;
  });

  parents.forEach((parent) => {
    const entry = ensure(parent.ownerName);
    entry.parentCount += 1;
  });

  students.forEach((student) => {
    const entry = ensure(student.ownerName);
    entry.studentCount += 1;
  });

  return Array.from(bucket.values()).sort((a, b) => (b.studentCount + b.parentCount + b.leadCount) - (a.studentCount + a.parentCount + a.leadCount));
}
