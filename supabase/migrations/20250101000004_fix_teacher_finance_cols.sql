-- Migration 004: Fix teacher_finance_config columns
ALTER TABLE teacher_finance_config 
  DROP COLUMN IF EXISTS rate_per_session,
  DROP COLUMN IF EXISTS bonus_rate,
  DROP COLUMN IF EXISTS deduction;

ALTER TABLE teacher_finance_config
  ADD COLUMN IF NOT EXISTS session_rate_60  numeric(10,2) NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS session_rate_90  numeric(10,2) NOT NULL DEFAULT 180,
  ADD COLUMN IF NOT EXISTS session_rate_120 numeric(10,2) NOT NULL DEFAULT 240,
  ADD COLUMN IF NOT EXISTS adj_scratch      numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adj_python       numeric(10,2) NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS adj_web          numeric(10,2) NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS adj_ai           numeric(10,2) NOT NULL DEFAULT 40;
