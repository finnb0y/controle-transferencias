import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, X, Download, Filter, PieChart, TrendingUp, Home, Plus, Eye, Dumbbell, Check, Edit2, Save, ChevronDown } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { supabase } from './supabaseClient';

const CONFIRMATION_TIMEOUT = 4000; // 4 seconds

const ControleTransferencias = () => {
  const [tela, setTela] = useState('inicial');
  const [transferencias, setTransferencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarAnos, setMostrarAnos] = useState(false);
  const [mesesSelecionados, setMesesSelecionados] = useState([]);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
  
  // Estados para Treino
  const [treinos, setTreinos] = useState([]);
  const [calendarioTreino, setCalendarioTreino] = useState({
    mes: new Date().getMonth(),
    ano: new Date().getFullYear()
  });
  const [dataSelecionadaTreino, setDataSelecionadaTreino] = useState(null);
  const [mostrarFormularioTreino, setMostrarFormularioTreino] = useState(false);
  const [treinoEditando, setTreinoEditando] = useState(null);
  const [formularioTreino, setFormularioTreino] = useState({
    tipo: '',
    subcategoria: '',
    duracao: '',
    distancia: '',
    observacoes: ''
  });
  
  // Estados para exercícios múltiplos (funcional training)
  const [exercicios, setExercicios] = useState([]);
  const [exercicioAtual, setExercicioAtual] = useState({
    nome: '',
    repeticoes: '',
    duracao: ''
  });
  
  // Estados para barra de confirmação
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [mensagemConfirmacao, setMensagemConfirmacao] = useState('');
  const [tipoConfirmacao, setTipoConfirmacao] = useState('success'); // 'success', 'error', 'warning', 'info'
  const [timerConfirmacao, setTimerConfirmacao] = useState(null);
  
  // Estados para modal de confirmação
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mensagemModalConfirmacao, setMensagemModalConfirmacao] = useState('');
  const [callbackConfirmacao, setCallbackConfirmacao] = useState(null);
  
  // Estado para dropdown de Transferências
  const [mostrarDropdownTransferencias, setMostrarDropdownTransferencias] = useState(false);

  const [formulario, setFormulario] = useState({
    valor: '',
    data: '',
    tipo: 'especie',
    descricao: ''
  });

  const [calendario, setCalendario] = useState({
    mes: new Date().getMonth(),
    ano: new Date().getFullYear(),
    diaSelecionado: null
  });

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const CORES = {
    especie: '#f59e0b',
    digital: '#3b82f6'
  };
  
  // Tipos de treino e subcategorias
  const TIPOS_TREINO = {
    cardio: {
      nome: 'Cardio',
      cor: '#ef4444', // vermelho
      subcategorias: ['Caminhada', 'Corrida', 'Natação', 'Ciclismo', 'Elíptico']
    },
    intensidade: {
      nome: 'Intensidade',
      cor: '#8b5cf6', // roxo
      subcategorias: ['Musculação', 'CrossFit', 'HIIT', 'Funcional', 'Calistenia']
    }
  };

  useEffect(() => {
    carregarDados();
    carregarTreinos();
    
    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (mostrarDropdownTransferencias && !event.target.closest('.dropdown-transferencias')) {
        setMostrarDropdownTransferencias(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function to clear timer on unmount
    return () => {
      if (timerConfirmacao) {
        clearTimeout(timerConfirmacao);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarDropdownTransferencias, timerConfirmacao]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('transferencias')
        .select('*')
        .order('data_registro', { ascending: false });

      if (error) throw error;

      const dadosFormatados = data.map(t => ({
        id: t.id,
        valor: t.valor,
        data: t.data,
        tipo: t.tipo,
        descricao: t.descricao,
        dataRegistro: new Date(t.data_registro).toLocaleString('pt-BR')
      }));

      setTransferencias(dadosFormatados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      mostrarBarraConfirmacao('Erro ao carregar transferências. Verifique sua conexão.', 'error');
    } finally {
      setCarregando(false);
    }
  };
  
  const carregarTreinos = async () => {
    try {
      const { data, error } = await supabase
        .from('treinos')
        .select('id, data, tipo, subcategoria, duracao, distancia, observacoes, exercicios, created_at')
        .order('data', { ascending: false });

      if (error) {
        // Se a tabela não existe, silenciosamente retorna array vazio
        console.log('Tabela treinos não encontrada ou erro:', error);
        setTreinos([]);
        return;
      }

      setTreinos(data || []);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      setTreinos([]);
    }
  };

  const getDiasNoMes = (mes, ano) => {
    return new Date(ano, mes + 1, 0).getDate();
  };

  const getPrimeiroDiaSemana = (mes, ano) => {
    return new Date(ano, mes, 1).getDay();
  };

  const formatarData = (dia, mes, ano) => {
    return `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
  };

  const formatarValor = (valor) => {
    const numero = valor.replace(/\D/g, '');
    const valorFloat = parseFloat(numero) / 100;
    return valorFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleValorChange = (e) => {
    const valor = e.target.value;
    setFormulario({ ...formulario, valor: formatarValor(valor) });
  };

  const mudarMes = (direcao) => {
    let novoMes = calendario.mes + direcao;
    let novoAno = calendario.ano;

    if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    } else if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    }

    setCalendario({ ...calendario, mes: novoMes, ano: novoAno });
  };

  const selecionarDia = (dia) => {
    const dataFormatada = formatarData(dia, calendario.mes, calendario.ano);
    setFormulario({ ...formulario, data: dataFormatada });
    setCalendario({ ...calendario, diaSelecionado: dia });
    setMostrarCalendario(false);
  };

  const selecionarAno = (ano) => {
    setCalendario({ ...calendario, ano });
    setMostrarAnos(false);
  };

  const toggleMes = (mesIndex) => {
    if (mesesSelecionados.includes(mesIndex)) {
      setMesesSelecionados(mesesSelecionados.filter(m => m !== mesIndex));
    } else {
      setMesesSelecionados([...mesesSelecionados, mesIndex].sort((a, b) => a - b));
    }
  };

  const limparSelecaoMeses = () => {
    setMesesSelecionados([]);
  };

  const verificarMesesConectados = (mesIndex) => {
    if (mesesSelecionados.length < 2) return false;
    const sorted = [...mesesSelecionados].sort((a, b) => a - b);
    const idx = sorted.indexOf(mesIndex);
    if (idx === -1) return false;
    return idx < sorted.length - 1 && sorted[idx + 1] === mesIndex + 1;
  };

  const adicionarTransferencia = async () => {
    if (!formulario.valor || !formulario.data) {
      mostrarBarraConfirmacao('Por favor, preencha o valor e a data!', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transferencias')
        .insert([
          {
            valor: formulario.valor,
            data: formulario.data,
            tipo: formulario.tipo,
            descricao: formulario.descricao || null
          }
        ])
        .select();

      if (error) throw error;

      mostrarBarraConfirmacao('Transferência adicionada com sucesso!', 'success');

      setFormulario({
        valor: '',
        data: '',
        tipo: 'especie',
        descricao: ''
      });

      setCalendario({
        ...calendario,
        diaSelecionado: null
      });

      await carregarDados();
    } catch (error) {
      console.error('Erro ao adicionar transferência:', error);
      mostrarBarraConfirmacao('Erro ao adicionar transferência. Tente novamente.', 'error');
    }
  };

  const excluirTransferencia = async (id) => {
    const confirmado = await mostrarModalConfirmacaoFn('Tem certeza que deseja excluir esta transferência?');
    if (!confirmado) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transferencias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir transferência:', error);
      mostrarBarraConfirmacao('Erro ao excluir transferência. Tente novamente.', 'error');
    }
  };

  const renderizarCalendario = () => {
    const diasNoMes = getDiasNoMes(calendario.mes, calendario.ano);
    const primeiroDia = getPrimeiroDiaSemana(calendario.mes, calendario.ano);
    const dias = [];

    for (let i = 0; i < primeiroDia; i++) {
      dias.push(<div key={`vazio-${i}`} className="h-10"></div>);
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const isHoje = dia === new Date().getDate() &&
        calendario.mes === new Date().getMonth() &&
        calendario.ano === new Date().getFullYear();
      const isSelecionado = dia === calendario.diaSelecionado;

      dias.push(
        <button
          key={dia}
          type="button"
          onClick={() => selecionarDia(dia)}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all
            ${isSelecionado ? 'bg-blue-600 text-white font-bold' : ''}
            ${isHoje && !isSelecionado ? 'border-2 border-blue-600 text-blue-600 font-bold' : ''}
            ${!isSelecionado && !isHoje ? 'hover:bg-gray-100' : ''}
          `}
        >
          {dia}
        </button>
      );
    }

    return dias;
  };

  const gerarListaAnos = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let i = anoAtual - 10; i <= anoAtual + 10; i++) {
      anos.push(i);
    }
    return anos;
  };

  const obterAnosDisponiveis = () => {
    const anos = new Set();
    transferencias.forEach(t => {
      const partes = t.data.split('/');
      if (partes.length === 3) {
        anos.add(parseInt(partes[2]));
      }
    });
    return Array.from(anos).sort((a, b) => b - a);
  };

  const filtrarTransferencias = (incluirMeses = true, ordenarPorData = false) => {
  let resultado = transferencias.filter(t => {
    const partes = t.data.split('/');
    if (partes.length !== 3) return false;
    
    const mesTransferencia = parseInt(partes[1]) - 1;
    const anoTransferencia = parseInt(partes[2]);
    
    if (anoTransferencia !== anoFiltro) return false;
    
    if (incluirMeses && mesesSelecionados.length > 0) {
      return mesesSelecionados.includes(mesTransferencia);
    }
    
    return true;
  });

  // Se ordenarPorData for true, ordena cronologicamente (mais antigo primeiro)
  if (ordenarPorData) {
    resultado.sort((a, b) => {
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
      
      return dataA - dataB; // ordem crescente (mais antigo primeiro)
    });
  }
  
  return resultado;
};

  const calcularTotal = (transferenciasFiltradas) => {
  return transferenciasFiltradas.reduce((total, t) => {
    const valor = parseFloat(t.valor.replace(/\./g, '').replace(',', '.'));
    return total + valor;
  }, 0);
};

