# Training Rewards Features Implementation

This document describes the new features implemented for managing training rewards and their monetary compensation.

## Overview

The system now supports a complete workflow for managing training rewards, including:
1. Tracking completed training weeks
2. Generating debits for monetary compensation
3. Processing payments and locking paid records

## Features

### 1. Weekly Reward Update Fix

**Problem:** When updating a week's rewards, manually unmarked days weren't properly synchronized with the database.

**Solution:**
- The reward update modal now properly handles manual day marking/unmarking
- Days can be manually toggled to override automatic detection
- Changes are synchronized with the database when the week is updated
- Paid days cannot be toggled or modified

### 2. Generate Debit for Completed Weeks

**Feature:** New "Gerar Débito" (Generate Debit) button for finalized training weeks.

**Workflow:**
1. User completes training weeks and claims rewards through the reward modal
2. For weeks that are finalized (prior to current date) and have been rewarded but not yet paid:
   - A "Gerar Débito" button appears next to "Atualizar Semana"
3. Clicking the button opens a week selection modal where users can:
   - See all unpaid rewarded weeks
   - Select multiple weeks to combine into a single debit
   - View a summary of total training days and monetary value
4. The debit is created with:
   - Description format: "Training Weeks DD/MM/YY to DD/MM/YY"
   - Value: 10 reais per effective training day
   - Status: Active (to be paid)
5. Selected weeks are linked to the debit in the database

**Calculation:**
- Each training day = R$ 10,00
- Multiple weeks can be combined into one debit
- Example: 3 weeks with 4, 5, and 4 training days = 13 days × R$ 10,00 = R$ 130,00

### 3. Rewarded Days Highlight and Lock

**Visual Indicators:**
- **Unpaid Rewards:** Days in rewarded weeks show a golden trophy icon (🏆)
- **Paid Rewards:** Days in paid weeks are highlighted with:
  - Green gradient background
  - Green border
  - Check icon (✓) instead of trophy
  - "Pago (bloqueado)" label in training list

**Data Protection:**
- Paid training days are locked from:
  - Editing (edit button replaced with "Pago" badge)
  - Deletion (delete button hidden)
  - Manual toggling in reward modal (button disabled)
  - Calendar day selection (shows warning message)
- This preserves data integrity for compensated records

## User Interface Changes

### Training Calendar
- Days with unpaid rewards: Purple/pink gradient + trophy icon
- Days with paid rewards: Green gradient + check icon + locked cursor

### Reward Modal
- "Atualizar Semana" button: Update reward information
- "Gerar Débito" button: Generate debit for payment (only for finalized, unpaid weeks)
- Week selector: Choose specific week to review
- Day toggle: Mark/unmark days (disabled for paid days)

### Training List (for specific day)
- Paid trainings show "Pago" badge instead of edit/delete buttons
- Green highlight indicates monetary compensation

### Debit Generation Modal
- Lists all unpaid rewarded weeks
- Multi-select capability
- Summary showing:
  - Number of weeks selected
  - Total training days
  - Total value in reais
- Generate/Cancel actions

## Database Schema Changes

### New Migration: `add_debito_id_to_recompensas.sql`

Adds to `recompensas` table:
```sql
debito_id BIGINT REFERENCES debitos(id) ON DELETE SET NULL
pago BOOLEAN NOT NULL DEFAULT FALSE
```

**Purpose:**
- `debito_id`: Links rewards to their payment debit entry
- `pago`: Flag indicating if the reward has been monetarily compensated

**Indexes:**
- `idx_recompensas_debito_id`: For efficient queries by debit
- `idx_recompensas_pago`: For filtering paid/unpaid rewards

## Payment Workflow

1. User creates debits from rewarded weeks
2. Debits appear in the "Débitos" section as active
3. When user pays the debit (full payment):
   - Debit status changes to "pago"
   - All linked rewards are marked as `pago = true`
   - Training days become highlighted and locked
   - Payment is recorded in transfers
4. Users can no longer modify paid training records

## Technical Implementation

### Key Functions

#### `diaEstaEmSemanaPaga(dataFormatada)`
Checks if a specific date is within a paid reward week.

#### `semanaEstaFinalizada(semana)`
Determines if a week is prior to the current date (finalized).

#### `abrirModalGerarDebito()`
Opens the debit generation modal with current week pre-selected.

#### `gerarDebitoRecompensas()`
Creates a debit from selected weeks and links them to the debit.

#### `pagarDebito()`
Extended to mark associated rewards as paid when debit is fully paid.

### UI Components

#### Generate Debit Modal
- Located in rewards modal section
- Z-index: 60 (above other modals)
- Displays week selection with checkmarks
- Shows calculation summary

#### Calendar Day Rendering
- Checks for paid status before applying styles
- Adds locked cursor for paid days
- Shows appropriate icon based on payment status

## Testing Checklist

- [ ] Create a training week with multiple days
- [ ] Claim reward for the week
- [ ] Generate debit from the rewarded week
- [ ] Verify debit appears in Débitos section
- [ ] Pay the debit
- [ ] Verify training days turn green on calendar
- [ ] Verify training days are locked from editing
- [ ] Try to edit paid training (should show warning)
- [ ] Try to delete paid training (button should not appear)
- [ ] Generate debit with multiple weeks combined
- [ ] Verify correct calculation (days × R$ 10,00)

## Future Enhancements

Possible improvements:
- Partial payment support for training debits
- Export report of paid training periods
- Statistics dashboard showing total compensation
- Configurable value per training day
- Bulk operations for multiple weeks

## Notes

- The 10 reais per day value is hardcoded in `gerarDebitoRecompensas()`
- Paid status is permanent and cannot be reversed through the UI
- The system prevents data loss by blocking modifications to paid records
- Multiple weeks can be combined for convenience in payment tracking
