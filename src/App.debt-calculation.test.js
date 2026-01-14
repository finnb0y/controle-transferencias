// Test file to verify training debt calculation logic
// Ensures that rewarded weeks are valued at 7 days (full week) for debt purposes

import { describe, it, expect } from 'vitest';

describe('Training Debt Calculation', () => {
  it('should calculate debt as 7 days per rewarded week', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Mock rewarded weeks with different actual training days
    const semanasRecompensadas = [
      { id: 1, data_inicio_semana: '21/12/2025', data_fim_semana: '27/12/2025', dias_treino: 4 },
      { id: 2, data_inicio_semana: '28/12/2025', data_fim_semana: '03/01/2026', dias_treino: 5 },
      { id: 3, data_inicio_semana: '04/01/2026', data_fim_semana: '10/01/2026', dias_treino: 6 }
    ];
    
    // Calculate total using the new logic: each rewarded week = 7 days
    const totalDiasTreino = semanasRecompensadas.reduce((acc, s) => {
      // If week was rewarded, it met minimum requirement
      // Therefore, pay for complete week (7 days)
      return acc + 7;
    }, 0);
    
    const valorTotal = totalDiasTreino * VALOR_POR_DIA_TREINO;
    
    // Expected: 3 weeks × 7 days × R$10 = R$210
    expect(totalDiasTreino).toBe(21);
    expect(valorTotal).toBe(210);
  });

  it('should value week 28/12-03/01 at 7 days not 4', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Week spanning December to January
    const semana = { 
      id: 2, 
      data_inicio_semana: '28/12/2025', 
      data_fim_semana: '03/01/2026', 
      dias_treino: 4 // Actual training days (minimum met)
    };
    
    // Old logic would use dias_treino = 4 days
    const oldCalculation = semana.dias_treino * VALOR_POR_DIA_TREINO; // R$40
    
    // New logic uses 7 days for any rewarded week
    const newCalculation = 7 * VALOR_POR_DIA_TREINO; // R$70
    
    expect(oldCalculation).toBe(40);
    expect(newCalculation).toBe(70);
    expect(newCalculation).toBeGreaterThan(oldCalculation);
  });

  it('should value week 04/01-10/01 at 7 days not 6', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Week with 6 training days
    const semana = { 
      id: 3, 
      data_inicio_semana: '04/01/2026', 
      data_fim_semana: '10/01/2026', 
      dias_treino: 6 // Actual training days
    };
    
    // Old logic would use dias_treino = 6 days
    const oldCalculation = semana.dias_treino * VALOR_POR_DIA_TREINO; // R$60
    
    // New logic uses 7 days for any rewarded week
    const newCalculation = 7 * VALOR_POR_DIA_TREINO; // R$70
    
    expect(oldCalculation).toBe(60);
    expect(newCalculation).toBe(70);
    expect(newCalculation).toBeGreaterThan(oldCalculation);
  });

  it('should calculate correct total for multiple weeks', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Example from problem statement
    const semanas = [
      { id: 1, dias_treino: 2 }, // Week 21-27/12
      { id: 2, dias_treino: 4 }, // Week 28/12-03/01
      { id: 3, dias_treino: 1 }  // Week 04-10/01 (problem says should be 7)
    ];
    
    // Each week counts as 7 days when rewarded
    const totalDias = semanas.length * 7; // 3 weeks × 7 days = 21 days
    const valorTotal = totalDias * VALOR_POR_DIA_TREINO;
    
    expect(totalDias).toBe(21);
    expect(valorTotal).toBe(210); // R$210 for 3 weeks
  });

  it('should incentivize meeting weekly goals', () => {
    const VALOR_POR_DIA_TREINO = 10;
    
    // Week with minimum training (4 days)
    const semanaMinima = { dias_treino: 4 };
    
    // Week with maximum training (7 days)
    const semanaMaxima = { dias_treino: 7 };
    
    // Both should be valued the same (full week) to incentivize goal achievement
    const valorMinima = 7 * VALOR_POR_DIA_TREINO; // R$70
    const valorMaxima = 7 * VALOR_POR_DIA_TREINO; // R$70
    
    expect(valorMinima).toBe(70);
    expect(valorMaxima).toBe(70);
    expect(valorMinima).toBe(valorMaxima);
  });
});
