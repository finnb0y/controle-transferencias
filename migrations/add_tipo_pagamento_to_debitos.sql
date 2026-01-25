-- Migration: Add tipo_pagamento column to debitos table
-- 
-- This migration adds a payment type field to track whether payments
-- were made digitally or in cash
-- 
-- Column:
-- - tipo_pagamento: Payment type ('digital' or 'especie' for cash)
-- Default: 'digital' for backward compatibility with existing records

-- Add tipo_pagamento column to debitos table
ALTER TABLE debitos 
ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT NOT NULL DEFAULT 'digital' 
CHECK (tipo_pagamento IN ('digital', 'especie'));

-- Create index for better query performance when filtering by payment type
CREATE INDEX IF NOT EXISTS idx_debitos_tipo_pagamento ON debitos(tipo_pagamento);

-- Add comment to the column for documentation
COMMENT ON COLUMN debitos.tipo_pagamento IS 'Payment type: digital (digital) or especie (cash)';
