-- Criação da tabela recompensas para o sistema de controle de treinos
-- Esta tabela armazena informações sobre recompensas concedidas por semanas de treino

-- Note: Using TEXT for dates to maintain consistency with the rest of the application
-- which uses DD/MM/YYYY format throughout (see treinos table)
CREATE TABLE IF NOT EXISTS recompensas (
    id BIGSERIAL PRIMARY KEY,
    data_inicio_semana TEXT NOT NULL, -- Formato: DD/MM/YYYY (domingo da semana)
    data_fim_semana TEXT NOT NULL, -- Formato: DD/MM/YYYY (sábado da semana)
    dias_treino INTEGER NOT NULL, -- Quantidade de dias com treino na semana
    concedido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para melhorar performance em consultas por data de início de semana
CREATE INDEX IF NOT EXISTS idx_recompensas_data_inicio ON recompensas(data_inicio_semana);

-- Habilitar Row Level Security (RLS)
ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;

-- Criar a política somente se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE policyname = 'Enable all access for recompensas'
    ) THEN
        CREATE POLICY "Enable all access for recompensas"
        ON recompensas
        FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
