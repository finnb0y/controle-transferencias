# Database Migrations

This folder contains SQL migration scripts for the database.

## How to Apply

### For the treinos table:

1. Access your Supabase dashboard
2. Go to the SQL Editor
3. Copy the content of `create_treinos_table.sql`
4. Paste and execute it in the SQL Editor

This will create the `treinos` table with the following structure:

- `id`: Primary key (auto-increment)
- `data`: Date of the workout (format: DD/MM/YYYY)
- `tipo`: Type of workout ('cardio' or 'intensidade')
- `subcategoria`: Subcategory of the workout
- `duracao`: Duration in minutes (optional)
- `distancia`: Distance in kilometers (optional)
- `observacoes`: Additional notes (optional)
- `created_at`: Timestamp of record creation

The script also creates indexes for better query performance and enables Row Level Security.

### For the recompensas table (Reward System):

1. Access your Supabase dashboard
2. Go to the SQL Editor
3. Copy the content of `create_recompensas_table.sql`
4. Paste and execute it in the SQL Editor

This will create the `recompensas` table with the following structure:

- `id`: Primary key (auto-increment)
- `data_inicio_semana`: Start date of the rewarded week (format: DD/MM/YYYY, Sunday)
- `data_fim_semana`: End date of the rewarded week (format: DD/MM/YYYY, Saturday)
- `dias_treino`: Number of training days in the week
- `concedido_em`: Timestamp when the reward was granted

**Important:** This table stores weeks that have been rewarded for training consistency. When a user claims a reward, the week range is saved here. The calendar then displays a small golden trophy icon (🏆) on all days within rewarded weeks, providing visual feedback for consistent training achievements.

### Additional Migrations:

- `add_exercises_to_treinos.sql`: Adds support for multiple exercises in functional training
- `add_time_fields_to_treinos.sql`: Adds time tracking fields (horario_inicio, horario_fim)

## Migration Order

Apply migrations in this order:
1. `create_treinos_table.sql`
2. `add_exercises_to_treinos.sql`
3. `add_time_fields_to_treinos.sql`
4. `create_recompensas_table.sql` (NEW - for reward indicators)
