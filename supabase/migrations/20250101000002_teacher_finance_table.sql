-- Migration 002: Teacher Finance Config Table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS teacher_finance_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  rate_per_session numeric(10,2) NOT NULL DEFAULT 0,
  bonus_rate numeric(10,2) DEFAULT 0,
  deduction numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_teacher_finance_timestamp()
RETURNS TRIGGER AS 
$$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teacher_finance_updated ON teacher_finance_config;
CREATE TRIGGER trg_teacher_finance_updated
  BEFORE UPDATE ON teacher_finance_config
  FOR EACH ROW EXECUTE FUNCTION update_teacher_finance_timestamp();