const getDadosGraficoRosquinha = () => {
  const transferenciasFiltradas = filtrarTransferencias(true, true);
  const totais = { especie: 0, digital: 0 };

  transferenciasFiltradas.forEach(t => {
    const valor = parseFloat(t.valor.replace(/\./g, '').replace(',', '.'));
    totais[t.tipo] += valor;
  });

  return [
    { name: 'Em Espécie', value: totais.especie, color: CORES.especie },
    { name: 'Digital', value: totais.digital, color: CORES.digital }
  ].filter(item => item.value > 0);
};

const getDadosGraficoLinha = () => {
  const dados = Array(12).fill(0).map((_, index) => ({
    mes: mesesAbrev[index],
    valor: 0
  }));

  transferencias.forEach(t => {
    const partes = t.data.split('/');
    if (partes.length === 3) {
      const mesTransferencia = parseInt(partes[1]) - 1;
      const anoTransferencia = parseInt(partes[2]);
      
      if (anoTransferencia === anoFiltro) {
        const valor = parseFloat(t.valor.replace(/\./g, '').replace(',', '.'));
        dados[mesTransferencia].valor += valor;
      }
    }
  });

  return dados;
};
  
  const calcularMaximoGrafico = () => {
    const dados = getDadosGraficoLinha();
    const maxValor = Math.max(...dados.map(d => d.valor));

    if (maxValor <= 1000) return 1000;

    const multiplo = Math.ceil(maxValor / 1000) * 1000;
    return multiplo;
  };
  
  // Funções para Treino
  
  // Helper function to convert form values to proper database types
  const converterValoresTreino = (formulario) => {
    // Convert duracao to integer or null, handling NaN cases
    let duracaoValue = null;
    if (formulario.duracao && String(formulario.duracao).trim() !== '') {
      const parsed = parseInt(formulario.duracao, 10);
      duracaoValue = isNaN(parsed) ? null : parsed;
    }
    
    // Convert distancia to float or null, handling NaN cases
    let distanciaValue = null;
    if (formulario.distancia && String(formulario.distancia).trim() !== '') {
      const parsed = parseFloat(formulario.distancia);
      distanciaValue = isNaN(parsed) ? null : parsed;
    }
    
    return {
      duracao: duracaoValue,
      distancia: distanciaValue
    };
  };
  
  const getTreinosNaData = (dia, mes, ano) => {
    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
    return treinos.filter(t => t.data === dataFormatada);
  };
  
  const mudarMesTreino = (direcao) => {
    let novoMes = calendarioTreino.mes + direcao;
    let novoAno = calendarioTreino.ano;

    if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    } else if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    }

    setCalendarioTreino({ mes: novoMes, ano: novoAno });
  };
  
  const selecionarDiaTreino = (dia) => {
    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(calendarioTreino.mes + 1).padStart(2, '0')}/${calendarioTreino.ano}`;
    setDataSelecionadaTreino(dataFormatada);
    setMostrarFormularioTreino(true);
    setFormularioTreino({
      tipo: '',
      subcategoria: '',
      duracao: '',
      distancia: '',
      observacoes: ''
    });
    setExercicios([]);
    setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
    setTreinoEditando(null);
  };
  
  const adicionarTreino = async () => {
    if (!dataSelecionadaTreino || !formularioTreino.tipo || !formularioTreino.subcategoria) {
      mostrarBarraConfirmacao('Por favor, preencha o tipo e subcategoria do treino!', 'warning');
      return;
    }
    
    // Se for funcional e não houver exercícios, alertar
    if (formularioTreino.subcategoria === 'Funcional' && exercicios.length === 0) {
      mostrarBarraConfirmacao('Por favor, adicione pelo menos um exercício para o treino funcional!', 'warning');
      return;
    }

    try {
      // Convert string values to proper types using helper function
      const { duracao, distancia } = converterValoresTreino(formularioTreino);
      
      const treinoData = {
        data: dataSelecionadaTreino,
        tipo: formularioTreino.tipo,
        subcategoria: formularioTreino.subcategoria,
        duracao,
        distancia,
        observacoes: formularioTreino.observacoes || null,
        // Always include exercicios field (empty array if not functional)
        exercicios: formularioTreino.subcategoria === 'Funcional' ? exercicios : []
      };

      const { error } = await supabase
        .from('treinos')
        .insert([treinoData]);

      if (error) throw error;

      mostrarBarraConfirmacao('Treino adicionado com sucesso!');
      await carregarTreinos();
      setMostrarFormularioTreino(false);
      setFormularioTreino({
        tipo: '',
        subcategoria: '',
        duracao: '',
        distancia: '',
        observacoes: ''
      });
      setExercicios([]);
      setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
    } catch (error) {
      console.error('Erro ao adicionar treino:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      mostrarBarraConfirmacao(`Erro ao adicionar treino: ${errorMessage}`, 'error');
    }
  };
  
  const editarTreino = (treino) => {
    setTreinoEditando(treino);
    setDataSelecionadaTreino(treino.data);
    setFormularioTreino({
      tipo: treino.tipo,
      subcategoria: treino.subcategoria,
      duracao: treino.duracao || '',
      distancia: treino.distancia || '',
      observacoes: treino.observacoes || ''
    });
    // Load exercises if available
    if (treino.exercicios && Array.isArray(treino.exercicios)) {
      setExercicios(treino.exercicios);
    } else {
      setExercicios([]);
    }
    setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
    setMostrarFormularioTreino(true);
  };
  
  const salvarEdicaoTreino = async () => {
    if (!treinoEditando) return;
    
    // Se for funcional e não houver exercícios, alertar
    if (formularioTreino.subcategoria === 'Funcional' && exercicios.length === 0) {
      mostrarBarraConfirmacao('Por favor, adicione pelo menos um exercício para o treino funcional!', 'warning');
      return;
    }
    
    try {
      // Convert string values to proper types using helper function
      const { duracao, distancia } = converterValoresTreino(formularioTreino);
      
      const updateData = {
        tipo: formularioTreino.tipo,
        subcategoria: formularioTreino.subcategoria,
        duracao,
        distancia,
        observacoes: formularioTreino.observacoes || null,
        // Always include exercicios field (empty array if not functional)
        exercicios: formularioTreino.subcategoria === 'Funcional' ? exercicios : []
      };
      
      const { error } = await supabase
        .from('treinos')
        .update(updateData)
        .eq('id', treinoEditando.id);

      if (error) throw error;

      mostrarBarraConfirmacao('Treino atualizado com sucesso!');
      await carregarTreinos();
      setMostrarFormularioTreino(false);
      setTreinoEditando(null);
      setFormularioTreino({
        tipo: '',
        subcategoria: '',
        duracao: '',
        distancia: '',
        observacoes: ''
      });
      setExercicios([]);
      setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
    } catch (error) {
      console.error('Erro ao editar treino:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      mostrarBarraConfirmacao(`Erro ao editar treino: ${errorMessage}`, 'error');
    }
  };
  
  const excluirTreino = async (id) => {
    const confirmado = await mostrarModalConfirmacaoFn('Tem certeza que deseja excluir este treino?');
    if (!confirmado) {
      return;
    }

    try {
      const { error } = await supabase
        .from('treinos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await carregarTreinos();
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      mostrarBarraConfirmacao('Erro ao excluir treino. Tente novamente.', 'error');
    }
  };
  
  // Funções para gerenciar exercícios múltiplos
  const adicionarExercicio = () => {
    if (!exercicioAtual.nome || !exercicioAtual.nome.trim()) {
      mostrarBarraConfirmacao('Por favor, preencha o nome do exercício!', 'warning');
      return;
    }
    
    if ((!exercicioAtual.repeticoes || exercicioAtual.repeticoes === '' || parseInt(exercicioAtual.repeticoes) <= 0) && 
        (!exercicioAtual.duracao || exercicioAtual.duracao === '' || parseInt(exercicioAtual.duracao) <= 0)) {
      mostrarBarraConfirmacao('Por favor, preencha as repetições ou a duração do exercício com um valor maior que zero!', 'warning');
      return;
    }
    
    setExercicios([...exercicios, exercicioAtual]);
    setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
  };
  
  const removerExercicio = (index) => {
    setExercicios(exercicios.filter((_, i) => i !== index));
  };
  
  // Handler para mudança de tipo de treino
  const handleMudarTipoTreino = async (novoTipo) => {
    // Avisar se estiver mudando de funcional com exercícios
    if (formularioTreino.subcategoria === 'Funcional' && exercicios.length > 0 && novoTipo !== formularioTreino.tipo) {
      const confirmado = await mostrarModalConfirmacaoFn('Mudar o tipo de treino removerá os exercícios adicionados. Deseja continuar?');
      if (!confirmado) {
        return;
      }
    }
    setFormularioTreino({ ...formularioTreino, tipo: novoTipo, subcategoria: '' });
    setExercicios([]);
    setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
  };
  
  // Função para mostrar barra de confirmação
  const mostrarBarraConfirmacao = (mensagem, tipo = 'success') => {
    // Limpar timer anterior se existir
    if (timerConfirmacao) {
      clearTimeout(timerConfirmacao);
    }
    
    setMensagemConfirmacao(mensagem);
    setTipoConfirmacao(tipo);
    setMostrarConfirmacao(true);
    
    // Auto-fechar após CONFIRMATION_TIMEOUT
    const timer = setTimeout(() => {
      setMostrarConfirmacao(false);
    }, CONFIRMATION_TIMEOUT);
    
    setTimerConfirmacao(timer);
  };
  
  const fecharBarraConfirmacao = () => {
    if (timerConfirmacao) {
      clearTimeout(timerConfirmacao);
    }
    setMostrarConfirmacao(false);
  };
  
  // Função para mostrar modal de confirmação
  const mostrarModalConfirmacaoFn = (mensagem) => {
    return new Promise((resolve) => {
      setMensagemModalConfirmacao(mensagem);
      setCallbackConfirmacao(() => (result) => resolve(result));
      setMostrarModalConfirmacao(true);
    });
  };
  
  const confirmarAcao = () => {
    setMostrarModalConfirmacao(false);
    if (callbackConfirmacao) {
      callbackConfirmacao(true);
    }
  };
  
  const cancelarAcao = () => {
    setMostrarModalConfirmacao(false);
    if (callbackConfirmacao) {
      callbackConfirmacao(false);
    }
  };
  
  // Renderiza componentes de notificação e confirmação
  const renderNotificacoes = () => (
    <>
      {/* Barra de Confirmação */}
      {mostrarConfirmacao && (
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-4 p-4 flex items-center justify-between z-50 animate-slide-up ${
          tipoConfirmacao === 'success' ? 'border-green-500' :
          tipoConfirmacao === 'error' ? 'border-red-500' :
          tipoConfirmacao === 'warning' ? 'border-yellow-500' :
          'border-blue-500'
        }`}>
          <div className="flex-1">
            <p className="text-gray-800 font-semibold">{mensagemConfirmacao}</p>
            <div className={`absolute top-0 left-0 right-0 h-1 animate-shrink-width ${
              tipoConfirmacao === 'success' ? 'bg-green-500' :
              tipoConfirmacao === 'error' ? 'bg-red-500' :
              tipoConfirmacao === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}></div>
          </div>
          <button
            onClick={fecharBarraConfirmacao}
            className="ml-4 text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}
      
      {/* Modal de Confirmação */}
      {mostrarModalConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmação</h3>
            <p className="text-gray-700 mb-6">{mensagemModalConfirmacao}</p>
            <div className="flex gap-3">
              <button
                onClick={confirmarAcao}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={cancelarAcao}
                className="flex-1 border-2 border-gray-300 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const baixarPlanilha = () => {
    const transferenciasFiltradas = filtrarTransferencias();

    if (transferenciasFiltradas.length === 0) {
      mostrarBarraConfirmacao('Não há transferências para exportar no período selecionado!', 'warning');
      return;
    }

    let csv = 'Data,Valor,Tipo,Descrição,Registrado em\n';

    transferenciasFiltradas.forEach(t => {
      const linha = [
        t.data,
        `R$ ${t.valor}`,
        t.tipo === 'especie' ? 'Em Espécie' : 'Transferência Digital',
        t.descricao || '-',
        t.dataRegistro
      ].map(campo => `"${campo}"`).join(',');

      csv += linha + '\n';
    });

    const total = calcularTotal(transferenciasFiltradas);
    csv += `\n"TOTAL","R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"\n`;

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const nomeMeses = mesesSelecionados.length > 0
      ? mesesSelecionados.map(m => meses[m].toLowerCase()).join('-')
      : 'ano-completo';
    link.setAttribute('href', url);
    link.setAttribute('download', `transferencias-${nomeMeses}-${anoFiltro}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  // TELA INICIAL
  if (tela === 'inicial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-4">
              <DollarSign className="text-blue-600" size={56} />
              Hub de Funções
            </h1>
            <p className="text-xl text-gray-600">Escolha uma opção para começar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seção de Transferências com Dropdown */}
            <div className="relative dropdown-transferencias">
              <button
                onClick={() => setMostrarDropdownTransferencias(!mostrarDropdownTransferencias)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && mostrarDropdownTransferencias) {
                    setMostrarDropdownTransferencias(false);
                  }
                }}
                aria-expanded={mostrarDropdownTransferencias}
                aria-haspopup="menu"
                className="w-full bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-blue-100 p-6 rounded-full group-hover:bg-blue-600 transition-colors">
                    <DollarSign className="text-blue-600 group-hover:text-white transition-colors" size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    Transferências
                    <ChevronDown 
                      className={`transition-transform ${mostrarDropdownTransferencias ? 'rotate-180' : ''}`} 
                      size={24} 
                    />
                  </h2>
                  <p className="text-gray-600 text-center">
                    Gerencie suas transferências financeiras
                  </p>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {mostrarDropdownTransferencias && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border-2 border-gray-100">
                  <button
                    onClick={() => {
                      setTela('visualizar');
                      setMostrarDropdownTransferencias(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setTela('visualizar');
                        setMostrarDropdownTransferencias(false);
                      }
                    }}
                    className="w-full p-6 hover:bg-green-50 transition-colors flex items-center gap-4 border-b border-gray-100 group"
                  >
                    <div className="bg-green-100 p-4 rounded-full group-hover:bg-green-600 transition-colors">
                      <Eye className="text-green-600 group-hover:text-white transition-colors" size={32} />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Visualizar Histórico</h3>
                      <p className="text-sm text-gray-600">Veja gráficos, relatórios e exporte planilhas</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setTela('adicionar');
                      setMostrarDropdownTransferencias(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setTela('adicionar');
                        setMostrarDropdownTransferencias(false);
                      }
                    }}
                    className="w-full p-6 hover:bg-blue-50 transition-colors flex items-center gap-4 group"
                  >
                    <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-600 transition-colors">
                      <Plus className="text-blue-600 group-hover:text-white transition-colors" size={32} />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Adicionar Transferências</h3>
                      <p className="text-sm text-gray-600">Registre novas transferências com data, valor e tipo</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
            
            {/* Seção de Treino */}
            <button
              onClick={() => setTela('treino')}
              className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 group"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-purple-100 p-6 rounded-full group-hover:bg-purple-600 transition-colors">
                  <Dumbbell className="text-purple-600 group-hover:text-white transition-colors" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Treino</h2>
                <p className="text-gray-600 text-center">
                  Acompanhe seus treinos com calendário interativo
                </p>
              </div>
            </button>
          </div>
        </div>
        
        {renderNotificacoes()}
      </div>
    );
  }

  // TELA DE ADICIONAR
  if (tela === 'adicionar') {
    const todasTransferencias = filtrarTransferencias(false);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setTela('inicial')}
            className="mb-6 flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow hover:shadow-md transition-all"
          >
            <Home size={20} />
            Voltar para Início
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Plus className="text-blue-600" size={36} />
              Adicionar Transferência
            </h1>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    value={formulario.valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formulario.data}
                      readOnly
                      placeholder="Selecione a data"
                      onClick={() => setMostrarCalendario(!mostrarCalendario)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer text-lg"
                    />
                    <Calendar
                      className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                      size={24}
                    />
                  </div>

                  {mostrarCalendario && (
                    <div className="absolute z-50 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 w-80">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() => mudarMes(-1)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          ←
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMostrarAnos(!mostrarAnos)}
                            className="font-bold text-gray-800 hover:bg-gray-100 px-3 py-1 rounded"
                          >
                            {meses[calendario.mes]} {calendario.ano}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => mudarMes(1)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          →
                        </button>
                      </div>

                      {mostrarAnos && (
                        <div className="absolute top-16 left-0 right-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto z-50">
                          <div className="grid grid-cols-3 gap-2">
                            {gerarListaAnos().map(ano => (
                              <button
                                key={ano}
                                type="button"
                                onClick={() => selecionarAno(ano)}
                                className={`p-2 rounded hover:bg-blue-100 ${ano === calendario.ano ? 'bg-blue-600 text-white font-bold' : ''
                                  }`}
                              >
                                {ano}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {diasSemana.map(dia => (
                          <div key={dia} className="text-center text-xs font-bold text-gray-600 py-1">
                            {dia}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {renderizarCalendario()}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Transferência
                  </label>
                  <select
                    value={formulario.tipo}
                    onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  >
                    <option value="especie">Em Espécie</option>
                    <option value="digital">Transferência Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={formulario.descricao}
                    onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
                    placeholder="Ex: Mesada, Compras..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  />
                </div>
              </div>

              <button
                onClick={adicionarTransferencia}
                className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Adicionar Transferência
              </button>
            </div>
          </div>

          {/* Histórico em tempo real */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Histórico de Transferências</h2>

            {todasTransferencias.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma transferência registrada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Descrição</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Registrado em</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todasTransferencias.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{t.data}</td>
                        <td className="py-3 px-4 font-semibold text-green-600">R$ {t.valor}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${t.tipo === 'especie'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {t.tipo === 'especie' ? 'Em Espécie' : 'Digital'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{t.descricao || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{t.dataRegistro}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => excluirTransferencia(t.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {renderNotificacoes()}
      </div>
    );
  }
  
  // TELA DE TREINO
  if (tela === 'treino') {
    const diasNoMes = getDiasNoMes(calendarioTreino.mes, calendarioTreino.ano);
    const primeiroDia = getPrimeiroDiaSemana(calendarioTreino.mes, calendarioTreino.ano);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setTela('inicial')}
            className="mb-6 flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow hover:shadow-md transition-all"
          >
            <Home size={20} />
            Voltar para Início
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Dumbbell className="text-purple-600" size={28} />
              <span className="hidden sm:inline">Calendário de Treinos</span>
              <span className="sm:hidden">Treinos</span>
            </h1>

            {/* Calendário */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={() => mudarMesTreino(-1)}
                  className="p-2 sm:p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-xl sm:text-2xl">←</span>
                </button>

                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {meses[calendarioTreino.mes]} {calendarioTreino.ano}
                </h2>

                <button
                  onClick={() => mudarMesTreino(1)}
                  className="p-2 sm:p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-xl sm:text-2xl">→</span>
                </button>
              </div>

              {/* Grid do calendário */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {diasSemana.map(dia => (
                  <div key={dia} className="text-center text-xs sm:text-sm font-bold text-gray-600 py-1 sm:py-2">
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Dias vazios antes do início do mês */}
                {Array.from({ length: primeiroDia }).map((_, i) => (
                  <div key={`vazio-${i}`} className="h-16 sm:h-24"></div>
                ))}
                
                {/* Dias do mês */}
                {Array.from({ length: diasNoMes }).map((_, index) => {
                  const dia = index + 1;
                  const treinosDoDia = getTreinosNaData(dia, calendarioTreino.mes, calendarioTreino.ano);
                  const isHoje = dia === new Date().getDate() &&
                    calendarioTreino.mes === new Date().getMonth() &&
                    calendarioTreino.ano === new Date().getFullYear();

                  return (
                    <button
                      key={dia}
                      onClick={() => selecionarDiaTreino(dia)}
                      className={`h-16 sm:h-24 rounded-lg sm:rounded-2xl border-2 transition-all hover:shadow-md flex flex-col items-center justify-start p-1 sm:p-2
                        ${isHoje ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
                        ${treinosDoDia.length > 0 ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-white'}
                      `}
                    >
                      <span className={`text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1 ${isHoje ? 'text-purple-600' : 'text-gray-700'}`}>
                        {dia}
                      </span>
                      
                      {treinosDoDia.length > 0 && (
                        <div className="flex flex-col gap-0.5 sm:gap-1 w-full">
                          {treinosDoDia.slice(0, 2).map((treino, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs"
                              style={{ color: TIPOS_TREINO[treino.tipo]?.cor || '#666' }}
                            >
                              <Check size={10} className="sm:w-3 sm:h-3" />
                              <span className="truncate font-medium">{treino.subcategoria}</span>
                            </div>
                          ))}
                          {treinosDoDia.length > 2 && (
                            <span className="text-[10px] sm:text-xs text-gray-500 font-semibold">
                              +{treinosDoDia.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Legenda */}
            <div className="flex gap-6 justify-center mt-6 p-4 bg-gray-50 rounded-lg">
              {Object.entries(TIPOS_TREINO).map(([key, tipo]) => (
                <div key={key} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tipo.cor }}
                  ></div>
                  <span className="text-sm font-semibold text-gray-700">{tipo.nome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Formulário de Treino como Overlay/Modal */}
          {mostrarFormularioTreino && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {treinoEditando ? 'Editar Treino' : 'Adicionar Treino'}
                  </h2>
                  <button
                    onClick={() => {
                      setMostrarFormularioTreino(false);
                      setTreinoEditando(null);
                      setFormularioTreino({
                        tipo: '',
                        subcategoria: '',
                        duracao: '',
                        distancia: '',
                        observacoes: ''
                      });
                      setExercicios([]);
                      setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-gray-600 mb-6">Data: {dataSelecionadaTreino}</p>

                <div className="space-y-4">
                  {/* Tipo de Treino */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Treino
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(TIPOS_TREINO).map(([key, tipo]) => (
                        <button
                          key={key}
                          onClick={() => handleMudarTipoTreino(key)}
                          className={`p-4 rounded-2xl border-2 transition-all ${
                            formularioTreino.tipo === key
                              ? 'border-current shadow-md'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{
                            color: formularioTreino.tipo === key ? tipo.cor : '#666',
                            backgroundColor: formularioTreino.tipo === key ? `${tipo.cor}10` : 'white'
                          }}
                        >
                          <span className="font-bold text-lg">{tipo.nome}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategoria */}
                  {formularioTreino.tipo && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subcategoria
                      </label>
                      <select
                        value={formularioTreino.subcategoria}
                        onChange={(e) => setFormularioTreino({ ...formularioTreino, subcategoria: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                      >
                        <option value="">Selecione...</option>
                        {TIPOS_TREINO[formularioTreino.tipo].subcategorias.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Seção de Exercícios Múltiplos para Funcional */}
                  {formularioTreino.subcategoria === 'Funcional' && (
                    <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Exercícios</h3>
                      
                      {/* Lista de exercícios adicionados */}
                      {exercicios.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {exercicios.map((ex, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-gray-800">{ex.nome}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                  {ex.repeticoes && `${ex.repeticoes} reps`}
                                  {ex.repeticoes && ex.duracao && ' | '}
                                  {ex.duracao && `${ex.duracao} seg`}
                                </span>
                              </div>
                              <button
                                onClick={() => removerExercicio(index)}
                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Formulário para adicionar novo exercício */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Nome do Exercício
                          </label>
                          <input
                            type="text"
                            value={exercicioAtual.nome}
                            onChange={(e) => setExercicioAtual({ ...exercicioAtual, nome: e.target.value })}
                            placeholder="Ex: Prancha, Abdominais..."
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Repetições
                            </label>
                            <input
                              type="number"
                              value={exercicioAtual.repeticoes}
                              onChange={(e) => setExercicioAtual({ ...exercicioAtual, repeticoes: e.target.value })}
                              placeholder="Ex: 15"
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Duração (segundos)
                            </label>
                            <input
                              type="number"
                              value={exercicioAtual.duracao}
                              onChange={(e) => setExercicioAtual({ ...exercicioAtual, duracao: e.target.value })}
                              placeholder="Ex: 60"
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        
                        <button
                          onClick={adicionarExercicio}
                          className="w-full bg-purple-600 text-white py-2 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Adicionar Exercício
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Duração e Distância - Não mostrar para funcional */}
                  {formularioTreino.subcategoria && formularioTreino.subcategoria !== 'Funcional' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Duração (minutos)
                        </label>
                        <input
                          type="number"
                          value={formularioTreino.duracao}
                          onChange={(e) => setFormularioTreino({ ...formularioTreino, duracao: e.target.value })}
                          placeholder="Ex: 45"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Distância (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formularioTreino.distancia}
                          onChange={(e) => setFormularioTreino({ ...formularioTreino, distancia: e.target.value })}
                          placeholder="Ex: 5.5"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={formularioTreino.observacoes}
                      onChange={(e) => setFormularioTreino({ ...formularioTreino, observacoes: e.target.value })}
                      placeholder="Ex: Treino intenso, boa recuperação..."
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={treinoEditando ? salvarEdicaoTreino : adicionarTreino}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-2xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      {treinoEditando ? 'Salvar Alterações' : 'Adicionar Treino'}
                    </button>
                    <button
                      onClick={() => {
                        setMostrarFormularioTreino(false);
                        setTreinoEditando(null);
                        setFormularioTreino({
                          tipo: '',
                          subcategoria: '',
                          duracao: '',
                          distancia: '',
                          observacoes: ''
                        });
                        setExercicios([]);
                        setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
                      }}
                      className="px-6 py-3 border-2 border-gray-300 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Treinos do Dia Selecionado */}
          {dataSelecionadaTreino && !mostrarFormularioTreino && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Treinos de {dataSelecionadaTreino}
              </h2>
              
              {getTreinosNaData(
                parseInt(dataSelecionadaTreino.split('/')[0]),
                parseInt(dataSelecionadaTreino.split('/')[1]) - 1,
                parseInt(dataSelecionadaTreino.split('/')[2])
              ).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum treino registrado neste dia.</p>
              ) : (
                <div className="space-y-4">
                  {getTreinosNaData(
                    parseInt(dataSelecionadaTreino.split('/')[0]),
                    parseInt(dataSelecionadaTreino.split('/')[1]) - 1,
                    parseInt(dataSelecionadaTreino.split('/')[2])
                  ).map((treino) => (
                    <div
                      key={treino.id}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                      style={{ borderLeftWidth: '6px', borderLeftColor: TIPOS_TREINO[treino.tipo]?.cor }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {treino.subcategoria}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Tipo: <span className="font-semibold">{TIPOS_TREINO[treino.tipo]?.nome}</span>
                          </p>
                          
                          {/* Display exercises for functional training */}
                          {treino.subcategoria === 'Funcional' && treino.exercicios && treino.exercicios.length > 0 && (
                            <div className="mt-3 bg-purple-50 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Exercícios:</p>
                              <ul className="space-y-1">
                                {treino.exercicios.map((ex, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                    <Check size={14} className="text-purple-600" />
                                    <span className="font-medium">{ex.nome}</span>
                                    <span className="text-gray-600">
                                      {ex.repeticoes && `${ex.repeticoes} reps`}
                                      {ex.repeticoes && ex.duracao && ' | '}
                                      {ex.duracao && `${ex.duracao} seg`}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {treino.duracao && (
                            <p className="text-sm text-gray-600">
                              Duração: <span className="font-semibold">{treino.duracao} minutos</span>
                            </p>
                          )}
                          {treino.distancia && (
                            <p className="text-sm text-gray-600">
                              Distância: <span className="font-semibold">{treino.distancia} km</span>
                            </p>
                          )}
                          {treino.observacoes && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-semibold">Obs:</span> {treino.observacoes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editarTreino(treino)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => excluirTreino(treino.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => {
                  setMostrarFormularioTreino(true);
                  setFormularioTreino({
                    tipo: '',
                    subcategoria: '',
                    duracao: '',
                    distancia: '',
                    observacoes: ''
                  });
                  setExercicios([]);
                  setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
                  setTreinoEditando(null);
                }}
                className="w-full mt-6 bg-purple-600 text-white py-3 rounded-2xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Adicionar Mais um Treino
              </button>
            </div>
          )}
          
          {renderNotificacoes()}
        </div>
      </div>
    );
  }

  // TELA DE VISUALIZAÇÃO
  // Caso não seja nenhuma das anteriores, assume-se "visualizar" ou renderiza por padrão
  const transferenciasFiltradas = filtrarTransferencias(true, true);
  const anosDisponiveis = obterAnosDisponiveis();
  const dadosRosquinha = getDadosGraficoRosquinha();
  const dadosLinha = getDadosGraficoLinha();
  const maxGrafico = calcularMaximoGrafico();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setTela('inicial')}
          className="mb-6 flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow hover:shadow-md transition-all"
        >
          <Home size={20} />
          Voltar para Início
        </button>

        {/* Filtros e Download */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Filter size={28} />
              Filtros e Exportação
            </h2>

            <button
              onClick={baixarPlanilha}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Download size={20} />
              Baixar Planilha
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ano
                </label>
                <select
                  value={anoFiltro}
                  onChange={(e) => setAnoFiltro(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {anosDisponiveis.length > 0 ? (
                    anosDisponiveis.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))
                  ) : (
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <div className="w-full bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-gray-600 font-semibold">Total do Período</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {calcularTotal(transferenciasFiltradas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de Meses */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Selecione os meses (pode escolher vários)
                </label>
                {mesesSelecionados.length > 0 && (
                  <button
                    onClick={limparSelecaoMeses}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold"
                  >
                    Limpar Seleção
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {meses.map((mes, index) => {
                  const selecionado = mesesSelecionados.includes(index);
                  const temConexao = verificarMesesConectados(index);

                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => toggleMes(index)}
                        className={`w-full py-2 px-3 rounded-2xl font-semibold text-sm transition-all ${selecionado
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {mes}
                      </button>
                      {temConexao && (
                        <>
                          <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-0.5 bg-blue-300 z-0"></div>
                          <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full z-10"></div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Rosquinha */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PieChart size={24} className="text-blue-600" />
              Tipos de Transferência
            </h3>
            {dadosRosquinha.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={dadosRosquinha}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dadosRosquinha.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  {dadosRosquinha.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-semibold">{item.name}</span>
                      <span className="text-sm text-gray-600">
                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">Nenhum dado disponível para o período selecionado</p>
            )}
          </div>

          {/* Gráfico de Linha */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={24} className="text-blue-600" />
              Transferências por Mês - {anoFiltro}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosLinha}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis
                  domain={[0, maxGrafico]}
                  ticks={[0, maxGrafico / 2, maxGrafico]}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Histórico - Apenas Visualização */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Histórico de Transferências</h2>

          {transferenciasFiltradas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma transferência encontrada no período selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Descrição</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Registrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {transferenciasFiltradas.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{t.data}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">R$ {t.valor}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${t.tipo === 'especie'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                          {t.tipo === 'especie' ? 'Em Espécie' : 'Digital'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{t.descricao || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{t.dataRegistro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {renderNotificacoes()}
      </div>
    </div>
  );
};

export default ControleTransferencias;
