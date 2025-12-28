# Quick Fix Guide: Training Edit Error

## If you're experiencing the error:
```
Erro ao editar treino: Could not find the 'exercicios' column of 'treinos' in the schema cache
```

## ⚡ Quick Fix (5 minutes)

1. **Go to your Supabase Dashboard** (https://supabase.com)
2. **Navigate to Settings → API**
3. **Click "Reload schema cache"** or similar button
4. **Wait 10-15 seconds** for the cache to refresh
5. **Try editing a training session again** - it should now work!

## 📋 What Changed in This Update

This update fixes the schema cache issue and makes the app more robust:

- ✅ Explicit column selection to ensure `exercicios` field is recognized
- ✅ Consistent handling of `exercicios` in both add and edit operations
- ✅ Comprehensive troubleshooting documentation
- ✅ Updated setup instructions to prevent this issue

## 🆕 For New Installations

If you're setting up the app for the first time:

1. Follow the instructions in `SETUP_INSTRUCTIONS.md`
2. **Important:** After running migrations, reload the schema cache (step 5 in setup)
3. Everything should work smoothly!

## 📖 Need More Help?

- **Troubleshooting:** See `TROUBLESHOOTING.md` for detailed solutions
- **Technical Details:** See `FIX_SUMMARY.md` for what changed under the hood
- **Setup Instructions:** See `SETUP_INSTRUCTIONS.md` for complete setup guide

## ✅ How to Verify the Fix

After reloading the schema cache:

1. Open the app and go to the Training section
2. Click on a date and add a Functional training session with exercises
3. Click Edit on that training session
4. Modify the exercises or details
5. Click Save - it should succeed without errors!

## 💡 Why This Happened

When the `exercicios` column was added to the database via migration, Supabase's API layer (PostgREST) didn't automatically update its cache of available columns. The code changes make the app more explicit about which columns to use, and the documentation helps users refresh the cache when needed.
