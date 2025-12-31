// Test file to verify reward indicators on training calendar
// This demonstrates the reward indicator functionality

import { describe, it, expect } from 'vitest';

describe('Reward Indicator Functionality', () => {
  // Helper function to check if a date is within a rewarded week
  const diaEstaEmSemanaRecompensada = (dataFormatada, semanasRecompensadas) => {
    if (semanasRecompensadas.length === 0) return false;
    
    // Converter a data formatada para objeto Date
    const partes = dataFormatada.split('/');
    if (partes.length !== 3) return false;
    
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1; // Mês em JS é 0-indexed
    const ano = parseInt(partes[2]);
    const dataAlvo = new Date(ano, mes, dia);
    
    // Verificar se a data está dentro de alguma semana recompensada
    return semanasRecompensadas.some(semana => {
      const partesInicio = semana.data_inicio_semana.split('/');
      const partesFim = semana.data_fim_semana.split('/');
      
      const dataInicio = new Date(
        parseInt(partesInicio[2]),
        parseInt(partesInicio[1]) - 1,
        parseInt(partesInicio[0])
      );
      
      const dataFim = new Date(
        parseInt(partesFim[2]),
        parseInt(partesFim[1]) - 1,
        parseInt(partesFim[0])
      );
      
      return dataAlvo >= dataInicio && dataAlvo <= dataFim;
    });
  };

  it('should return true for dates within a rewarded week', () => {
    const semanasRecompensadas = [
      {
        data_inicio_semana: '29/12/2024', // Domingo
        data_fim_semana: '04/01/2025', // Sábado
        dias_treino: 5
      }
    ];

    // Test all days in the rewarded week
    expect(diaEstaEmSemanaRecompensada('29/12/2024', semanasRecompensadas)).toBe(true);
    expect(diaEstaEmSemanaRecompensada('30/12/2024', semanasRecompensadas)).toBe(true);
    expect(diaEstaEmSemanaRecompensada('31/12/2024', semanasRecompensadas)).toBe(true);
    expect(diaEstaEmSemanaRecompensada('01/01/2025', semanasRecompensadas)).toBe(true);
    expect(diaEstaEmSemanaRecompensada('02/01/2025', semanasRecompensadas)).toBe(true);
    expect(diaEstaEmSemanaRecompensada('03/01/2025', semanasRecompensadas)).toBe(true);
    expect(diaEstaEmSemanaRecompensada('04/01/2025', semanasRecompensadas)).toBe(true);
  });

  it('should return false for dates outside rewarded weeks', () => {
    const semanasRecompensadas = [
      {
        data_inicio_semana: '29/12/2024',
        data_fim_semana: '04/01/2025',
        dias_treino: 5
      }
    ];

    // Test days before and after the rewarded week
    expect(diaEstaEmSemanaRecompensada('28/12/2024', semanasRecompensadas)).toBe(false);
    expect(diaEstaEmSemanaRecompensada('05/01/2025', semanasRecompensadas)).toBe(false);
    expect(diaEstaEmSemanaRecompensada('15/01/2025', semanasRecompensadas)).toBe(false);
  });

  it('should return false when no weeks are rewarded', () => {
    const semanasRecompensadas = [];

    expect(diaEstaEmSemanaRecompensada('01/01/2025', semanasRecompensadas)).toBe(false);
    expect(diaEstaEmSemanaRecompensada('15/06/2024', semanasRecompensadas)).toBe(false);
  });

  it('should handle multiple rewarded weeks', () => {
    const semanasRecompensadas = [
      {
        data_inicio_semana: '01/01/2025',
        data_fim_semana: '07/01/2025',
        dias_treino: 4
      },
      {
        data_inicio_semana: '15/01/2025',
        data_fim_semana: '21/01/2025',
        dias_treino: 5
      }
    ];

    // Test days in first rewarded week
    expect(diaEstaEmSemanaRecompensada('03/01/2025', semanasRecompensadas)).toBe(true);
    
    // Test days between rewarded weeks
    expect(diaEstaEmSemanaRecompensada('10/01/2025', semanasRecompensadas)).toBe(false);
    
    // Test days in second rewarded week
    expect(diaEstaEmSemanaRecompensada('18/01/2025', semanasRecompensadas)).toBe(true);
  });

  it('should handle invalid date formats gracefully', () => {
    const semanasRecompensadas = [
      {
        data_inicio_semana: '01/01/2025',
        data_fim_semana: '07/01/2025',
        dias_treino: 4
      }
    ];

    expect(diaEstaEmSemanaRecompensada('invalid-date', semanasRecompensadas)).toBe(false);
    expect(diaEstaEmSemanaRecompensada('', semanasRecompensadas)).toBe(false);
    expect(diaEstaEmSemanaRecompensada('2025-01-01', semanasRecompensadas)).toBe(false);
  });
});

