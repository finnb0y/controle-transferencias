# Troubleshooting Guide

## Error: "Could not find the 'exercicios' column of 'treinos' in the schema cache"

This error occurs when trying to edit a training session and the Supabase schema cache doesn't recognize the `exercicios` column.

### Root Cause
The `exercicios` column was added to the `treinos` table via a migration, but Supabase's PostgREST schema cache hasn't been refreshed to recognize it.

### Solution

#### Option 1: Reload Schema Cache in Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard (https://supabase.com)
2. Navigate to your project
3. Click on "Settings" in the left sidebar
4. Click on "API" 
5. Scroll down to find the "Reload schema cache" or "Refresh schema" button
6. Click it to reload the schema cache
7. Wait a few seconds for the cache to refresh
8. Try editing a training session again

#### Option 2: Re-run the Migration
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Run this query to verify the column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'treinos';
   ```
4. If `exercicios` is not listed, run the migration:
   ```sql
   -- Copy and paste contents of migrations/add_exercises_to_treinos.sql
   ALTER TABLE treinos
   ADD COLUMN IF NOT EXISTS exercicios JSONB DEFAULT '[]'::jsonb;
   
   CREATE INDEX IF NOT EXISTS idx_treinos_exercicios ON treinos USING GIN (exercicios);
   
   COMMENT ON COLUMN treinos.exercicios IS 'Array of exercises for functional training. Each exercise has: nome (string), repeticoes (integer), duracao (integer in seconds)';
   ```
5. After running the migration, reload the schema cache (see Option 1)

#### Option 3: Restart the Supabase Project
1. Go to your Supabase Dashboard
2. Navigate to your project settings
3. Under "General", find the option to pause and resume the project
4. Pause the project and then resume it
5. This will force a complete reload of all services including the schema cache

### Prevention
- Always run migrations in the correct order
- After running any migration that adds/modifies columns, reload the schema cache
- Ensure the migration files in the `migrations/` folder are executed in order:
  1. `create_treinos_table.sql`
  2. `add_exercises_to_treinos.sql`

### Verification
After applying the fix, verify it works by:
1. Opening the app and navigating to the Training section
2. Creating a functional training session with exercises
3. Editing that training session
4. Saving the changes
5. The save should succeed without errors

## Other Common Issues

### Training sessions not loading
**Symptom**: The training calendar shows but no sessions appear

**Solution**:
1. Check browser console for errors
2. Verify the `treinos` table exists in Supabase
3. Ensure Row Level Security (RLS) policies allow reading from the table
4. Run: `create_treinos_table.sql` migration if table doesn't exist

### Cannot add training sessions
**Symptom**: Get errors when trying to add new training sessions

**Solution**:
1. Verify both migrations have been run
2. Check that RLS policies allow inserting into the table
3. Check browser console for specific error messages
4. Ensure Supabase URL and API key are correct in `src/supabaseClient.js`
