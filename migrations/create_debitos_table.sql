-- Migration: Create debitos table for debit management
-- 
-- This table stores active debits and their payment history
-- 
-- Table structure:
-- - id: Primary key (auto-increment)
-- - nome: Name/description of the debit
-- - valor_total: Total amount of the debit
-- - valor_pago: Amount already paid (for partial payments)
-- - valor_restante: Remaining amount to be paid
-- - data_criacao: Date when the debit was created (format: DD/MM/YYYY)
-- - status: Status of the debit ('ativo' or 'pago')
-- - numero_parcela: Parcel number (for split debits from partial payments)
-- - debito_original_id: Reference to the original debit (for partial payment tracking)
-- - created_at: Timestamp of record creation
-- - updated_at: Timestamp of last update

-- Create debitos table
CREATE TABLE IF NOT EXISTS debitos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
  valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
  valor_restante DECIMAL(10,2) NOT NULL CHECK (valor_restante >= 0),
  data_criacao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pago')),
  numero_parcela INTEGER DEFAULT NULL,
  debito_original_id BIGINT DEFAULT NULL REFERENCES debitos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_debitos_status ON debitos(status);
CREATE INDEX IF NOT EXISTS idx_debitos_data_criacao ON debitos(data_criacao);
CREATE INDEX IF NOT EXISTS idx_debitos_debito_original_id ON debitos(debito_original_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_debitos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER debitos_updated_at
  BEFORE UPDATE ON debitos
  FOR EACH ROW
  EXECUTE FUNCTION update_debitos_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE debitos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your authentication setup)
-- For now, allowing all operations. In production, you should restrict based on user_id
CREATE POLICY "Allow all operations on debitos" ON debitos FOR ALL USING (true);

-- Add comments to the table and columns for documentation
COMMENT ON TABLE debitos IS 'Stores active debits and their payment history';
COMMENT ON COLUMN debitos.nome IS 'Name or description of the debit';
COMMENT ON COLUMN debitos.valor_total IS 'Total amount of the debit';
COMMENT ON COLUMN debitos.valor_pago IS 'Amount already paid (for partial payments)';
COMMENT ON COLUMN debitos.valor_restante IS 'Remaining amount to be paid';
COMMENT ON COLUMN debitos.data_criacao IS 'Date when the debit was created (DD/MM/YYYY format)';
COMMENT ON COLUMN debitos.status IS 'Status: ativo (active) or pago (paid)';
COMMENT ON COLUMN debitos.numero_parcela IS 'Parcel number for debits created from partial payments';
COMMENT ON COLUMN debitos.debito_original_id IS 'Reference to the original debit for tracking partial payments';