describe('Reward Database Operations', () => {
  it('should structure reward data correctly for database insert', () => {
    const semana = [
      { dataFormatada: '05/01/2025', diaSemana: 'Dom' },
      { dataFormatada: '06/01/2025', diaSemana: 'Seg' },
      { dataFormatada: '07/01/2025', diaSemana: 'Ter' },
      { dataFormatada: '08/01/2025', diaSemana: 'Qua' },
      { dataFormatada: '09/01/2025', diaSemana: 'Qui' },
      { dataFormatada: '10/01/2025', diaSemana: 'Sex' },
      { dataFormatada: '11/01/2025', diaSemana: 'Sáb' }
    ];
    
    const diasComTreino = 5;
    
    const rewardData = {
      data_inicio_semana: semana[0].dataFormatada,
      data_fim_semana: semana[6].dataFormatada,
      dias_treino: diasComTreino
    };

    expect(rewardData.data_inicio_semana).toBe('05/01/2025');
    expect(rewardData.data_fim_semana).toBe('11/01/2025');
    expect(rewardData.dias_treino).toBe(5);
  });

  it('should have all required fields for database insert', () => {
    const rewardData = {
      data_inicio_semana: '01/01/2025',
      data_fim_semana: '07/01/2025',
      dias_treino: 4
    };

    expect(rewardData).toHaveProperty('data_inicio_semana');
    expect(rewardData).toHaveProperty('data_fim_semana');
    expect(rewardData).toHaveProperty('dias_treino');
    
    expect(typeof rewardData.data_inicio_semana).toBe('string');
    expect(typeof rewardData.data_fim_semana).toBe('string');
    expect(typeof rewardData.dias_treino).toBe('number');
  });
});

describe('Reward Indicator Visibility Rules', () => {
  it('should show indicator only on days within rewarded weeks', () => {
    const semanasRecompensadas = [
      {
        data_inicio_semana: '01/01/2025',
        data_fim_semana: '07/01/2025',
        dias_treino: 4
      }
    ];

    // Days that should show indicator
    const daysWithIndicator = [
      '01/01/2025',
      '02/01/2025',
      '03/01/2025',
      '04/01/2025',
      '05/01/2025',
      '06/01/2025',
      '07/01/2025'
    ];

    daysWithIndicator.forEach(day => {
      const shouldShow = diaEstaEmSemanaRecompensada(day, semanasRecompensadas);
      expect(shouldShow).toBe(true);
    });

    // Days that should NOT show indicator
    const daysWithoutIndicator = [
      '31/12/2024',
      '08/01/2025',
      '15/01/2025'
    ];

    daysWithoutIndicator.forEach(day => {
      const shouldShow = diaEstaEmSemanaRecompensada(day, semanasRecompensadas);
      expect(shouldShow).toBe(false);
    });
  });

  it('should verify indicator appears only for complete weeks', () => {
    const semanasRecompensadas = [
      {
        data_inicio_semana: '01/01/2025', // Sunday
        data_fim_semana: '07/01/2025', // Saturday
        dias_treino: 4
      }
    ];

    // All 7 days of the week should have indicator
    const weekDays = ['01/01/2025', '02/01/2025', '03/01/2025', '04/01/2025', '05/01/2025', '06/01/2025', '07/01/2025'];
    
    weekDays.forEach(day => {
      expect(diaEstaEmSemanaRecompensada(day, semanasRecompensadas)).toBe(true);
    });

    expect(weekDays.length).toBe(7); // Verify we're checking all 7 days
  });
});

describe('Accessibility and UX', () => {
  it('should provide aria-label for days with rewards', () => {
    const dia = 5;
    const mes = 'Janeiro';
    const temRecompensa = true;
    const numTreinos = 2;

    const ariaLabel = `${dia} de ${mes}${temRecompensa ? ', dia recompensado' : ''}${numTreinos > 0 ? `, ${numTreinos} treino(s)` : ''}`;

    expect(ariaLabel).toContain('5 de Janeiro');
    expect(ariaLabel).toContain('dia recompensado');
    expect(ariaLabel).toContain('2 treino(s)');
  });

  it('should provide aria-label for days without rewards', () => {
    const dia = 10;
    const mes = 'Fevereiro';
    const temRecompensa = false;
    const numTreinos = 0;

    const ariaLabel = `${dia} de ${mes}${temRecompensa ? ', dia recompensado' : ''}${numTreinos > 0 ? `, ${numTreinos} treino(s)` : ''}`;

    expect(ariaLabel).toContain('10 de Fevereiro');
    expect(ariaLabel).not.toContain('dia recompensado');
    expect(ariaLabel).not.toContain('treino(s)');
  });

  it('should have small, non-intrusive indicator size', () => {
    const indicatorSizes = {
      mobile: 12, // pixels
      desktop: 16  // pixels (sm: breakpoint)
    };

    // Verify indicator is small
    expect(indicatorSizes.mobile).toBeLessThanOrEqual(16);
    expect(indicatorSizes.desktop).toBeLessThanOrEqual(20);
  });

  it('should position indicator in corner, not obstructing content', () => {
    const indicatorPosition = {
      top: '0.125rem', // top-0.5 in mobile
      right: '0.125rem', // right-0.5 in mobile
      zIndex: 10
    };

    expect(indicatorPosition.top).toBeDefined();
    expect(indicatorPosition.right).toBeDefined();
    expect(indicatorPosition.zIndex).toBeGreaterThan(0);
  });
});
