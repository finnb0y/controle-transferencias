-- Add unique constraint to prevent duplicate week entries in recompensas table
-- This ensures that each week (identified by start and end dates) can only have one reward entry

-- First, remove any duplicate entries if they exist
-- Keep only the most recent entry for each week
DELETE FROM recompensas a
USING recompensas b
WHERE a.id < b.id
  AND a.data_inicio_semana = b.data_inicio_semana
  AND a.data_fim_semana = b.data_fim_semana;

-- Add unique constraint to prevent future duplicates
ALTER TABLE recompensas
ADD CONSTRAINT unique_semana_recompensa
UNIQUE (data_inicio_semana, data_fim_semana);
