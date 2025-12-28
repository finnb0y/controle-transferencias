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

3. **Execute Initial Migration**
   - Copy the contents of `migrations/create_treinos_table.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

4. **Execute Exercises Enhancement Migration**
   - Copy the contents of `migrations/add_exercises_to_treinos.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

5. **Reload Schema Cache (IMPORTANT!)**
   - After running the migrations, go to "Settings" → "API" in your Supabase dashboard
   - Look for "Reload schema cache" or similar button
   - Click it to refresh the schema cache
   - This ensures the application can access the new `exercicios` column
   - Without this step, you may get errors when editing training sessions

This will create the `treinos` table with the following structure:
- `id`: Auto-incrementing primary key
- `data`: Date in DD/MM/YYYY format
- `tipo`: Workout type ('cardio' or 'intensidade')
- `subcategoria`: Specific workout subcategory
- `duracao`: Duration in minutes (optional)
- `distancia`: Distance in kilometers (optional)
- `observacoes`: Additional notes (optional)
- `exercicios`: Array of exercises for functional training (JSONB)
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
- **Functional Training with Multiple Exercises**:
  - Add specific exercises (e.g., planks, sit-ups, burpees)
  - Record repetitions or duration for each exercise
  - Add as many exercises as needed in one session
  - Remove individual exercises with X button
- Edit existing workouts (including exercises)
- Delete workouts
- Optional fields: duration, distance, observations
- **Modal overlay interface**: form appears over the calendar
- Visual feedback with check marks and colored indicators
- **Modern rounded design**: smoother, more appealing interface

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
3. Click on any date to add a workout (form opens as overlay)
4. Select workout type (Cardio or Intensidade)
5. Choose a subcategory
6. **For Functional Training**:
   - Enter exercise name (e.g., "Prancha", "Abdominais")
   - Add repetitions and/or duration for each exercise
   - Click "Adicionar Exercício" to add to the list
   - Add multiple exercises to build your complete workout
   - Remove exercises using the X button if needed
7. **For Other Training Types**:
   - Optionally add duration, distance, and notes
8. Click "Adicionar Treino" to save
9. View all workouts for a day by clicking on dates with workouts
10. Edit or delete workouts using the icons on workout cards
11. Close the form overlay by clicking X or Cancel button

## Color Scheme

The training section uses a soft, welcoming color palette:
- Background: Purple to pink gradient
- Cardio workouts: Red (#ef4444)
- Intensity workouts: Purple (#8b5cf6)
- Accent colors: Warm and inviting tones
