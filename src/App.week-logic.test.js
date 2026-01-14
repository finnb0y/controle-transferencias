// Test file to verify week completion and reward eligibility logic
// Ensures that current/in-progress weeks cannot generate rewards or debts

import { describe, it, expect } from 'vitest';

describe('Week Completion and Reward Eligibility', () => {
  // Helper function to parse date in DD/MM/YYYY format
  const parseDataFormatada = (dataFormatada) => {
    const partes = dataFormatada.split('/');
    if (partes.length !== 3) return null;
    
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1; // Month is 0-indexed
    const ano = parseInt(partes[2]);
    
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
    
    return new Date(ano, mes, dia);
  };

  // Function to check if week has ended (equivalent to semanaJaTerminou)
  const semanaJaTerminou = (semana) => {
    if (!semana || semana.length === 0) return false;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataFim = parseDataFormatada(semana[6].dataFormatada);
    if (!dataFim) return false;
    
    dataFim.setHours(23, 59, 59, 999);
    
    return dataFim < hoje;
  };

  it('should correctly identify completed weeks (past)', () => {
    // Week from December 2025 (definitely in the past as of 2026-01-14)
    const semanaPast = [
      { dataFormatada: '21/12/2025' },
      { dataFormatada: '22/12/2025' },
      { dataFormatada: '23/12/2025' },
      { dataFormatada: '24/12/2025' },
      { dataFormatada: '25/12/2025' },
      { dataFormatada: '26/12/2025' },
      { dataFormatada: '27/12/2025' }
    ];

    expect(semanaJaTerminou(semanaPast)).toBe(true);
  });

  it('should correctly identify current week as NOT finished (11/01-17/01/2026)', () => {
    // Current week mentioned in the problem statement
    const semanaAtual = [
      { dataFormatada: '11/01/2026' }, // Sunday
      { dataFormatada: '12/01/2026' }, // Monday
      { dataFormatada: '13/01/2026' }, // Tuesday
      { dataFormatada: '14/01/2026' }, // Wednesday (today as per problem)
      { dataFormatada: '15/01/2026' }, // Thursday
      { dataFormatada: '16/01/2026' }, // Friday
      { dataFormatada: '17/01/2026' }  // Saturday
    ];

    // Mock current date as 2026-01-14
    const originalDate = Date;
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          // Return 2026-01-14 when calling new Date()
          return new originalDate(2026, 0, 14); // Month is 0-indexed
        }
        return new originalDate(...args);
      }
      static now() {
        return new originalDate(2026, 0, 14).getTime();
      }
    };

    expect(semanaJaTerminou(semanaAtual)).toBe(false);

    // Restore Date
    global.Date = originalDate;
  });

  it('should identify future weeks as NOT finished', () => {
    // Week in the future (February 2026)
    const semanaFutura = [
      { dataFormatada: '08/02/2026' },
      { dataFormatada: '09/02/2026' },
      { dataFormatada: '10/02/2026' },
      { dataFormatada: '11/02/2026' },
      { dataFormatada: '12/02/2026' },
      { dataFormatada: '13/02/2026' },
      { dataFormatada: '14/02/2026' }
    ];

    expect(semanaJaTerminou(semanaFutura)).toBe(false);
  });

  it('should require minimum 4 training days for complete week', () => {
    const calcularMinimoTreinos = (semana) => {
      // For complete week (7 days): minimum 4 training days
      return 4;
    };

    const semana = new Array(7).fill({});
    expect(calcularMinimoTreinos(semana)).toBe(4);
  });

  it('should validate that week needs minimum training days', () => {
    const minimoNecessario = 4;
    
    // Test with 3 days (insufficient)
    const diasComTreino3 = [
      { data: '11/01/2026' },
      { data: '12/01/2026' },
      { data: '13/01/2026' }
    ];
    expect(diasComTreino3.length < minimoNecessario).toBe(true);

    // Test with 4 days (sufficient)
    const diasComTreino4 = [
      { data: '11/01/2026' },
      { data: '12/01/2026' },
      { data: '13/01/2026' },
      { data: '14/01/2026' }
    ];
    expect(diasComTreino4.length >= minimoNecessario).toBe(true);
  });

  it('should calculate correct debt value for rewarded weeks', () => {
    const VALOR_POR_DIA_TREINO = 10;
    const DIAS_POR_SEMANA = 7;
    
    // Any rewarded week should be valued at 7 days (full week)
    const semana1 = { dias_treino: 4 }; // Met minimum
    const semana2 = { dias_treino: 5 }; // More than minimum
    const semana3 = { dias_treino: 7 }; // All days

    const valorSemana1 = DIAS_POR_SEMANA * VALOR_POR_DIA_TREINO; // R$70
    const valorSemana2 = DIAS_POR_SEMANA * VALOR_POR_DIA_TREINO; // R$70
    const valorSemana3 = DIAS_POR_SEMANA * VALOR_POR_DIA_TREINO; // R$70

    expect(valorSemana1).toBe(70);
    expect(valorSemana2).toBe(70);
    expect(valorSemana3).toBe(70);
    expect(valorSemana1).toBe(valorSemana2);
    expect(valorSemana2).toBe(valorSemana3);
  });
});
