# Phase 7 — Batch 2
## Students + Parents + Teachers (Real Data & Relations)

### What changed
- Added richer CRM relation types:
  - `StudentDetails`
  - `ParentDetails`
  - `TeacherDetails`
- Extended `database.types.ts` with:
  - `students.parent_id`
  - `teachers` table typing
- Improved services:
  - `students.service.ts`
  - `parents.service.ts`
  - `teachers.service.ts`
- Added new relation composition service:
  - `src/services/relations.service.ts`

### UI updates
- Student details now show:
  - linked parent profile
  - sibling/related student profiles
  - linked sessions
  - linked teachers
- Parents list/details now derive children and open leads from real relations.
- Teachers list/details now derive classes and students from linked schedule data.
- Students list now links to parent profiles when a relation is available.

### Main files changed
- `src/types/crm.ts`
- `src/types/database.types.ts`
- `src/services/students.service.ts`
- `src/services/parents.service.ts`
- `src/services/teachers.service.ts`
- `src/services/relations.service.ts`
- `src/app/(dashboard)/students/page.tsx`
- `src/app/(dashboard)/students/[id]/page.tsx`
- `src/app/(dashboard)/parents/page.tsx`
- `src/app/(dashboard)/parents/[id]/page.tsx`
- `src/app/(dashboard)/teachers/page.tsx`
- `src/app/(dashboard)/teachers/[id]/page.tsx`
