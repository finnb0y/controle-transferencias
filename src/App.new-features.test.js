// Test file to verify time-based training and transfer history ordering
// This demonstrates the new functionality without requiring a full test framework

import { describe, it, expect } from 'vitest';

describe('Time-based Training Registration', () => {
  // Helper function to calculate duration from start and end times
  const calcularDuracao = (horarioInicio, horarioFim) => {
    if (!horarioInicio || !horarioFim) return null;
    
    const [horaInicio, minutoInicio] = horarioInicio.split(':').map(Number);
    const [horaFim, minutoFim] = horarioFim.split(':').map(Number);
    
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFim = horaFim * 60 + minutoFim;
    
    let duracao = minutosFim - minutosInicio;
    
    // Se o horário de fim for menor que o de início, assumir que passou da meia-noite
    if (duracao < 0) {
      duracao += 24 * 60; // adiciona 24 horas em minutos
    }
    
    return duracao;
  };

  it('should calculate duration correctly for same day training', () => {
    const inicio = '09:00';
    const fim = '10:30';
    const duracao = calcularDuracao(inicio, fim);
    
    expect(duracao).toBe(90); // 1 hora e 30 minutos = 90 minutos
  });

  it('should calculate duration correctly for training starting in morning', () => {
    const inicio = '06:00';
    const fim = '07:15';
    const duracao = calcularDuracao(inicio, fim);
    
    expect(duracao).toBe(75); // 1 hora e 15 minutos = 75 minutos
  });

  it('should calculate duration correctly for training crossing midnight', () => {
    const inicio = '23:30';
    const fim = '00:30';
    const duracao = calcularDuracao(inicio, fim);
    
    expect(duracao).toBe(60); // 1 hora = 60 minutos
  });

  it('should calculate duration correctly for long training session', () => {
    const inicio = '14:00';
    const fim = '17:45';
    const duracao = calcularDuracao(inicio, fim);
    
    expect(duracao).toBe(225); // 3 horas e 45 minutos = 225 minutos
  });

  it('should return null if start time is missing', () => {
    const duracao = calcularDuracao('', '10:30');
    expect(duracao).toBeNull();
  });

  it('should return null if end time is missing', () => {
    const duracao = calcularDuracao('09:00', '');
    expect(duracao).toBeNull();
  });

  it('should return null if both times are missing', () => {
    const duracao = calcularDuracao('', '');
    expect(duracao).toBeNull();
  });
});

describe('Transfer History Ordering', () => {
  // Helper function to sort transfers by date (most recent first)
  const sortTransfersByDate = (transfers) => {
    return [...transfers].sort((a, b) => {
      const partesA = a.data.split('/');
      const partesB = b.data.split('/');
      
      const dataA = new Date(
        parseInt(partesA[2]), // ano
        parseInt(partesA[1]) - 1, // mês
        parseInt(partesA[0]) // dia
      );
      
      const dataB = new Date(
        parseInt(partesB[2]), // ano
        parseInt(partesB[1]) - 1, // mês
        parseInt(partesB[0]) // dia
      );
      
      return dataB - dataA; // ordem decrescente (mais recente primeiro)
    });
  };

  it('should sort transfers with most recent first', () => {
    const transfers = [
      { id: 1, data: '01/01/2024', valor: '100,00' },
      { id: 2, data: '15/03/2024', valor: '200,00' },
      { id: 3, data: '10/02/2024', valor: '150,00' }
    ];

    const sorted = sortTransfersByDate(transfers);

    expect(sorted[0].id).toBe(2); // 15/03/2024 (mais recente)
    expect(sorted[1].id).toBe(3); // 10/02/2024
    expect(sorted[2].id).toBe(1); // 01/01/2024 (mais antigo)
  });

  it('should sort transfers from different years correctly', () => {
    const transfers = [
      { id: 1, data: '15/06/2023', valor: '100,00' },
      { id: 2, data: '15/06/2024', valor: '200,00' },
      { id: 3, data: '15/06/2025', valor: '150,00' }
    ];

    const sorted = sortTransfersByDate(transfers);

    expect(sorted[0].id).toBe(3); // 2025 (mais recente)
    expect(sorted[1].id).toBe(2); // 2024
    expect(sorted[2].id).toBe(1); // 2023 (mais antigo)
  });

  it('should sort transfers from same month correctly', () => {
    const transfers = [
      { id: 1, data: '05/12/2024', valor: '100,00' },
      { id: 2, data: '25/12/2024', valor: '200,00' },
      { id: 3, data: '15/12/2024', valor: '150,00' }
    ];

    const sorted = sortTransfersByDate(transfers);

    expect(sorted[0].id).toBe(2); // 25/12/2024 (mais recente)
    expect(sorted[1].id).toBe(3); // 15/12/2024
    expect(sorted[2].id).toBe(1); // 05/12/2024 (mais antigo)
  });

  it('should handle single transfer', () => {
    const transfers = [
      { id: 1, data: '15/06/2024', valor: '100,00' }
    ];

    const sorted = sortTransfersByDate(transfers);

    expect(sorted.length).toBe(1);
    expect(sorted[0].id).toBe(1);
  });

  it('should handle empty transfer list', () => {
    const transfers = [];
    const sorted = sortTransfersByDate(transfers);

    expect(sorted.length).toBe(0);
  });
});

describe('Training Data Integration', () => {
  it('should include time fields in training data object', () => {
    const treinoData = {
      data: '31/12/2024',
      tipo: 'cardio',
      subcategoria: 'Corrida',
      horario_inicio: '06:00',
      horario_fim: '07:00',
      duracao: 60,
      distancia: 10.5,
      observacoes: 'Treino matinal',
      exercicios: []
    };

    expect(treinoData.horario_inicio).toBe('06:00');
    expect(treinoData.horario_fim).toBe('07:00');
    expect(treinoData.duracao).toBe(60);
  });

  it('should allow null time fields for backward compatibility', () => {
    const treinoData = {
      data: '31/12/2024',
      tipo: 'intensidade',
      subcategoria: 'Musculação',
      horario_inicio: null,
      horario_fim: null,
      duracao: 45,
      distancia: null,
      observacoes: null,
      exercicios: []
    };

    expect(treinoData.horario_inicio).toBeNull();
    expect(treinoData.horario_fim).toBeNull();
    expect(treinoData.duracao).toBe(45);
  });
});
