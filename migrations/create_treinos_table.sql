-- Criação da tabela treinos para o sistema de controle de treinos
-- Esta tabela armazena informações sobre os treinos registrados pelos usuários

CREATE TABLE IF NOT EXISTS treinos (
    id BIGSERIAL PRIMARY KEY,
    data TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('cardio', 'intensidade')),
    subcategoria TEXT NOT NULL,
    duracao INTEGER,
    distancia DECIMAL(10, 2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para melhorar performance em consultas por data
CREATE INDEX IF NOT EXISTS idx_treinos_data ON treinos(data);

-- Criar índice para melhorar performance em consultas por tipo
CREATE INDEX IF NOT EXISTS idx_treinos_tipo ON treinos(tipo);

-- Habilitar Row Level Security (RLS)
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;

-- Criar a política somente se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE policyname = 'Enable all access for treinos'
    ) THEN
        CREATE POLICY "Enable all access for treinos"
        ON treinos
        FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
