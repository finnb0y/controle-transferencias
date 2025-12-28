# Setup Instructions for Training Feature

This document provides instructions for setting up the new Training Calendar feature.

## Database Setup

The training feature requires a new table in your Supabase database.

### Steps to Create the Table

1. **Access Supabase Dashboard**
   - Go to https://supabase.com
   - Navigate to your project dashboard

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute Migration**
   - Copy the contents of `migrations/create_treinos_table.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

This will create the `treinos` table with the following structure:
- `id`: Auto-incrementing primary key
- `data`: Date in DD/MM/YYYY format
- `tipo`: Workout type ('cardio' or 'intensidade')
- `subcategoria`: Specific workout subcategory
- `duracao`: Duration in minutes (optional)
- `distancia`: Distance in kilometers (optional)
- `observacoes`: Additional notes (optional)
- `created_at`: Timestamp of creation

## Features

### Home Screen
- Three main options: Adicionar Transferência, Visualizar Histórico, and Treino
- Clean card-based interface with hover effects

### Training Calendar
- Interactive monthly calendar
- Visual indicators for days with workouts
- Color-coded workout types:
  - **Cardio** (red): Walking, Running, Swimming, Cycling, Elliptical
  - **Intensidade** (purple): Weightlifting, CrossFit, HIIT, Functional, Calisthenics

### Workout Management
- Add multiple workouts per day
- Edit existing workouts
- Delete workouts
- Optional fields: duration, distance, observations
- Visual feedback with check marks and colored indicators

## Development

### Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

The Supabase connection is configured in `src/supabaseClient.js`. Update these values if needed:
- `supabaseUrl`: Your Supabase project URL
- `supabaseKey`: Your Supabase public/anon key

## Usage

1. Click on "Treino" from the home screen
2. Navigate months using arrow buttons
3. Click on any date to add a workout
4. Select workout type (Cardio or Intensidade)
5. Choose a subcategory
6. Optionally add duration, distance, and notes
7. Click "Adicionar Treino" to save
8. View all workouts for a day by clicking on dates with workouts
9. Edit or delete workouts using the icons on workout cards

## Color Scheme

The training section uses a soft, welcoming color palette:
- Background: Purple to pink gradient
- Cardio workouts: Red (#ef4444)
- Intensity workouts: Purple (#8b5cf6)
- Accent colors: Warm and inviting tones
