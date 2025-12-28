-- Add support for multiple exercises within a training session
-- This allows functional training to have multiple exercises with repetitions/duration

-- Add new column to store exercises as JSON array
-- Each exercise will have: nome (name), repeticoes (repetitions), duracao (duration)
ALTER TABLE treinos
ADD COLUMN IF NOT EXISTS exercicios JSONB DEFAULT '[]'::jsonb;

-- Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_treinos_exercicios ON treinos USING GIN (exercicios);

-- Add comment for documentation
COMMENT ON COLUMN treinos.exercicios IS 'Array of exercises for functional training. Each exercise has: nome (string), repeticoes (integer), duracao (integer in seconds)';
