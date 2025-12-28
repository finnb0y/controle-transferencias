# Fix Summary: Training Session Edit Error

## Issue Description
When attempting to edit and save training sessions, users encountered the error:
```
Erro ao editar treino: Could not find the 'exercicios' column of 'treinos' in the schema cache
```

## Root Cause
The error occurred because Supabase's PostgREST schema cache didn't recognize the `exercicios` column. This can happen when:
1. A column is added via SQL migration but the schema cache isn't refreshed
2. The application uses `SELECT *` which doesn't explicitly tell Supabase which columns to expect
3. The update operation tries to modify a column that's "unknown" to the API layer

## Changes Made

### 1. Explicit Column Selection in `carregarTreinos` (Line 137)
**Before:**
```javascript
.select('*')
```

**After:**
```javascript
.select('id, data, tipo, subcategoria, duracao, distancia, observacoes, exercicios, created_at')
```

**Why:** Explicitly listing all columns, including `exercicios`, helps Supabase recognize that this column should be accessible through the API. This is more reliable than using `SELECT *` when dealing with schema cache issues.

### 2. Simplified `exercicios` Field Handling in Insert Operation (Lines 513-522)
**Before:**
```javascript
const treinoData = { /* fields */ };
if (formularioTreino.subcategoria === 'Funcional') {
  treinoData.exercicios = exercicios;
}
```

**After:**
```javascript
const treinoData = {
  // ... other fields ...
  exercicios: formularioTreino.subcategoria === 'Funcional' ? exercicios : []
};
```

**Why:** Always including the `exercicios` field (even if empty) ensures consistency and avoids conditional logic that could lead to missing fields.

### 3. Simplified `exercicios` Field Handling in Update Operation (Lines 582-590)
**Before:**
```javascript
const updateData = { /* fields */ };
if (formularioTreino.subcategoria === 'Funcional') {
  updateData.exercicios = exercicios;
} else {
  updateData.exercicios = [];
}
```

**After:**
```javascript
const updateData = {
  // ... other fields ...
  exercicios: formularioTreino.subcategoria === 'Funcional' ? exercicios : []
};
```

**Why:** More concise and consistent with the insert operation. Always includes the field in the update payload.

### 4. Created TROUBLESHOOTING.md
A comprehensive guide for users to:
- Understand the schema cache error
- Reload the schema cache in Supabase Dashboard
- Re-run migrations if needed
- Verify the fix worked
- Handle other common issues

### 5. Updated SETUP_INSTRUCTIONS.md
Added explicit step to reload schema cache after running migrations, preventing this issue from occurring during initial setup.

## Technical Details

### Why This Fixes the Issue
1. **Explicit Column Selection**: By explicitly listing `exercicios` in the SELECT query, we inform Supabase's client library that this column exists and should be available
2. **Consistent Field Inclusion**: Always including `exercicios` in insert/update operations (even if empty) ensures the API knows to handle this field
3. **Documentation**: Users now have clear instructions to refresh the schema cache, which is the ultimate solution to this PostgREST-specific issue

### Schema Cache in Supabase/PostgREST
- Supabase uses PostgREST to automatically generate REST APIs from PostgreSQL tables
- PostgREST maintains a schema cache to know which tables and columns exist
- When columns are added directly via SQL, the cache needs to be refreshed
- The cache refresh happens automatically when Supabase detects schema changes, but sometimes manual refresh is needed

## Testing Recommendations

To verify the fix works:

1. **With Fresh Setup:**
   - Run migrations in order
   - Reload schema cache (as documented in SETUP_INSTRUCTIONS.md)
   - Create a functional training session with exercises
   - Edit and save - should work without errors

2. **With Existing Setup (Error State):**
   - If currently experiencing the error, reload schema cache in Supabase Dashboard
   - Try editing a training session
   - Should work after cache refresh

3. **Different Training Types:**
   - Test editing Cardio training (no exercises)
   - Test editing Functional training (with exercises)
   - Test changing from Functional to another type (should clear exercises)
   - Test changing from another type to Functional (should allow adding exercises)

## Future Prevention

The code changes make the application more robust, but users should still:
1. Always reload schema cache after running migrations
2. Explicitly select columns when schema changes are involved
3. Use the TROUBLESHOOTING.md guide if issues arise
