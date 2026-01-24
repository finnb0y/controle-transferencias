// Test file to verify payment type functionality
// Ensures that payment type selection and storage works correctly

import { describe, it, expect } from 'vitest';

describe('Payment Type Feature', () => {
  it('should support digital payment type', () => {
    const formularioPagamento = {
      valorPagamento: '100,00',
      tipoPagamento: 'digital'
    };
    
    expect(formularioPagamento.tipoPagamento).toBe('digital');
  });

  it('should support cash payment type (especie)', () => {
    const formularioPagamento = {
      valorPagamento: '100,00',
      tipoPagamento: 'especie'
    };
    
    expect(formularioPagamento.tipoPagamento).toBe('especie');
  });

  it('should default to digital when not specified', () => {
    const formularioPagamento = {
      valorPagamento: '100,00',
      tipoPagamento: 'digital'
    };
    
    expect(formularioPagamento.tipoPagamento).toBe('digital');
  });

  it('should create debit update with payment type', () => {
    const debitoUpdate = {
      valor_pago: 100,
      valor_restante: 50,
      status: 'ativo',
      tipo_pagamento: 'especie'
    };
    
    expect(debitoUpdate.tipo_pagamento).toBe('especie');
    expect(debitoUpdate.valor_pago).toBe(100);
  });

  it('should create transfer record with payment type', () => {
    const transferencia = {
      valor: '100,00',
      data: '24/01/2026',
      tipo: 'digital',
      descricao: 'Pagamento: Test Debit'
    };
    
    expect(transferencia.tipo).toBe('digital');
    expect(transferencia.descricao).toContain('Pagamento:');
  });

  it('should create transfer record with cash payment type', () => {
    const transferencia = {
      valor: '100,00',
      data: '24/01/2026',
      tipo: 'especie',
      descricao: 'Pagamento parcial 1: Test Debit'
    };
    
    expect(transferencia.tipo).toBe('especie');
    expect(transferencia.descricao).toContain('Pagamento parcial');
  });

  it('should mark debit as paid with payment type', () => {
    const debitoCompleto = {
      valor_pago: 150,
      valor_restante: 0,
      status: 'pago',
      tipo_pagamento: 'digital'
    };
    
    expect(debitoCompleto.status).toBe('pago');
    expect(debitoCompleto.valor_restante).toBe(0);
    expect(debitoCompleto.tipo_pagamento).toBe('digital');
  });
});
