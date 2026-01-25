# Payment Type Selection Feature - Implementation Guide

## Overview
This document describes the implementation of the payment type selection feature for debit payments in the controle-transferencias application.

## Feature Description
Users can now select the payment type (Digital or Cash/Em Espécie) when recording debit payments. This feature includes:

1. **UI Updates**: Payment type selector in the payment form
2. **Backend Logic**: Storage of payment type in database
3. **Historical Display**: Payment type shown in transaction history

## Implementation Details

### 1. Database Changes

#### Migration: `add_tipo_pagamento_to_debitos.sql`
Added a new column to the `debitos` table:

```sql
ALTER TABLE debitos 
ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT NOT NULL DEFAULT 'digital' 
CHECK (tipo_pagamento IN ('digital', 'especie'));
```

**Fields:**
- `tipo_pagamento`: Payment type ('digital' or 'especie')
- Default: 'digital' for backward compatibility
- Indexed for performance

### 2. UI Changes

#### Payment Form State
Updated `formularioPagamento` state to include payment type:

```javascript
const [formularioPagamento, setFormularioPagamento] = useState({
  valorPagamento: '',
  tipoPagamento: 'digital'  // New field
});
```

#### Payment Type Selector
Added visual buttons for payment type selection in the payment form:

```jsx
<div className="flex gap-4">
  <button
    type="button"
    onClick={() => setFormularioPagamento({ 
      ...formularioPagamento, 
      tipoPagamento: 'digital' 
    })}
    className={/* Dynamic styling based on selection */}
  >
    💳 Digital
  </button>
  <button
    type="button"
    onClick={() => setFormularioPagamento({ 
      ...formularioPagamento, 
      tipoPagamento: 'especie' 
    })}
    className={/* Dynamic styling based on selection */}
  >
    💵 Em Espécie
  </button>
</div>
```

**Features:**
- Visual feedback with different colors (blue for digital, orange for cash)
- Emoji icons for quick identification (💳 for digital, 💵 for cash)
- Dark mode support
- Clear active state indication

### 3. Backend Logic Updates

#### Payment Processing
Updated the `pagarDebito` function to save payment type:

**For Complete Payments:**
```javascript
await supabase
  .from('debitos')
  .update({
    valor_pago: novoValorPago,
    valor_restante: 0,
    status: 'pago',
    tipo_pagamento: formularioPagamento.tipoPagamento  // New field
  })
  .eq('id', debitoSelecionado.id);
```

**For Partial Payments:**
```javascript
await supabase
  .from('debitos')
  .update({
    valor_pago: novoValorPago,
    valor_restante: novoValorRestante,
    numero_parcela: numeroParcela,
    tipo_pagamento: formularioPagamento.tipoPagamento  // New field
  })
  .eq('id', debitoSelecionado.id);
```

**Transfer Record:**
```javascript
await supabase
  .from('transferencias')
  .insert([{
    valor: formularioPagamento.valorPagamento,
    data: dataFormatada,
    tipo: formularioPagamento.tipoPagamento,  // Uses selected type
    descricao: `Pagamento: ${debitoSelecionado.nome}`
  }]);
```

### 4. Historical Display

#### Active Debits
Shows payment type for partially paid debits:

```jsx
{debito.valor_pago > 0 && debito.tipo_pagamento && (
  <p className={`text-xs mt-1`}>
    {debito.tipo_pagamento === 'digital' ? '💳 Digital' : '💵 Em Espécie'}
  </p>
)}
```

#### Paid Debits History
Shows payment type in the paid debits section:

```jsx
<p className={`text-sm`}>
  Criado: {debito.data_criacao} | Pago: R$ {debito.valor_total.toFixed(2)}
  {debito.tipo_pagamento && (
    <span className="ml-2">
      | {debito.tipo_pagamento === 'digital' ? '💳 Digital' : '💵 Em Espécie'}
    </span>
  )}
</p>
```

## User Flow

1. **Navigate to Débitos**: User clicks on "Débitos" in the Transferências menu
2. **Select Debit**: User clicks "Pagar Débito" on an active debit
3. **Payment Form Appears**: Form expands showing:
   - Payment amount input field
   - Payment type selector (Digital or Cash)
   - Confirm and Cancel buttons
4. **Select Payment Type**: User clicks either "💳 Digital" or "💵 Em Espécie"
5. **Enter Amount**: User enters payment amount
6. **Confirm Payment**: System saves both amount and payment type
7. **View History**: Payment type is displayed in:
   - Active debits (if partially paid)
   - Paid debits history
   - Transfer records

## Data Flow

```
User selects payment type
    ↓
State updated (formularioPagamento.tipoPagamento)
    ↓
User confirms payment
    ↓
Payment processed:
  - debitos table: tipo_pagamento field updated
  - transferencias table: tipo field set to selected value
    ↓
UI refreshed showing payment type in history
```

## Testing

### Test File: `App.payment-type.test.js`
Created unit tests covering:
- Digital payment type selection
- Cash payment type selection
- Default payment type (digital)
- Debit update with payment type
- Transfer record creation with payment type
- Complete payment with payment type

### Manual Testing Steps
1. Create or select an active debit
2. Click "Pagar Débito"
3. Verify payment type selector appears with two options
4. Select "💵 Em Espécie"
5. Verify button changes to active state (orange)
6. Enter payment amount
7. Click "Confirmar Pagamento"
8. Verify payment is recorded in history with cash type indicator
9. Repeat with "💳 Digital" selection

## Visual Examples

### Payment Form (When Paying a Debit)
- **Payment Amount Field**: Text input for entering the payment value
- **Payment Type Selector**: Two prominent buttons side-by-side
  - Left button: "💳 Digital" (blue when selected)
  - Right button: "💵 Em Espécie" (orange when selected)
- **Action Buttons**: "Confirmar Pagamento" (green) and "Cancelar" (gray)

### Active Debits Display
Shows payment type below the "Valor Pago" field for debits with partial payments:
- Small text with emoji indicator
- Example: "💳 Digital" or "💵 Em Espécie"

### Paid Debits History
Shows payment type in the summary line:
- Format: "Criado: DD/MM/YYYY | Pago: R$ XX.XX | 💳 Digital"
- Or: "Criado: DD/MM/YYYY | Pago: R$ XX.XX | 💵 Em Espécie"

## Backward Compatibility

- **Default Value**: All existing records default to 'digital' via migration
- **Conditional Display**: Payment type only shown if the field exists and has a value
- **No Breaking Changes**: All existing functionality preserved

## Technical Notes

- **Payment Types**: 'digital' and 'especie' (Portuguese for "cash")
- **UI Consistency**: Uses same color scheme as regular transfers (blue for digital, orange for cash)
- **Dark Mode**: Full support with appropriate color adjustments
- **Icons**: Emoji-based for universal recognition (💳 and 💵)
- **Validation**: Database constraint ensures only valid payment types
- **Performance**: Indexed field for efficient querying and filtering

## Future Enhancements

Potential improvements for future iterations:
1. Filter debits by payment type
2. Statistics showing breakdown by payment type
3. Export functionality including payment type
4. Bulk payment with type selection
5. Payment type change/correction feature
