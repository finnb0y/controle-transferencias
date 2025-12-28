# Database Migrations

This folder contains SQL migration scripts for the database.

## How to Apply

To apply the migration for the treinos table:

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
