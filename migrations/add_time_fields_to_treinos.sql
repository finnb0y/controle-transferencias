-- Adicionar campos de horário para treinos
-- Esta migração adiciona campos de horário de início e fim para treinos
-- A duração será calculada automaticamente com base no início e fim

-- Adicionar novos campos de horário
ALTER TABLE treinos 
  ADD COLUMN IF NOT EXISTS horario_inicio TIME,
  ADD COLUMN IF NOT EXISTS horario_fim TIME;

-- Comentário: O campo duracao será mantido por compatibilidade retroativa
-- mas não será mais usado para novos registros. A duração será calculada
-- automaticamente a partir de horario_inicio e horario_fim

-- Criar índice para melhorar performance em consultas por horário
CREATE INDEX IF NOT EXISTS idx_treinos_horario_inicio ON treinos(horario_inicio);
CREATE INDEX IF NOT EXISTS idx_treinos_horario_fim ON treinos(horario_fim);
