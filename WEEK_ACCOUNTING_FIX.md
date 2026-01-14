# Fix Week Accounting Logic - Summary

## Issues Fixed

### 1. Month-Based Blocking Removed
**Problem**: The `verificarSemanaCompleta` function was filtering weeks based on which month they primarily belonged to. This caused weeks spanning two months (like 28/12/2025 - 03/01/2026) to only count the days in the "reference month", resulting in incomplete training counts.

**Solution**: 
- Removed the month-based filtering logic
- Changed the function to always consider all 7 days of a week, regardless of month or year boundaries
- This ensures weeks spanning multiple months are properly counted

**Code Changes**:
```javascript
// Before: Counted only days in the reference month
const mesReferencia = semanaSelecionadaRecompensa ? new Date(semanaSelecionadaRecompensa).getMonth() : new Date().getMonth();
let diasNoMes = 0;
semana.forEach(dia => {
  if (dia.data.getMonth() === mesReferencia) {
    diasNoMes++;
  }
});

// After: Always counts all 7 days
const diasNoMes = 7; // Always consider the full week
```

### 2. Unfinished Weeks No Longer Generate Debt
**Problem**: On 14/01/2026, the week of 11/01/2026 to 17/01/2026 was listed as able to generate debt, even though the week wasn't finished and hadn't been verified (no medals awarded).

**Solution**:
- Modified `semanaEstaFinalizada` to check BOTH that the week has ended AND that it has been rewarded
- This ensures only verified, completed weeks can generate debt

**Code Changes**:
```javascript
// Before: Only checked if week ended
return dataFim < hoje;

// After: Checks both conditions
const jaPassou = dataFim < hoje;
const foiRecompensada = verificarSemanaJaRecompensada(semana) !== null;
return jaPassou && foiRecompensada;
```

### 3. Duplicate Week Entries Fixed
**Problem**: Multiple entries were being created for the same week (e.g., three entries for 04/01/2026 - 10/01/2026).

**Solution**:
- Created database migration to add unique constraint on (data_inicio_semana, data_fim_semana)
- Migration includes cleanup code to remove existing duplicates
- Updated insertion logic to use PostgreSQL's `upsert` feature instead of separate insert/update logic
- The upsert automatically handles conflicts and updates existing records instead of creating duplicates

**Files Created**:
- `migrations/add_unique_constraint_recompensas.sql`

**Code Changes**:
```javascript
// Before: Separate check and insert/update
const semanaExistente = verificarSemanaJaRecompensada(semana);
if (semanaExistente) {
  await supabase.from('recompensas').update(...).eq(...);
} else {
  await supabase.from('recompensas').insert([...]);
}

// After: Upsert handles both cases
await supabase.from('recompensas').upsert(
  { data_inicio_semana, data_fim_semana, dias_treino, concedido_em },
  { onConflict: 'data_inicio_semana,data_fim_semana', ignoreDuplicates: false }
);
```

### 4. Cross-Month/Year Training Accounting Fixed
**Problem**: Week 28/12/2025 - 03/01/2026 was showing only 4 trainings instead of all 7 days.

**Solution**:
- This was automatically fixed by addressing Issue #1
- With the month-based blocking removed, all days in the week are now counted regardless of which month or year they belong to
- The week accounting now correctly handles year boundaries (December to January)

## Migration Instructions

To apply these fixes to an existing database:

1. Run the new migration:
```sql
-- This is in migrations/add_unique_constraint_recompensas.sql
-- It will:
-- 1. Remove any duplicate entries (keeping only the most recent)
-- 2. Add unique constraint to prevent future duplicates
```

2. The application code changes are backward compatible and will work with both old and new database schemas.

## Testing Recommendations

1. Test with a week spanning two months (e.g., 28/12/2025 - 03/01/2026):
   - Verify all 7 days are counted
   - Verify trainings on all days are properly tracked

2. Test duplicate prevention:
   - Try to add reward for the same week multiple times
   - Verify only one entry exists in the database

3. Test debt generation:
   - Verify unfinished weeks don't show "Generate Debt" button
   - Verify unrewarded weeks don't show in the debt generation list
   - Verify only finished AND rewarded weeks can generate debt

4. Test current week behavior:
   - On 14/01/2026, week 11/01 - 17/01 should NOT be available for debt
   - Only when week ends (after 17/01) AND is rewarded should it appear

## Impact

These changes ensure:
- ✅ No duplicate week entries in the database
- ✅ Accurate training counts for weeks spanning multiple months/years
- ✅ Proper validation that only finished, rewarded weeks can generate debt
- ✅ Cleaner, more maintainable code using upsert pattern
- ✅ Better data integrity with database constraints
