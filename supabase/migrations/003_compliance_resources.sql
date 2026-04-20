-- Migration 003: Add resources column to compliance_items
ALTER TABLE compliance_items
  ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]';
