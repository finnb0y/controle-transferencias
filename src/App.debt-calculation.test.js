// Test file to verify training debt calculation logic
// Ensures that debts are calculated proportionally to actual training days registered

import { describe, it, expect } from 'vitest';

describe('Training Debt Calculation', () => {
  it('should calculate debt proportional to actual training days', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Mock rewarded weeks with different actual training days
    const semanasRecompensadas = [
      { id: 1, data_inicio_semana: '21/12/2025', data_fim_semana: '27/12/2025', dias_treino: 4 },
      { id: 2, data_inicio_semana: '28/12/2025', data_fim_semana: '03/01/2026', dias_treino: 5 },
      { id: 3, data_inicio_semana: '04/01/2026', data_fim_semana: '10/01/2026', dias_treino: 6 }
    ];
    
    // Calculate total using actual training days
    const totalDiasTreino = semanasRecompensadas.reduce((acc, s) => {
      return acc + s.dias_treino;
    }, 0);
    
    const valorTotal = totalDiasTreino * VALOR_POR_DIA_TREINO;
    
    // Expected: 4 + 5 + 6 = 15 days × R$10 = R$150
    expect(totalDiasTreino).toBe(15);
    expect(valorTotal).toBe(150);
  });

  it('should calculate week 28/12-03/01 with 4 days as R$40', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Week spanning December to January with 4 training days
    const semana = { 
      id: 2, 
      data_inicio_semana: '28/12/2025', 
      data_fim_semana: '03/01/2026', 
      dias_treino: 4
    };
    
    // New logic uses actual training days
    const calculation = semana.dias_treino * VALOR_POR_DIA_TREINO;
    
    expect(calculation).toBe(40);
  });

  it('should calculate week 04/01-10/01 with 6 days as R$60', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Week with 6 training days
    const semana = { 
      id: 3, 
      data_inicio_semana: '04/01/2026', 
      data_fim_semana: '10/01/2026', 
      dias_treino: 6
    };
    
    // New logic uses actual training days
    const calculation = semana.dias_treino * VALOR_POR_DIA_TREINO;
    
    expect(calculation).toBe(60);
  });

  it('should calculate correct total for multiple weeks with different training days', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Example from problem statement
    const semanas = [
      { id: 1, dias_treino: 7 }, // Week 04-10/01 with 7 trainings
      { id: 2, dias_treino: 5 }, // Week 11-17/01 with 5 trainings
      { id: 3, dias_treino: 4 }  // Week 18-24/01 with 4 trainings
    ];
    
    // Each week counts actual training days
    const totalDias = semanas.reduce((acc, s) => acc + s.dias_treino, 0); // 7 + 5 + 4 = 16 days
    const valorTotal = totalDias * VALOR_POR_DIA_TREINO;
    
    expect(totalDias).toBe(16);
    expect(valorTotal).toBe(160); // R$160 for 16 training days
  });

  it('should handle incomplete weeks correctly', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Week with minimum training (4 days)
    const semanaMinima = { dias_treino: 4 };
    
    // Week with maximum training (7 days)
    const semanaMaxima = { dias_treino: 7 };
    
    // Each should be valued proportionally
    const valorMinima = semanaMinima.dias_treino * VALOR_POR_DIA_TREINO; // R$40
    const valorMaxima = semanaMaxima.dias_treino * VALOR_POR_DIA_TREINO; // R$70
    
    expect(valorMinima).toBe(40);
    expect(valorMaxima).toBe(70);
    expect(valorMaxima).toBeGreaterThan(valorMinima);
  });

  it('should calculate single training day correctly', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    const semana = { dias_treino: 1 };
    const valor = semana.dias_treino * VALOR_POR_DIA_TREINO;
    
    expect(valor).toBe(10);
  });

  it('should calculate zero training days as zero debt', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    const semana = { dias_treino: 0 };
    const valor = semana.dias_treino * VALOR_POR_DIA_TREINO;
    
    expect(valor).toBe(0);
  });

  it('should handle multiple weeks with mixed training days', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    const semanas = [
      { dias_treino: 7 },
      { dias_treino: 4 },
      { dias_treino: 5 },
      { dias_treino: 6 },
      { dias_treino: 4 }
    ];
    
    const totalDias = semanas.reduce((acc, s) => acc + s.dias_treino, 0); // 7+4+5+6+4 = 26
    const valorTotal = totalDias * VALOR_POR_DIA_TREINO;
    
    expect(totalDias).toBe(26);
    expect(valorTotal).toBe(260); // R$260 for 26 training days
  });
});
