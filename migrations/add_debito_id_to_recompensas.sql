-- Migration: Add debito_id to recompensas table
-- This links rewards to their corresponding debit entries when paid

-- Add debito_id column to track which debit pays for this reward
ALTER TABLE recompensas 
ADD COLUMN IF NOT EXISTS debito_id BIGINT REFERENCES debitos(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_recompensas_debito_id ON recompensas(debito_id);

-- Add pago (paid) status column to track if reward has been monetarily compensated
ALTER TABLE recompensas
ADD COLUMN IF NOT EXISTS pago BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for paid status
CREATE INDEX IF NOT EXISTS idx_recompensas_pago ON recompensas(pago);

-- Add comment for documentation
COMMENT ON COLUMN recompensas.debito_id IS 'Reference to the debit entry that pays for this reward';
COMMENT ON COLUMN recompensas.pago IS 'Whether this reward has been monetarily compensated (paid)';
