-- Migration: Duplicate Prevention Constraints
-- Run in Supabase SQL Editor

-- 1. Unique index on leads: same phone + same child name = duplicate
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_phone_child_unique
ON leads (parent_phone, child_name)
WHERE parent_phone IS NOT NULL AND child_name IS NOT NULL;

-- 2. Unique index on parents: same phone = duplicate  
CREATE UNIQUE INDEX IF NOT EXISTS idx_parents_phone_unique
ON parents (phone)
WHERE phone IS NOT NULL AND phone != '';

-- 3. Unique index on students: same name + same parent = duplicate
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_name_parent_unique
ON students (full_name, parent_id)
WHERE full_name IS NOT NULL AND parent_id IS NOT NULL;
