import React, { useState, useEffect, useRef } from 'react';
import { Calendar, DollarSign, X, Download, Filter, PieChart, TrendingUp, Home, Plus, Eye, Dumbbell, Check, Edit2, Save, Award, Moon, Sun, Activity, CreditCard, Trash2 } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { supabase } from './supabaseClient';

const CONFIRMATION_TIMEOUT = 4000; // 4 seconds

const ControleTransferencias = () => {
  const [tela, setTela] = useState('inicial');
  const [transferencias, setTransferencias] = useState([]);
  const [modoNoturno, setModoNoturno] = useState(() => {
    // Retrieve theme from localStorage, default to false (light mode) if not found
    const savedTheme = localStorage.getItem('modoNoturno');
    return savedTheme === 'true';
  });
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
    horario_inicio: '',
    horario_fim: '',
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
  const timerConfirmacaoRef = useRef(null); // Use ref instead of state to avoid re-renders
  
  // Estados para modal de confirmação
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mensagemModalConfirmacao, setMensagemModalConfirmacao] = useState('');
  const [callbackConfirmacao, setCallbackConfirmacao] = useState(null);
  
  // Estados para sistema de recompensas
  const [mostrarRecompensas, setMostrarRecompensas] = useState(false);
  const [semanaSelecionadaRecompensa, setSemanaSelecionadaRecompensa] = useState(null); // Data de referência para a semana
  const [diasMarcadosRecompensa, setDiasMarcadosRecompensa] = useState({}); // Dias manualmente marcados/desmarcados
  const [tentativasRecompensa, setTentativasRecompensa] = useState(0); // Contador de tentativas
  const [mostrarModalInsuficiente, setMostrarModalInsuficiente] = useState(false);
  const [mensagemModalInsuficiente, setMensagemModalInsuficiente] = useState('');
  const [mostrarSeletorData, setMostrarSeletorData] = useState(false);
  const [semanasRecompensadas, setSemanasRecompensadas] = useState([]); // Lista de semanas que receberam recompensas
  
  // Estado para mostrar estatísticas como modal
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(false);

  // Estados para Débitos
  const [debitos, setDebitos] = useState([]);
  const [debitoSelecionado, setDebitoSelecionado] = useState(null);
  const [mostrarFormularioDebito, setMostrarFormularioDebito] = useState(false);
  const [formularioDebito, setFormularioDebito] = useState({
    nome: '',
    valor: ''
  });
  const [formularioPagamento, setFormularioPagamento] = useState({
    valorPagamento: ''
  });


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
    carregarRecompensas();
    carregarDebitos();
    
    // Cleanup function to clear timer on component unmount
    return () => {
      if (timerConfirmacaoRef.current) {
        clearTimeout(timerConfirmacaoRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('modoNoturno', modoNoturno.toString());
  }, [modoNoturno]);

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
        .select('id, data, tipo, subcategoria, duracao, distancia, observacoes, exercicios, horario_inicio, horario_fim, created_at')
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
  
  const carregarRecompensas = async () => {
    try {
      const { data, error } = await supabase
        .from('recompensas')
        .select('data_inicio_semana, data_fim_semana, dias_treino, concedido_em')
        .order('data_inicio_semana', { ascending: false });

      if (error) {
        // Se a tabela não existe, silenciosamente retorna array vazio
        // Isso é esperado para novos usuários ou antes de aplicar a migration
        console.log('Tabela recompensas não encontrada ou erro (esperado na primeira execução):', error);
        setSemanasRecompensadas([]);
        return;
      }

      setSemanasRecompensadas(data || []);
    } catch (error) {
      console.error('Erro ao carregar recompensas:', error);
      setSemanasRecompensadas([]);
    }
  };
  
  const carregarDebitos = async () => {
    try {
      const { data, error } = await supabase
        .from('debitos')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) {
        console.log('Tabela debitos não encontrada ou erro (esperado na primeira execução):', error);
        setDebitos([]);
        return;
      }

      setDebitos(data || []);
    } catch (error) {
      console.error('Erro ao carregar débitos:', error);
      setDebitos([]);
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

  // Generate a calendar grid with complete weeks (5 or 6 weeks depending on month layout)
  const gerarCalendario5Semanas = (mes, ano) => {
    const primeiroDia = getPrimeiroDiaSemana(mes, ano);
    const diasNoMes = getDiasNoMes(mes, ano);
    const diasCalendario = [];
    
    // Calculate previous month info
    const mesAnterior = mes === 0 ? 11 : mes - 1;
    const anoAnterior = mes === 0 ? ano - 1 : ano;
    const diasMesAnterior = getDiasNoMes(mesAnterior, anoAnterior);
    
    // Add days from previous month to complete the first week
    for (let i = primeiroDia - 1; i >= 0; i--) {
      diasCalendario.push({
        dia: diasMesAnterior - i,
        mes: mesAnterior,
        ano: anoAnterior,
        mesAtual: false
      });
    }
    
    // Add all days from current month
    for (let dia = 1; dia <= diasNoMes; dia++) {
      diasCalendario.push({
        dia: dia,
        mes: mes,
        ano: ano,
        mesAtual: true
      });
    }
    
    // Calculate total weeks needed (either 5 or 6 to show all days)
    const totalDiasSoFar = diasCalendario.length;
    const semanasNecessarias = Math.ceil(totalDiasSoFar / 7);
    const totalDiasCalendario = semanasNecessarias * 7;
    const diasRestantes = totalDiasCalendario - totalDiasSoFar;
    
    // Add days from next month to complete the weeks
    const proximoMes = mes === 11 ? 0 : mes + 1;
    const proximoAno = mes === 11 ? ano + 1 : ano;
    
    for (let dia = 1; dia <= diasRestantes; dia++) {
      diasCalendario.push({
        dia: dia,
        mes: proximoMes,
        ano: proximoAno,
        mesAtual: false
      });
    }
    
    return diasCalendario;
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

  // Se ordenarPorData for true, ordena cronologicamente (mais recente primeiro)
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
      
      return dataB - dataA; // ordem decrescente (mais recente primeiro)
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
  
  // Helper function to convert form values to proper database types
  const converterValoresTreino = (formulario) => {
    // Calculate duration from start and end times
    let duracaoValue = null;
    if (formulario.horario_inicio && formulario.horario_fim) {
      duracaoValue = calcularDuracao(formulario.horario_inicio, formulario.horario_fim);
    }
    
    // Convert distancia to float or null, handling NaN cases
    let distanciaValue = null;
    if (formulario.distancia && String(formulario.distancia).trim() !== '') {
      const parsed = parseFloat(formulario.distancia);
      distanciaValue = isNaN(parsed) ? null : parsed;
    }
    
    return {
      duracao: duracaoValue,
      distancia: distanciaValue,
      horario_inicio: formulario.horario_inicio || null,
      horario_fim: formulario.horario_fim || null
    };
  };
  
  const getTreinosNaData = (dia, mes, ano) => {
    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
    return treinos.filter(t => t.data === dataFormatada);
  };
  
  // Render workout icons as pins on calendar days
  const renderWorkoutIcons = (treinosDoDia) => {
    if (treinosDoDia.length === 0) return null;
    
    const iconSize = treinosDoDia.length >= 3 ? 12 : 16;
    
    const getIconForWorkout = (treino, index) => {
      // Activity icon for cardio, Dumbbell for intensity
      const Icon = treino.tipo === 'cardio' ? Activity : Dumbbell;
      const color = TIPOS_TREINO[treino.tipo]?.cor || '#666';
      return <Icon key={`${treino.id}-${index}`} size={iconSize} style={{ color }} className="drop-shadow-sm" />;
    };
    
    const icons = treinosDoDia.slice(0, 6).map((treino, idx) => getIconForWorkout(treino, idx));
    
    // Layout based on number of workouts
    if (treinosDoDia.length === 1) {
      return (
        <div className="flex justify-center items-center">
          {icons[0]}
        </div>
      );
    }
    
    if (treinosDoDia.length === 2) {
      return (
        <div className="flex justify-center items-center gap-0.5">
          {icons[0]}
          {icons[1]}
        </div>
      );
    }
    
    if (treinosDoDia.length === 3) {
      return (
        <div className="flex justify-center items-center gap-0.5">
          {icons[0]}
          {icons[1]}
          {icons[2]}
        </div>
      );
    }
    
    if (treinosDoDia.length === 4) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5">
            {icons[0]}
            {icons[1]}
          </div>
          <div className="flex gap-0.5">
            {icons[2]}
            {icons[3]}
          </div>
        </div>
      );
    }
    
    if (treinosDoDia.length === 5) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5">
            {icons[0]}
            {icons[1]}
          </div>
          <div className="flex justify-center">
            {icons[2]}
          </div>
          <div className="flex gap-0.5">
            {icons[3]}
            {icons[4]}
          </div>
        </div>
      );
    }
    
    if (treinosDoDia.length >= 6) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5">
            {icons[0]}
            {icons[1]}
            {icons[2]}
          </div>
          <div className="flex gap-0.5">
            {icons[3]}
            {icons[4]}
            {icons[5]}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Render colored training divisions for calendar days
  const renderTrainingDivisions = (treinosDoDia, dia) => {
    if (treinosDoDia.length === 0) return null;
    if (treinosDoDia.length === 1) return null; // Single training uses simple background
    
    const cores = treinosDoDia.map(t => TIPOS_TREINO[t.tipo]?.cor || '#666');
    const isDiaImpar = dia % 2 !== 0;
    
    if (treinosDoDia.length === 2) {
      // Diagonal division - different for even/odd days
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isDiaImpar 
                ? `linear-gradient(45deg, ${cores[0]} 0%, ${cores[0]} 48%, white 48%, white 52%, ${cores[1]} 52%, ${cores[1]} 100%)`
                : `linear-gradient(135deg, ${cores[0]} 0%, ${cores[0]} 48%, white 48%, white 52%, ${cores[1]} 52%, ${cores[1]} 100%)`
            }}
          />
        </div>
      );
    }
    
    if (treinosDoDia.length === 3) {
      // Triangular format
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          {/* Top triangle */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '50%',
              backgroundColor: cores[0],
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              border: '1px solid white'
            }}
          />
          {/* Bottom left */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '50%',
              height: '50%',
              backgroundColor: cores[1],
              clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
              border: '1px solid white'
            }}
          />
          {/* Bottom right */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '50%',
              height: '50%',
              backgroundColor: cores[2],
              clipPath: 'polygon(0 100%, 100% 100%, 100% 0)',
              border: '1px solid white'
            }}
          />
        </div>
      );
    }
    
    if (treinosDoDia.length === 4) {
      // X format
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          {/* Top */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '50%',
              backgroundColor: cores[0],
              clipPath: 'polygon(0 0, 50% 50%, 100% 0)',
              border: '1px solid white'
            }}
          />
          {/* Right */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              backgroundColor: cores[1],
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 50%)',
              border: '1px solid white'
            }}
          />
          {/* Bottom */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '50%',
              backgroundColor: cores[2],
              clipPath: 'polygon(0 100%, 50% 50%, 100% 100%)',
              border: '1px solid white'
            }}
          />
          {/* Left */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              backgroundColor: cores[3],
              clipPath: 'polygon(0 0, 50% 50%, 0 100%)',
              border: '1px solid white'
            }}
          />
        </div>
      );
    }
    
    if (treinosDoDia.length >= 5) {
      // W format for 5 or more trainings
      const displayCores = cores.slice(0, 5);
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          {displayCores.map((cor, idx) => {
            const configs = [
              { left: '0%', width: '20%', top: '0%', height: '100%' },
              { left: '20%', width: '20%', top: '50%', height: '50%' },
              { left: '40%', width: '20%', top: '0%', height: '100%' },
              { left: '60%', width: '20%', top: '50%', height: '50%' },
              { left: '80%', width: '20%', top: '0%', height: '100%' }
            ];
            const config = configs[idx];
            return (
              <div 
                key={idx}
                style={{
                  position: 'absolute',
                  left: config.left,
                  top: config.top,
                  width: config.width,
                  height: config.height,
                  backgroundColor: cor,
                  border: '1px solid white'
                }}
              />
            );
          })}
        </div>
      );
    }
    
    return null;
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
  
  const selecionarDiaTreino = (dia, mes = calendarioTreino.mes, ano = calendarioTreino.ano) => {
    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
    const treinosDoDia = getTreinosNaData(dia, mes, ano);
    
    setDataSelecionadaTreino(dataFormatada);
    
    // Only open form if there are no existing trainings on this day
    if (treinosDoDia.length === 0) {
      setMostrarFormularioTreino(true);
      setFormularioTreino({
        tipo: '',
        subcategoria: '',
        horario_inicio: '',
        horario_fim: '',
        distancia: '',
        observacoes: ''
      });
      setExercicios([]);
      setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
      setTreinoEditando(null);
    } else {
      // If there are existing trainings, just select the day (show the list below)
      setMostrarFormularioTreino(false);
      setTreinoEditando(null);
    }
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
      const { duracao, distancia, horario_inicio, horario_fim } = converterValoresTreino(formularioTreino);
      
      const treinoData = {
        data: dataSelecionadaTreino,
        tipo: formularioTreino.tipo,
        subcategoria: formularioTreino.subcategoria,
        duracao,
        distancia,
        horario_inicio,
        horario_fim,
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
        horario_inicio: '',
        horario_fim: '',
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
      horario_inicio: treino.horario_inicio || '',
      horario_fim: treino.horario_fim || '',
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
      const { duracao, distancia, horario_inicio, horario_fim } = converterValoresTreino(formularioTreino);
      
      const updateData = {
        tipo: formularioTreino.tipo,
        subcategoria: formularioTreino.subcategoria,
        duracao,
        distancia,
        horario_inicio,
        horario_fim,
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
        horario_inicio: '',
        horario_fim: '',
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
    if (timerConfirmacaoRef.current) {
      clearTimeout(timerConfirmacaoRef.current);
    }
    
    setMensagemConfirmacao(mensagem);
    setTipoConfirmacao(tipo);
    setMostrarConfirmacao(true);
    
    // Auto-fechar após CONFIRMATION_TIMEOUT
    const timer = setTimeout(() => {
      setMostrarConfirmacao(false);
    }, CONFIRMATION_TIMEOUT);
    
    timerConfirmacaoRef.current = timer;
  };
  
  const fecharBarraConfirmacao = () => {
    if (timerConfirmacaoRef.current) {
      clearTimeout(timerConfirmacaoRef.current);
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
  
  // Funções do Sistema de Recompensas
  
  // Verificar se uma data específica faz parte de uma semana recompensada
  const diaEstaEmSemanaRecompensada = (dataFormatada) => {
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

  // Verificar se a semana atual já foi recompensada e retornar o registro se existir
  const verificarSemanaJaRecompensada = (semana) => {
    if (!semana || semana.length === 0 || semanasRecompensadas.length === 0) return null;
    
    const dataInicioSemana = semana[0].dataFormatada;
    const dataFimSemana = semana[6].dataFormatada;
    
    // Encontrar se existe uma recompensa para esta semana específica
    return semanasRecompensadas.find(recompensa => 
      recompensa.data_inicio_semana === dataInicioSemana && 
      recompensa.data_fim_semana === dataFimSemana
    );
  };
  
  // Obter semana baseada em uma data de referência
  const obterSemanaPorData = (dataReferencia) => {
    const data = dataReferencia ? new Date(dataReferencia) : new Date();
    const primeiroDiaSemana = new Date(data);
    primeiroDiaSemana.setDate(data.getDate() - data.getDay()); // Domingo
    
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(primeiroDiaSemana);
      dia.setDate(primeiroDiaSemana.getDate() + i);
      diasSemana.push({
        data: dia,
        dataFormatada: `${String(dia.getDate()).padStart(2, '0')}/${String(dia.getMonth() + 1).padStart(2, '0')}/${dia.getFullYear()}`,
        diaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i]
      });
    }
    return diasSemana;
  };
  
  const obterSemanaAtual = () => {
    return obterSemanaPorData(semanaSelecionadaRecompensa);
  };
  
  // Verificar se uma semana tem pelo menos um treino
  const semanaTemTreino = (data) => {
    const semana = obterSemanaPorData(data);
    return semana.some(dia => treinos.some(t => t.data === dia.dataFormatada));
  };
  
  // Verificar se a semana está completa dentro do mês
  const verificarSemanaCompleta = (semana) => {
    if (!semana || semana.length === 0) return { completa: true, diasNoMes: 7 };
    
    const mesReferencia = semanaSelecionadaRecompensa ? new Date(semanaSelecionadaRecompensa).getMonth() : new Date().getMonth();
    
    let diasNoMes = 0;
    semana.forEach(dia => {
      if (dia.data.getMonth() === mesReferencia) {
        diasNoMes++;
      }
    });
    
    return {
      completa: diasNoMes === 7,
      diasNoMes: diasNoMes,
      porcentagem: (diasNoMes / 7) * 100
    };
  };
  
  // Calcular número mínimo de treinos necessários baseado na semana
  const calcularMinimoTreinos = (semana) => {
    const info = verificarSemanaCompleta(semana);
    
    // Para semana completa (7 dias no mês): mínimo 4 treinos
    if (info.completa) {
      return 4;
    }
    
    // Para semana incompleta: ajustar proporcionalmente (arredondando para cima)
    // Mas no mínimo 2 treinos para semanas muito curtas
    const minimoCalculado = Math.ceil((4 / 7) * info.diasNoMes);
    return Math.max(2, minimoCalculado);
  };
  
  // Verificar se um dia está marcado (considerando marcações manuais e treinos reais)
  const diaEstaMarcado = (dataFormatada) => {
    // Se há marcação manual, usa ela
    if (Object.prototype.hasOwnProperty.call(diasMarcadosRecompensa, dataFormatada)) {
      return diasMarcadosRecompensa[dataFormatada];
    }
    // Caso contrário, verifica se há treino real
    return treinos.some(t => t.data === dataFormatada);
  };
  
  // Toggle manual de marcação de dia
  const toggleDiaMarcado = (dataFormatada) => {
    const estadoAtual = diaEstaMarcado(dataFormatada);
    setDiasMarcadosRecompensa({
      ...diasMarcadosRecompensa,
      [dataFormatada]: !estadoAtual
    });
  };
  
  const verificarConsistenciaTreino = (diasComTreino, semana) => {
    const minimoNecessario = calcularMinimoTreinos(semana);
    const infoSemana = verificarSemanaCompleta(semana);
    
    if (diasComTreino.length < minimoNecessario) {
      const mensagem = infoSemana.completa 
        ? `Você precisa de pelo menos ${minimoNecessario} dias de treino para ganhar uma recompensa.`
        : `Esta semana tem apenas ${infoSemana.diasNoMes} dias no mês. Você precisa de pelo menos ${minimoNecessario} dias de treino.`;
      
      return {
        valido: false,
        mensagem: mensagem
      };
    }
    
    // Ordenar dias por data
    const diasOrdenados = [...diasComTreino].sort((a, b) => new Date(a.data) - new Date(b.data));
    
    // Verificar lacunas entre treinos
    let maiorLacuna = 0;
    for (let i = 1; i < diasOrdenados.length; i++) {
      const diff = Math.floor((new Date(diasOrdenados[i].data) - new Date(diasOrdenados[i-1].data)) / (1000 * 60 * 60 * 24));
      if (diff > maiorLacuna) {
        maiorLacuna = diff;
      }
    }
    
    // Se houver lacuna de mais de 3 dias, alertar
    if (maiorLacuna > 3) {
      return {
        valido: true,
        aviso: true,
        mensagem: `Há ${maiorLacuna - 1} dias sem treino entre alguns de seus treinos. Tem certeza que deseja adicionar uma recompensa?`
      };
    }
    
    return { valido: true, aviso: false };
  };
  
  const adicionarRecompensa = async () => {
    const semana = obterSemanaAtual();
    const diasComTreino = semana.filter(dia => diaEstaMarcado(dia.dataFormatada));
    
    // Issue #2: Check if there are any training days before showing confirmation
    if (diasComTreino.length === 0) {
      mostrarBarraConfirmacao('Não há dias de treino nesta semana para recompensar!', 'warning');
      return;
    }
    
    const validacao = verificarConsistenciaTreino(diasComTreino.map(d => ({ data: d.data })), semana);
    
    if (!validacao.valido) {
      setTentativasRecompensa(prev => prev + 1);
      setMensagemModalInsuficiente(validacao.mensagem);
      setMostrarModalInsuficiente(true);
      return;
    }
    
    if (validacao.aviso) {
      const confirmado = await mostrarModalConfirmacaoFn(validacao.mensagem);
      if (!confirmado) {
        return;
      }
    }
    
    // Salvar ou atualizar recompensa no banco de dados
    try {
      const dataInicioSemana = semana[0].dataFormatada; // Domingo
      const dataFimSemana = semana[6].dataFormatada; // Sábado
      
      // Issue #1: Check if week is already rewarded
      const semanaExistente = verificarSemanaJaRecompensada(semana);
      
      if (semanaExistente) {
        // Update existing reward
        const { error } = await supabase
          .from('recompensas')
          .update({
            dias_treino: diasComTreino.length,
            concedido_em: new Date().toISOString()
          })
          .eq('data_inicio_semana', dataInicioSemana)
          .eq('data_fim_semana', dataFimSemana);

        if (error) {
          console.error('Erro ao atualizar recompensa:', error);
          mostrarBarraConfirmacao('Erro ao atualizar recompensa. Tente novamente.', 'error');
        } else {
          // Recarregar recompensas para atualizar a interface
          await carregarRecompensas();
          mostrarBarraConfirmacao('🎉 Recompensa atualizada com sucesso!', 'success');
        }
      } else {
        // Insert new reward
        const { error } = await supabase
          .from('recompensas')
          .insert([
            {
              data_inicio_semana: dataInicioSemana,
              data_fim_semana: dataFimSemana,
              dias_treino: diasComTreino.length
            }
          ]);

        if (error) {
          console.error('Erro ao salvar recompensa:', error);
          mostrarBarraConfirmacao('Erro ao salvar recompensa. A recompensa foi concedida, mas não foi salva no banco de dados.', 'warning');
        } else {
          // Recarregar recompensas para atualizar a interface
          await carregarRecompensas();
          mostrarBarraConfirmacao('🎉 Parabéns! Você ganhou uma recompensa por manter a consistência!', 'success');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar recompensa:', error);
      mostrarBarraConfirmacao('Erro ao salvar recompensa. A recompensa foi concedida, mas não foi salva no banco de dados.', 'warning');
    }
    
    // Resetar estados
    setMostrarRecompensas(false);
    setTentativasRecompensa(0);
    setDiasMarcadosRecompensa({});
    setSemanaSelecionadaRecompensa(null);
  };
  
  const recompensarMesmoAssim = async () => {
    setMostrarModalInsuficiente(false);
    
    // Salvar recompensa mesmo sem requisitos mínimos
    const semana = obterSemanaAtual();
    const diasComTreino = semana.filter(dia => diaEstaMarcado(dia.dataFormatada));
    
    // Issue #2: Check if there are any training days
    if (diasComTreino.length === 0) {
      mostrarBarraConfirmacao('Não há dias de treino nesta semana para recompensar!', 'warning');
      return;
    }
    
    try {
      const dataInicioSemana = semana[0].dataFormatada; // Domingo
      const dataFimSemana = semana[6].dataFormatada; // Sábado
      
      // Issue #1: Check if week is already rewarded
      const semanaExistente = verificarSemanaJaRecompensada(semana);
      
      if (semanaExistente) {
        // Update existing reward
        const { error } = await supabase
          .from('recompensas')
          .update({
            dias_treino: diasComTreino.length,
            concedido_em: new Date().toISOString()
          })
          .eq('data_inicio_semana', dataInicioSemana)
          .eq('data_fim_semana', dataFimSemana);

        if (error) {
          console.error('Erro ao atualizar recompensa:', error);
        } else {
          await carregarRecompensas();
        }
      } else {
        // Insert new reward
        const { error } = await supabase
          .from('recompensas')
          .insert([
            {
              data_inicio_semana: dataInicioSemana,
              data_fim_semana: dataFimSemana,
              dias_treino: diasComTreino.length
            }
          ]);

        if (error) {
          console.error('Erro ao salvar recompensa:', error);
        } else {
          // Recarregar recompensas para atualizar a interface
          await carregarRecompensas();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar recompensa:', error);
    }
    
    mostrarBarraConfirmacao('🎉 Recompensa concedida! Continue se esforçando!', 'success');
    
    // Resetar estados
    setMostrarRecompensas(false);
    setTentativasRecompensa(0);
    setDiasMarcadosRecompensa({});
    setSemanaSelecionadaRecompensa(null);
  };
  
  const fecharModalInsuficiente = () => {
    setMostrarModalInsuficiente(false);
  };
  
  const abrirSistemaRecompensas = () => {
    setSemanaSelecionadaRecompensa(new Date());
    setDiasMarcadosRecompensa({});
    setTentativasRecompensa(0);
    setMostrarRecompensas(true);
  };
  
  const selecionarDataParaSemana = (dia, mes, ano) => {
    const data = new Date(ano, mes, dia);
    setSemanaSelecionadaRecompensa(data);
    setDiasMarcadosRecompensa({});
    setTentativasRecompensa(0);
    setMostrarSeletorData(false);
  };
  
  // Renderiza componentes de notificação e confirmação
  const renderNotificacoes = () => (
    <>
      {/* Barra de Confirmação */}
      {mostrarConfirmacao && (
        <div className={`fixed bottom-0 left-0 right-0 shadow-2xl border-t-4 p-4 flex items-center justify-between z-50 animate-slide-up ${
          modoNoturno ? 'bg-slate-800' : 'bg-white'
        } ${
          tipoConfirmacao === 'success' ? 'border-green-500' :
          tipoConfirmacao === 'error' ? 'border-red-500' :
          tipoConfirmacao === 'warning' ? 'border-yellow-500' :
          'border-blue-500'
        }`}>
          <div className="flex-1">
            <p className={`font-semibold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>{mensagemConfirmacao}</p>
            <div className={`absolute top-0 left-0 right-0 h-1 animate-shrink-width ${
              tipoConfirmacao === 'success' ? 'bg-green-500' :
              tipoConfirmacao === 'error' ? 'bg-red-500' :
              tipoConfirmacao === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}></div>
          </div>
          <button
            onClick={fecharBarraConfirmacao}
            className={`ml-4 p-2 rounded-full transition-colors ${
              modoNoturno 
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>
      )}
      
      {/* Modal de Confirmação */}
      {mostrarModalConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl shadow-2xl p-6 max-w-md w-full ${
            modoNoturno ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>Confirmação</h3>
            <p className={`mb-6 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>{mensagemModalConfirmacao}</p>
            <div className="flex gap-3">
              <button
                onClick={confirmarAcao}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={cancelarAcao}
                className={`flex-1 border-2 py-3 rounded-2xl font-bold transition-colors ${
                  modoNoturno 
                    ? 'border-slate-600 text-slate-200 hover:bg-slate-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
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
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        modoNoturno ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="max-w-4xl w-full">
          {/* Night Mode Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setModoNoturno(!modoNoturno)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full shadow hover:shadow-md transition-all ${
                modoNoturno ? 'bg-slate-700 text-amber-300' : 'bg-white text-indigo-600'
              }`}
              title={modoNoturno ? 'Modo Diurno' : 'Modo Noturno'}
            >
              {modoNoturno ? <Sun size={20} className="text-amber-300" /> : <Moon size={20} className="text-indigo-600" />}
              <span className="font-semibold">{modoNoturno ? 'Modo Dia' : 'Modo Noite'}</span>
            </button>
          </div>
          
          <div className="text-center mb-12">
            <h1 className={`text-5xl font-bold mb-4 flex items-center justify-center gap-4 ${
              modoNoturno ? 'text-slate-100' : 'text-gray-800'
            }`}>
              <DollarSign className={modoNoturno ? 'text-blue-400' : 'text-blue-600'} size={56} />
              Hub de Funções
            </h1>
            <p className={`text-xl ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>Escolha uma opção para começar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seção de Transferências - Navigate to Menu Page */}
            <button
              onClick={() => setTela('transferencias-menu')}
              className={`rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 group ${
                modoNoturno ? 'bg-slate-700' : 'bg-white'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`p-6 rounded-full transition-colors ${
                  modoNoturno 
                    ? 'bg-blue-900 group-hover:bg-blue-600' 
                    : 'bg-blue-100 group-hover:bg-blue-600'
                }`}>
                  <DollarSign className={`transition-colors ${
                    modoNoturno 
                      ? 'text-blue-300 group-hover:text-white' 
                      : 'text-blue-600 group-hover:text-white'
                  }`} size={48} />
                </div>
                <h2 className={`text-2xl font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                  Transferências
                </h2>
                <p className={`text-center ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                  Gerencie suas transferências financeiras
                </p>
              </div>
            </button>
            
            {/* Seção de Treino */}
            <button
              onClick={() => setTela('treino')}
              className={`rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 group ${
                modoNoturno ? 'bg-slate-700' : 'bg-white'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`p-6 rounded-full transition-colors ${
                  modoNoturno 
                    ? 'bg-purple-900 group-hover:bg-purple-600' 
                    : 'bg-purple-100 group-hover:bg-purple-600'
                }`}>
                  <Dumbbell className={`transition-colors ${
                    modoNoturno 
                      ? 'text-purple-300 group-hover:text-white' 
                      : 'text-purple-600 group-hover:text-white'
                  }`} size={48} />
                </div>
                <h2 className={`text-2xl font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>Treino</h2>
                <p className={`text-center ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
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

  // TELA DE MENU DE TRANSFERÊNCIAS
  if (tela === 'transferencias-menu') {
    return (
      <div className={`min-h-screen p-4 flex items-center justify-center ${
        modoNoturno ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="max-w-6xl w-full">
          <button
            onClick={() => setTela('inicial')}
            className={`mb-6 flex items-center gap-2 px-6 py-3 rounded-full shadow hover:shadow-md transition-all ${
              modoNoturno ? 'bg-slate-700 text-slate-100' : 'bg-white'
            }`}
          >
            <Home size={20} />
            Voltar para Início
          </button>

          <div className="text-center mb-12">
            <h1 className={`text-5xl font-bold mb-4 flex items-center justify-center gap-4 ${
              modoNoturno ? 'text-slate-100' : 'text-gray-800'
            }`}>
              <DollarSign className={modoNoturno ? 'text-blue-400' : 'text-blue-600'} size={56} />
              Transferências
            </h1>
            <p className={`text-xl ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
              Escolha uma opção para gerenciar suas transferências
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Visualizar Histórico */}
            <button
              onClick={() => setTela('visualizar')}
              className={`rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105 group ${
                modoNoturno ? 'bg-slate-700' : 'bg-white'
              }`}
            >
              <div className="flex flex-col items-center gap-6">
                <div className={`p-8 rounded-full transition-colors ${
                  modoNoturno 
                    ? 'bg-green-900/30 group-hover:bg-green-600' 
                    : 'bg-green-100 group-hover:bg-green-600'
                }`}>
                  <Eye className={`transition-colors ${
                    modoNoturno ? 'text-green-400 group-hover:text-white' : 'text-green-600 group-hover:text-white'
                  }`} size={64} />
                </div>
                <h2 className={`text-3xl font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                  Visualizar Histórico
                </h2>
                <p className={`text-center text-lg ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                  Veja gráficos, relatórios e exporte planilhas das suas transferências
                </p>
              </div>
            </button>
            
            {/* Adicionar Transferências */}
            <button
              onClick={() => setTela('adicionar')}
              className={`rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105 group ${
                modoNoturno ? 'bg-slate-700' : 'bg-white'
              }`}
            >
              <div className="flex flex-col items-center gap-6">
                <div className={`p-8 rounded-full transition-colors ${
                  modoNoturno 
                    ? 'bg-blue-900/30 group-hover:bg-blue-600' 
                    : 'bg-blue-100 group-hover:bg-blue-600'
                }`}>
                  <Plus className={`transition-colors ${
                    modoNoturno ? 'text-blue-400 group-hover:text-white' : 'text-blue-600 group-hover:text-white'
                  }`} size={64} />
                </div>
                <h2 className={`text-3xl font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                  Adicionar Transferências
                </h2>
                <p className={`text-center text-lg ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                  Registre novas transferências com data, valor e tipo
                </p>
              </div>
            </button>
            
            {/* Débitos */}
            <button
              onClick={() => setTela('debitos')}
              className={`rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105 group ${
                modoNoturno ? 'bg-slate-700' : 'bg-white'
              }`}
            >
              <div className="flex flex-col items-center gap-6">
                <div className={`p-8 rounded-full transition-colors ${
                  modoNoturno 
                    ? 'bg-orange-900/30 group-hover:bg-orange-600' 
                    : 'bg-orange-100 group-hover:bg-orange-600'
                }`}>
                  <CreditCard className={`transition-colors ${
                    modoNoturno ? 'text-orange-400 group-hover:text-white' : 'text-orange-600 group-hover:text-white'
                  }`} size={64} />
                </div>
                <h2 className={`text-3xl font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                  Débitos
                </h2>
                <p className={`text-center text-lg ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                  Gerencie débitos ativos e histórico de pagamentos
                </p>
              </div>
            </button>
          </div>
        </div>
        
        {renderNotificacoes()}
      </div>
    );
  }

  // TELA DE DÉBITOS
  if (tela === 'debitos') {
    const debitosAtivos = debitos.filter(d => d.status === 'ativo');
    const debitosPagos = debitos.filter(d => d.status === 'pago');
    
    const adicionarDebito = async () => {
      if (!formularioDebito.nome || !formularioDebito.valor) {
        mostrarBarraConfirmacao('Por favor, preencha o nome e o valor do débito!', 'warning');
        return;
      }

      try {
        const valorTotal = parseFloat(formularioDebito.valor.replace(/\./g, '').replace(',', '.'));
        const dataAtual = new Date();
        const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

        const { error } = await supabase
          .from('debitos')
          .insert([{
            nome: formularioDebito.nome,
            valor_total: valorTotal,
            valor_pago: 0,
            valor_restante: valorTotal,
            data_criacao: dataFormatada,
            status: 'ativo'
          }]);

        if (error) throw error;

        mostrarBarraConfirmacao('Débito adicionado com sucesso!', 'success');
        setFormularioDebito({ nome: '', valor: '' });
        setMostrarFormularioDebito(false);
        await carregarDebitos();
      } catch (error) {
        console.error('Erro ao adicionar débito:', error);
        mostrarBarraConfirmacao('Erro ao adicionar débito. Tente novamente.', 'error');
      }
    };

    const pagarDebito = async () => {
      if (!debitoSelecionado || !formularioPagamento.valorPagamento) {
        mostrarBarraConfirmacao('Por favor, informe o valor do pagamento!', 'warning');
        return;
      }

      try {
        const valorPagamento = parseFloat(formularioPagamento.valorPagamento.replace(/\./g, '').replace(',', '.'));
        const novoValorPago = debitoSelecionado.valor_pago + valorPagamento;
        const novoValorRestante = debitoSelecionado.valor_total - novoValorPago;

        if (valorPagamento > debitoSelecionado.valor_restante) {
          mostrarBarraConfirmacao('Valor do pagamento não pode exceder o valor restante!', 'error');
          return;
        }

        const dataAtual = new Date();
        const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

        // Se pagamento total, marcar como pago
        if (novoValorRestante === 0) {
          const { error: updateError } = await supabase
            .from('debitos')
            .update({
              valor_pago: novoValorPago,
              valor_restante: 0,
              status: 'pago'
            })
            .eq('id', debitoSelecionado.id);

          if (updateError) throw updateError;

          // Adicionar na tabela de transferências
          const { error: transferenciaError } = await supabase
            .from('transferencias')
            .insert([{
              valor: formularioPagamento.valorPagamento,
              data: dataFormatada,
              tipo: 'digital',
              descricao: `Pagamento: ${debitoSelecionado.nome}`
            }]);

          if (transferenciaError) throw transferenciaError;

          mostrarBarraConfirmacao('Débito pago completamente!', 'success');
        } else {
          // Pagamento parcial - atualizar débito existente
          const numeroParcela = (debitoSelecionado.numero_parcela || 0) + 1;
          const { error: updateError } = await supabase
            .from('debitos')
            .update({
              valor_pago: novoValorPago,
              valor_restante: novoValorRestante,
              numero_parcela: numeroParcela
            })
            .eq('id', debitoSelecionado.id);

          if (updateError) throw updateError;

          // Adicionar pagamento parcial na tabela de transferências
          const { error: transferenciaError } = await supabase
            .from('transferencias')
            .insert([{
              valor: formularioPagamento.valorPagamento,
              data: dataFormatada,
              tipo: 'digital',
              descricao: `Pagamento parcial ${numeroParcela}: ${debitoSelecionado.nome}`
            }]);

          if (transferenciaError) throw transferenciaError;

          mostrarBarraConfirmacao(`Pagamento parcial registrado! Restante: R$ ${novoValorRestante.toFixed(2)}`, 'success');
        }

        setFormularioPagamento({ valorPagamento: '' });
        setDebitoSelecionado(null);
        await carregarDebitos();
        await carregarDados();
      } catch (error) {
        console.error('Erro ao pagar débito:', error);
        mostrarBarraConfirmacao('Erro ao processar pagamento. Tente novamente.', 'error');
      }
    };

    const excluirDebito = async (id) => {
      const confirmado = await mostrarModalConfirmacaoFn('Tem certeza que deseja excluir este débito?');
      if (!confirmado) return;

      try {
        const { error } = await supabase
          .from('debitos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        mostrarBarraConfirmacao('Débito excluído com sucesso!', 'success');
        await carregarDebitos();
      } catch (error) {
        console.error('Erro ao excluir débito:', error);
        mostrarBarraConfirmacao('Erro ao excluir débito. Tente novamente.', 'error');
      }
    };

    return (
      <div className={`min-h-screen p-4 ${
        modoNoturno ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setTela('transferencias-menu')}
            className={`mb-6 flex items-center gap-2 px-6 py-3 rounded-full shadow hover:shadow-md transition-all ${
              modoNoturno ? 'bg-slate-700 text-slate-100' : 'bg-white'
            }`}
          >
            <Home size={20} />
            Voltar
          </button>

          {/* Adicionar Débito */}
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
            <h1 className={`text-3xl font-bold mb-6 flex items-center gap-3 ${
              modoNoturno ? 'text-slate-100' : 'text-gray-800'
            }`}>
              <CreditCard className={modoNoturno ? 'text-orange-400' : 'text-orange-600'} size={36} />
              Gerenciar Débitos
            </h1>

            {!mostrarFormularioDebito ? (
              <button
                onClick={() => setMostrarFormularioDebito(true)}
                className="w-full bg-orange-600 text-white py-3 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Plus size={24} />
                Adicionar Novo Débito
              </button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      Nome do Débito
                    </label>
                    <input
                      type="text"
                      value={formularioDebito.nome}
                      onChange={(e) => setFormularioDebito({ ...formularioDebito, nome: e.target.value })}
                      placeholder="Ex: Cartão de crédito, Empréstimo..."
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                        modoNoturno 
                          ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-orange-400' 
                          : 'border-gray-300 focus:border-orange-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      Valor Total (R$)
                    </label>
                    <input
                      type="text"
                      value={formularioDebito.valor}
                      onChange={(e) => setFormularioDebito({ ...formularioDebito, valor: formatarValor(e.target.value) })}
                      placeholder="0,00"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                        modoNoturno 
                          ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-orange-400' 
                          : 'border-gray-300 focus:border-orange-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={adicionarDebito}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Adicionar Débito
                  </button>
                  <button
                    onClick={() => {
                      setMostrarFormularioDebito(false);
                      setFormularioDebito({ nome: '', valor: '' });
                    }}
                    className={`px-6 py-3 border-2 rounded-2xl font-bold text-lg transition-colors ${
                      modoNoturno 
                        ? 'border-slate-600 text-slate-200 hover:bg-slate-700' 
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Débitos Ativos */}
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
              Débitos Ativos ({debitosAtivos.length})
            </h2>

            {debitosAtivos.length === 0 ? (
              <p className={`text-center py-8 ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>
                Nenhum débito ativo no momento.
              </p>
            ) : (
              <div className="space-y-4">
                {debitosAtivos.map((debito) => (
                  <div
                    key={debito.id}
                    className={`border-2 rounded-2xl p-4 ${
                      modoNoturno ? 'border-slate-600 bg-slate-700/50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className={`text-xl font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                          {debito.nome}
                        </h3>
                        <p className={`text-sm ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>
                          Criado em: {debito.data_criacao}
                        </p>
                      </div>
                      <button
                        onClick={() => excluirDebito(debito.id)}
                        className={`p-2 rounded-full transition-colors ${
                          modoNoturno 
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' 
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className={`text-sm ${modoNoturno ? 'text-slate-400' : 'text-gray-600'}`}>Valor Total</p>
                        <p className={`text-lg font-bold ${modoNoturno ? 'text-orange-400' : 'text-orange-600'}`}>
                          R$ {debito.valor_total.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${modoNoturno ? 'text-slate-400' : 'text-gray-600'}`}>Valor Pago</p>
                        <p className={`text-lg font-bold ${modoNoturno ? 'text-green-400' : 'text-green-600'}`}>
                          R$ {debito.valor_pago.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${modoNoturno ? 'text-slate-400' : 'text-gray-600'}`}>Valor Restante</p>
                        <p className={`text-lg font-bold ${modoNoturno ? 'text-red-400' : 'text-red-600'}`}>
                          R$ {debito.valor_restante.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {debitoSelecionado?.id === debito.id ? (
                      <div className={`space-y-3 border-t-2 pt-4 ${modoNoturno ? 'border-slate-600' : 'border-gray-200'}`}>
                        <label className={`block text-sm font-semibold mb-2 ${
                          modoNoturno ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                          Valor do Pagamento (máximo: R$ {debito.valor_restante.toFixed(2)})
                        </label>
                        <input
                          type="text"
                          value={formularioPagamento.valorPagamento}
                          onChange={(e) => setFormularioPagamento({ valorPagamento: formatarValor(e.target.value) })}
                          placeholder="0,00"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                            modoNoturno 
                              ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-green-400' 
                              : 'border-gray-300 focus:border-green-500'
                          }`}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={pagarDebito}
                            className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors"
                          >
                            Confirmar Pagamento
                          </button>
                          <button
                            onClick={() => {
                              setDebitoSelecionado(null);
                              setFormularioPagamento({ valorPagamento: '' });
                            }}
                            className={`px-6 py-3 border-2 rounded-2xl font-bold text-lg transition-colors ${
                              modoNoturno 
                                ? 'border-slate-600 text-slate-200 hover:bg-slate-700' 
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDebitoSelecionado(debito)}
                        className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
                      >
                        Pagar Débito
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico de Débitos Pagos */}
          {debitosPagos.length > 0 && (
            <div className={`rounded-2xl shadow-xl p-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-6 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                Histórico de Débitos Pagos ({debitosPagos.length})
              </h2>
              <div className="space-y-3">
                {debitosPagos.map((debito) => (
                  <div
                    key={debito.id}
                    className={`border-2 rounded-xl p-4 ${
                      modoNoturno ? 'border-green-700 bg-green-900/20' : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                          {debito.nome}
                        </h3>
                        <p className={`text-sm ${modoNoturno ? 'text-slate-400' : 'text-gray-600'}`}>
                          Criado: {debito.data_criacao} | Pago: R$ {debito.valor_total.toFixed(2)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        modoNoturno ? 'bg-green-900 text-green-300' : 'bg-green-200 text-green-800'
                      }`}>
                        PAGO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {renderNotificacoes()}
      </div>
    );
  }

  // TELA DE ADICIONAR
  if (tela === 'adicionar') {
    const todasTransferencias = filtrarTransferencias(false);

    return (
      <div className={`min-h-screen p-4 ${
        modoNoturno ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setTela('inicial')}
            className={`mb-6 flex items-center gap-2 px-6 py-3 rounded-full shadow hover:shadow-md transition-all ${
              modoNoturno ? 'bg-slate-700 text-slate-100' : 'bg-white'
            }`}
          >
            <Home size={20} />
            Voltar para Início
          </button>

          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
            <h1 className={`text-3xl font-bold mb-6 flex items-center gap-3 ${
              modoNoturno ? 'text-slate-100' : 'text-gray-800'
            }`}>
              <Plus className={modoNoturno ? 'text-blue-400' : 'text-blue-600'} size={36} />
              Adicionar Transferência
            </h1>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    modoNoturno ? 'text-slate-200' : 'text-gray-700'
                  }`}>
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    value={formulario.valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                      modoNoturno 
                        ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="relative">
                  <label className={`block text-sm font-semibold mb-2 ${
                    modoNoturno ? 'text-slate-200' : 'text-gray-700'
                  }`}>
                    Data
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formulario.data}
                      readOnly
                      placeholder="Selecione a data"
                      onClick={() => setMostrarCalendario(!mostrarCalendario)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none cursor-pointer text-lg ${
                        modoNoturno 
                          ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400' 
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    <Calendar
                      className={`absolute right-3 top-3 pointer-events-none ${
                        modoNoturno ? 'text-slate-400' : 'text-gray-400'
                      }`}
                      size={24}
                    />
                  </div>

                  {mostrarCalendario && (
                    <div className={`absolute z-50 mt-2 border-2 rounded-lg shadow-2xl p-4 w-80 ${
                      modoNoturno ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() => mudarMes(-1)}
                          className={`p-2 rounded-full ${modoNoturno ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                        >
                          ←
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMostrarAnos(!mostrarAnos)}
                            className={`font-bold px-3 py-1 rounded ${
                              modoNoturno 
                                ? 'text-slate-100 hover:bg-slate-700' 
                                : 'text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            {meses[calendario.mes]} {calendario.ano}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => mudarMes(1)}
                          className={`p-2 rounded-full ${modoNoturno ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                        >
                          →
                        </button>
                      </div>

                      {mostrarAnos && (
                        <div className={`absolute top-16 left-0 right-0 border-2 rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto z-50 ${
                          modoNoturno ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'
                        }`}>
                          <div className="grid grid-cols-3 gap-2">
                            {gerarListaAnos().map(ano => (
                              <button
                                key={ano}
                                type="button"
                                onClick={() => selecionarAno(ano)}
                                className={`p-2 rounded ${
                                  ano === calendario.ano 
                                    ? 'bg-blue-600 text-white font-bold' 
                                    : (modoNoturno ? 'hover:bg-slate-700' : 'hover:bg-blue-100')
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
                          <div key={dia} className={`text-center text-xs font-bold py-1 ${
                            modoNoturno ? 'text-slate-300' : 'text-gray-600'
                          }`}>
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
                  <label className={`block text-sm font-semibold mb-2 ${
                    modoNoturno ? 'text-slate-200' : 'text-gray-700'
                  }`}>
                    Tipo de Transferência
                  </label>
                  <select
                    value={formulario.tipo}
                    onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                      modoNoturno 
                        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-400' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  >
                    <option value="especie">Em Espécie</option>
                    <option value="digital">Transferência Digital</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    modoNoturno ? 'text-slate-200' : 'text-gray-700'
                  }`}>
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={formulario.descricao}
                    onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
                    placeholder="Ex: Mesada, Compras..."
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                      modoNoturno 
                        ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400' 
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
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
          <div className={`rounded-2xl shadow-xl p-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
              Histórico de Transferências
            </h2>

            {todasTransferencias.length === 0 ? (
              <p className={`text-center py-8 ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>
                Nenhuma transferência registrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b-2 ${modoNoturno ? 'border-slate-600' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${
                        modoNoturno ? 'text-slate-200' : 'text-gray-700'
                      }`}>Data</th>
                      <th className={`text-left py-3 px-4 font-semibold ${
                        modoNoturno ? 'text-slate-200' : 'text-gray-700'
                      }`}>Valor</th>
                      <th className={`text-left py-3 px-4 font-semibold ${
                        modoNoturno ? 'text-slate-200' : 'text-gray-700'
                      }`}>Tipo</th>
                      <th className={`text-left py-3 px-4 font-semibold ${
                        modoNoturno ? 'text-slate-200' : 'text-gray-700'
                      }`}>Descrição</th>
                      <th className={`text-left py-3 px-4 font-semibold ${
                        modoNoturno ? 'text-slate-200' : 'text-gray-700'
                      }`}>Registrado em</th>
                      <th className={`text-center py-3 px-4 font-semibold ${
                        modoNoturno ? 'text-slate-200' : 'text-gray-700'
                      }`}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todasTransferencias.map((t) => (
                      <tr key={t.id} className={`border-b ${
                        modoNoturno 
                          ? 'border-slate-700 hover:bg-slate-700/50' 
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}>
                        <td className={`py-3 px-4 ${modoNoturno ? 'text-slate-200' : ''}`}>{t.data}</td>
                        <td className="py-3 px-4 font-semibold text-green-600">R$ {t.valor}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${t.tipo === 'especie'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {t.tipo === 'especie' ? 'Em Espécie' : 'Digital'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                          {t.descricao || '-'}
                        </td>
                        <td className={`py-3 px-4 text-sm ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>
                          {t.dataRegistro}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => excluirTransferencia(t.id)}
                            className={`p-2 rounded-full transition-colors ${
                              modoNoturno 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' 
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            }`}
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
    
    // Generate 5-week calendar grid
    const diasCalendario = gerarCalendario5Semanas(calendarioTreino.mes, calendarioTreino.ano);
    
    // Calcular estatísticas do mês
    const calcularEstatisticasMes = () => {
      const treinosMes = treinos.filter(t => {
        const [dia, mes, ano] = t.data.split('/').map(Number);
        return mes - 1 === calendarioTreino.mes && ano === calendarioTreino.ano;
      });
      
      const diasComTreino = new Set(treinosMes.map(t => t.data)).size;
      const tiposContagem = { cardio: 0, intensidade: 0 };
      
      treinosMes.forEach(t => {
        // Only count valid training types from TIPOS_TREINO
        if (t.tipo && TIPOS_TREINO[t.tipo]) {
          tiposContagem[t.tipo] = (tiposContagem[t.tipo] || 0) + 1;
        }
      });
      
      // Calcular média de treinos por semana
      const semanasNoMes = Math.ceil(diasNoMes / 7);
      const mediaPorSemana = semanasNoMes > 0 ? (diasComTreino / semanasNoMes).toFixed(1) : 0;
      
      return {
        diasComTreino,
        totalTreinos: treinosMes.length,
        tiposContagem,
        mediaPorSemana
      };
    };
    
    const estatisticas = calcularEstatisticasMes();
    
    // Prepare chart data for donut chart
    const chartData = [
      { name: 'Cardio', value: estatisticas.tiposContagem.cardio || 0, color: TIPOS_TREINO.cardio.cor },
      { name: 'Intensidade', value: estatisticas.tiposContagem.intensidade || 0, color: TIPOS_TREINO.intensidade.cor }
    ].filter(item => item.value > 0);
    
    const toggleEstatisticas = () => {
      setMostrarEstatisticas(!mostrarEstatisticas);
    };
    
    return (
      <div className={`min-h-screen p-4 ${modoNoturno ? 'treino-background-noite' : 'treino-background-dia'}`} style={{ fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setTela('inicial')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full shadow hover:shadow-md transition-all ${
                modoNoturno ? 'bg-slate-700 text-slate-100' : 'bg-white'
              }`}
            >
              <Home size={20} />
              Voltar para Início
            </button>
          </div>

          {/* Calendar Container */}
          <div className={`rounded-3xl shadow-xl mb-6 p-4 sm:p-6 relative ${
            modoNoturno ? 'bg-slate-800/90' : 'bg-white'
          }`}>
            {/* Reward System Button */}
            <button
              onClick={abrirSistemaRecompensas}
              className="absolute top-4 right-4 bg-gradient-to-br from-amber-400 to-yellow-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-20"
              title="Sistema de Recompensas"
            >
              <Award size={24} />
            </button>
            
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 pr-16 ${
                modoNoturno ? 'text-slate-100' : 'text-gray-800'
              }`}>
                <Dumbbell className={modoNoturno ? 'text-rose-400' : 'text-rose-500'} size={28} />
                <span className="hidden sm:inline">Calendário de Treinos</span>
                <span className="sm:hidden">Treinos</span>
              </h1>
              
              <button
                onClick={toggleEstatisticas}
                className={`p-2 rounded-full transition-colors ${
                  modoNoturno ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Ver Estatísticas"
              >
                <PieChart size={24} />
              </button>
            </div>

            {/* Calendário */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => mudarMesTreino(-1)}
                  className={`p-2 sm:p-3 rounded-full transition-colors ${
                    modoNoturno ? 'hover:bg-slate-700' : 'hover:bg-rose-50'
                  }`}
                >
                  <span className={`text-xl sm:text-2xl ${modoNoturno ? 'text-slate-200' : ''}`}>←</span>
                </button>

                <h2 className={`text-lg sm:text-2xl font-bold ${
                  modoNoturno ? 'text-slate-100' : 'text-gray-800'
                }`}>
                  {meses[calendarioTreino.mes]} {calendarioTreino.ano}
                </h2>

                <button
                  type="button"
                  onClick={() => mudarMesTreino(1)}
                  className={`p-2 sm:p-3 rounded-full transition-colors ${
                    modoNoturno ? 'hover:bg-slate-700' : 'hover:bg-rose-50'
                  }`}
                >
                  <span className={`text-xl sm:text-2xl ${modoNoturno ? 'text-slate-200' : ''}`}>→</span>
                </button>
              </div>

              {/* Grid do calendário - Mais compacto */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {diasSemana.map(dia => (
                  <div key={dia} className={`text-center text-xs sm:text-sm font-bold py-1 ${
                    modoNoturno ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* 5-week calendar grid (35 days) */}
                {diasCalendario.map((diaInfo, index) => {
                  const { dia, mes, ano, mesAtual } = diaInfo;
                  const dataFormatada = formatarData(dia, mes, ano);
                  const treinosDoDia = getTreinosNaData(dia, mes, ano);
                  const temTreinos = treinosDoDia.length > 0;
                  const isHoje = dia === new Date().getDate() &&
                    mes === new Date().getMonth() &&
                    ano === new Date().getFullYear();
                  const temRecompensa = diaEstaEmSemanaRecompensada(dataFormatada);

                  return (
                    <button
                      key={`${ano}-${mes}-${dia}`}
                      type="button"
                      onClick={() => {
                        // If clicking on a day from another month, navigate to that month first
                        if (!mesAtual) {
                          setCalendarioTreino({ mes, ano });
                        }
                        // Always use the correct month and year for the clicked day
                        selecionarDiaTreino(dia, mes, ano);
                      }}
                      className={`relative h-14 sm:h-20 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center justify-center p-1 sm:p-2 overflow-hidden
                        ${!mesAtual 
                          ? (modoNoturno 
                              ? 'opacity-40 border-slate-700' 
                              : 'opacity-50 border-gray-300')
                          : ''
                        }
                        ${isHoje 
                          ? (modoNoturno ? 'border-rose-400 bg-rose-900/30' : 'border-rose-400 bg-rose-50')
                          : (modoNoturno 
                              ? 'border-slate-600 hover:border-rose-400' 
                              : 'border-gray-200 hover:border-rose-300')
                        }
                        ${temTreinos 
                          ? (modoNoturno 
                              ? 'bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-rose-900/30' 
                              : 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50')
                          : (modoNoturno ? 'bg-slate-700/50' : 'bg-white')
                        }
                      `}
                      aria-label={`${dia} de ${meses[mes]}${temRecompensa ? ', dia recompensado' : ''}${temTreinos ? `, ${treinosDoDia.length} treino(s)` : ''}${!mesAtual ? ' (outro mês)' : ''}`}
                    >
                      {/* Indicador de Recompensa - Only show on days with training */}
                      {temRecompensa && temTreinos && (
                        <div 
                          className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 z-10"
                          title="Dia recompensado"
                          aria-hidden="true"
                        >
                          <Award 
                            size={12} 
                            className="text-amber-500 drop-shadow-sm sm:w-4 sm:h-4" 
                            fill="currentColor"
                          />
                        </div>
                      )}
                      
                      <span className={`relative z-10 text-sm sm:text-base font-semibold mb-0.5 ${
                        !mesAtual 
                          ? (modoNoturno ? 'text-slate-500' : 'text-gray-400')
                          : (isHoje 
                              ? (modoNoturno ? 'text-rose-400' : 'text-rose-600')
                              : (modoNoturno ? 'text-slate-200' : 'text-gray-700'))
                      }`}>
                        {dia}
                      </span>
                      
                      {temTreinos && (
                        <div className="relative z-10 flex items-center justify-center w-full mt-0.5">
                          {renderWorkoutIcons(treinosDoDia)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Legenda */}
            <div className={`flex gap-6 justify-center mt-6 p-4 rounded-xl ${
              modoNoturno 
                ? 'bg-gradient-to-br from-rose-900/30 to-purple-900/30' 
                : 'bg-gradient-to-br from-rose-50 to-purple-50'
            }`}>
              {Object.entries(TIPOS_TREINO).map(([key, tipo]) => (
                <div key={key} className="flex items-center gap-2">
                  {key === 'cardio' ? (
                    <Activity size={16} style={{ color: tipo.cor }} />
                  ) : (
                    <Dumbbell size={16} style={{ color: tipo.cor }} />
                  )}
                  <span className={`text-sm font-semibold ${
                    modoNoturno ? 'text-slate-200' : 'text-gray-700'
                  }`}>{tipo.nome}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Modal de Estatísticas */}
          {mostrarEstatisticas && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-3xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                modoNoturno 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
                  : 'bg-gradient-to-br from-white to-blue-50'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-2xl font-bold flex items-center gap-2 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                    <PieChart className={modoNoturno ? 'text-blue-400' : 'text-blue-600'} size={32} />
                    Estatísticas do Mês
                  </h2>
                  <button
                    type="button"
                    onClick={toggleEstatisticas}
                    className={`p-2 rounded-full transition-colors ${
                      modoNoturno 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <p className={`mb-6 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                  {meses[calendarioTreino.mes]} {calendarioTreino.ano}
                </p>
                
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {/* Dias de Treino */}
                  <div className={`p-4 rounded-xl ${
                    modoNoturno 
                      ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30' 
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      modoNoturno ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      Dias de Treino
                    </p>
                    <p className={`text-3xl font-bold ${
                      modoNoturno ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {estatisticas.diasComTreino}
                    </p>
                    <p className={`text-xs ${
                      modoNoturno ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      de {diasNoMes} dias
                    </p>
                  </div>
                  
                  {/* Total de Treinos */}
                  <div className={`p-4 rounded-xl ${
                    modoNoturno 
                      ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30' 
                      : 'bg-gradient-to-br from-purple-50 to-pink-50'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      modoNoturno ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      Total de Treinos
                    </p>
                    <p className={`text-3xl font-bold ${
                      modoNoturno ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {estatisticas.totalTreinos}
                    </p>
                    <p className={`text-xs ${
                      modoNoturno ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      {estatisticas.tiposContagem.cardio || 0} cardio, {estatisticas.tiposContagem.intensidade || 0} intensidade
                    </p>
                  </div>
                  
                  {/* Média por Semana */}
                  <div className={`p-4 rounded-xl ${
                    modoNoturno 
                      ? 'bg-gradient-to-br from-rose-900/30 to-orange-900/30' 
                      : 'bg-gradient-to-br from-rose-50 to-orange-50'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      modoNoturno ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      Média por Semana
                    </p>
                    <p className={`text-3xl font-bold ${
                      modoNoturno ? 'text-rose-400' : 'text-rose-600'
                    }`}>
                      {estatisticas.mediaPorSemana}
                    </p>
                    <p className={`text-xs ${
                      modoNoturno ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      dias de treino
                    </p>
                  </div>
                </div>
                
                {/* Mini Donut Chart */}
                {chartData.length > 0 && (
                  <div className="mt-4">
                    <h3 className={`text-lg font-semibold mb-3 ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      Distribuição de Treinos
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPie>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-2">
                      {(estatisticas.tiposContagem.cardio || 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <Activity size={16} style={{ color: TIPOS_TREINO.cardio.cor }} />
                          <span className={`text-sm font-semibold ${
                            modoNoturno ? 'text-slate-200' : 'text-gray-700'
                          }`}>
                            Cardio: {estatisticas.tiposContagem.cardio || 0}
                          </span>
                        </div>
                      )}
                      {(estatisticas.tiposContagem.intensidade || 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <Dumbbell size={16} style={{ color: TIPOS_TREINO.intensidade.cor }} />
                          <span className={`text-sm font-semibold ${
                            modoNoturno ? 'text-slate-200' : 'text-gray-700'
                          }`}>
                            Intensidade: {estatisticas.tiposContagem.intensidade || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Modal de Recompensas */}
          {mostrarRecompensas && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-3xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                modoNoturno 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
                  : 'bg-gradient-to-br from-white to-amber-50'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-2xl font-bold flex items-center gap-2 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                    <Award className={modoNoturno ? 'text-amber-400' : 'text-amber-500'} size={32} />
                    Sistema de Recompensas
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarRecompensas(false);
                      setSemanaSelecionadaRecompensa(null);
                      setDiasMarcadosRecompensa({});
                      setTentativasRecompensa(0);
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      modoNoturno 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <p className={`mb-4 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                  Acompanhe seus treinos e ganhe recompensas mantendo a consistência!
                </p>
                
                {/* Seletor de Semana */}
                <div className={`p-4 rounded-xl border-2 mb-4 ${
                  modoNoturno 
                    ? 'bg-blue-900/30 border-blue-700' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-sm font-semibold ${modoNoturno ? 'text-slate-200' : 'text-gray-800'}`}>
                      📅 Semana Selecionada:
                    </p>
                    <button
                      onClick={() => setMostrarSeletorData(!mostrarSeletorData)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Selecionar Outra Semana
                    </button>
                  </div>
                  <p className={modoNoturno ? 'text-slate-200' : 'text-gray-700'}>
                    {semanaSelecionadaRecompensa 
                      ? `${obterSemanaAtual()[0].dataFormatada} - ${obterSemanaAtual()[6].dataFormatada}`
                      : 'Semana atual'}
                  </p>
                  {!verificarSemanaCompleta(obterSemanaAtual()).completa && (
                    <p className={`text-xs mt-2 ${modoNoturno ? 'text-amber-400' : 'text-amber-600'}`}>
                      ⚠️ Esta semana tem apenas {verificarSemanaCompleta(obterSemanaAtual()).diasNoMes} dias no mês corrente
                    </p>
                  )}
                </div>
                
                {/* Calendário compacto para seleção de data */}
                {mostrarSeletorData && (
                  <div className={`border-2 rounded-xl p-4 mb-4 shadow-lg ${
                    modoNoturno 
                      ? 'bg-slate-800 border-slate-600' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <h3 className={`text-sm font-bold mb-3 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>Selecione um dia para ver sua semana:</h3>
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => mudarMesTreino(-1)}
                        className={`p-2 rounded-full ${modoNoturno ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                      >
                        ←
                      </button>
                      <span className={`font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                        {meses[calendarioTreino.mes]} {calendarioTreino.ano}
                      </span>
                      <button
                        type="button"
                        onClick={() => mudarMesTreino(1)}
                        className={`p-2 rounded-full ${modoNoturno ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                      >
                        →
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {diasSemana.map(dia => (
                        <div key={dia} className={`text-center text-xs font-bold ${modoNoturno ? 'text-slate-400' : 'text-gray-600'}`}>
                          {dia}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: getPrimeiroDiaSemana(calendarioTreino.mes, calendarioTreino.ano) }).map((_, i) => (
                        <div key={`vazio-${i}`} className="h-8"></div>
                      ))}
                      {Array.from({ length: getDiasNoMes(calendarioTreino.mes, calendarioTreino.ano) }).map((_, index) => {
                        const dia = index + 1;
                        const dataParaSemana = new Date(calendarioTreino.ano, calendarioTreino.mes, dia);
                        const temTreinoNaSemana = semanaTemTreino(dataParaSemana);
                        
                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => temTreinoNaSemana && selecionarDataParaSemana(dia, calendarioTreino.mes, calendarioTreino.ano)}
                            disabled={!temTreinoNaSemana}
                            className={`h-8 rounded-lg border text-sm transition-all ${
                              temTreinoNaSemana 
                                ? modoNoturno 
                                  ? 'hover:bg-blue-900/30 hover:border-blue-400 cursor-pointer border-slate-600' 
                                  : 'hover:bg-blue-100 hover:border-blue-400 cursor-pointer' 
                                : modoNoturno 
                                  ? 'opacity-30 cursor-not-allowed border-slate-700' 
                                  : 'opacity-30 cursor-not-allowed border-gray-300'
                            } ${modoNoturno ? 'text-slate-200' : ''}`}
                            title={temTreinoNaSemana ? 'Selecionar esta semana' : 'Esta semana não possui treinos'}
                          >
                            {dia}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Dias da semana selecionada com treinos - INTERATIVO */}
                <div className="space-y-3 mb-6">
                  <h3 className={`text-lg font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                    Treinos da Semana Selecionada
                  </h3>
                  <p className={`text-xs mb-2 ${modoNoturno ? 'text-slate-400' : 'text-gray-600'}`}>
                    💡 Clique nos dias para marcar/desmarcar manualmente
                  </p>
                  {obterSemanaAtual().map((dia, index) => {
                    const estaMarcado = diaEstaMarcado(dia.dataFormatada);
                    const treinosDoDia = treinos.filter(t => t.data === dia.dataFormatada);
                    const temTreinoReal = treinosDoDia.length > 0;
                    const marcadoManualmente = Object.prototype.hasOwnProperty.call(diasMarcadosRecompensa, dia.dataFormatada);
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleDiaMarcado(dia.dataFormatada)}
                        className={`w-full p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                          estaMarcado 
                            ? modoNoturno 
                              ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-600' 
                              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                            : modoNoturno 
                              ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500' 
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              estaMarcado 
                                ? 'bg-green-500 text-white' 
                                : modoNoturno 
                                  ? 'bg-slate-600 text-slate-300' 
                                  : 'bg-gray-300 text-gray-600'
                            }`}>
                              {estaMarcado ? <Check size={20} /> : dia.diaSemana}
                            </div>
                            <div className="text-left">
                              <p className={`font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                                {dia.diaSemana} - {dia.dataFormatada}
                              </p>
                              {temTreinoReal && (
                                <p className={`text-sm ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                                  {treinosDoDia.length} treino(s): {treinosDoDia.map(t => t.subcategoria).join(', ')}
                                </p>
                              )}
                              {marcadoManualmente && !temTreinoReal && estaMarcado && (
                                <p className={`text-xs font-semibold ${modoNoturno ? 'text-blue-400' : 'text-blue-600'}`}>
                                  ✓ Marcado manualmente
                                </p>
                              )}
                              {marcadoManualmente && temTreinoReal && !estaMarcado && (
                                <p className={`text-xs font-semibold ${modoNoturno ? 'text-red-400' : 'text-red-600'}`}>
                                  ✗ Desmarcado manualmente
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Resumo e botão de recompensa */}
                <div className={`p-4 rounded-xl border-2 mb-4 ${
                  modoNoturno 
                    ? 'bg-amber-900/30 border-amber-700' 
                    : 'bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-300'
                }`}>
                  <p className={`text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-800'}`}>
                    📊 Resumo da Semana:
                  </p>
                  <p className={modoNoturno ? 'text-slate-200' : 'text-gray-700'}>
                    • Total de dias marcados: <strong>{obterSemanaAtual().filter(dia => diaEstaMarcado(dia.dataFormatada)).length}</strong> de {obterSemanaAtual().length}
                  </p>
                  <p className={modoNoturno ? 'text-slate-200' : 'text-gray-700'}>
                    • Dias de descanso: <strong>{obterSemanaAtual().length - obterSemanaAtual().filter(dia => diaEstaMarcado(dia.dataFormatada)).length}</strong>
                  </p>
                  <p className={`text-xs mt-2 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                    💡 Para ganhar recompensa: mínimo <strong>{calcularMinimoTreinos(obterSemanaAtual())}</strong> dias de treino
                    {!verificarSemanaCompleta(obterSemanaAtual()).completa && 
                      ` (ajustado para semana incompleta)`
                    }
                  </p>
                </div>
                
                <button
                  onClick={adicionarRecompensa}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Award size={24} />
                  {verificarSemanaJaRecompensada(obterSemanaAtual()) ? 'Atualizar Semana' : 'Reivindicar Recompensa'}
                </button>
              </div>
            </div>
          )}
          
          {/* Modal de Treinos Insuficientes */}
          {mostrarModalInsuficiente && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
              <div className={`rounded-3xl shadow-2xl p-6 max-w-md w-full ${
                modoNoturno ? 'bg-slate-800' : 'bg-white'
              }`}>
                <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                  <X className="text-red-500" size={28} />
                  Treinos Insuficientes
                </h3>
                <p className={`mb-6 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>{mensagemModalInsuficiente}</p>
                
                {tentativasRecompensa === 1 ? (
                  <div className="flex gap-3">
                    <button
                      onClick={fecharModalInsuficiente}
                      className={`flex-1 py-3 rounded-2xl font-bold transition-colors ${
                        modoNoturno 
                          ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Fechar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className={`text-sm font-semibold ${modoNoturno ? 'text-amber-400' : 'text-amber-600'}`}>
                      ⚠️ Segunda tentativa: Você pode conceder a recompensa manualmente
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={fecharModalInsuficiente}
                        className={`flex-1 py-3 rounded-2xl font-bold transition-colors ${
                          modoNoturno 
                            ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Fechar
                      </button>
                      <button
                        onClick={recompensarMesmoAssim}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-2xl font-bold hover:from-amber-600 hover:to-yellow-600 transition-colors"
                      >
                        Recompensar Mesmo Assim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formulário de Treino como Overlay/Modal */}
          {mostrarFormularioTreino && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-3xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                modoNoturno 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
                  : 'bg-gradient-to-br from-white to-purple-50'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-2xl font-bold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                    {treinoEditando ? 'Editar Treino' : 'Adicionar Treino'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormularioTreino(false);
                      setTreinoEditando(null);
                      setFormularioTreino({
                        tipo: '',
                        subcategoria: '',
                        horario_inicio: '',
                        horario_fim: '',
                        distancia: '',
                        observacoes: ''
                      });
                      setExercicios([]);
                      setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      modoNoturno 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className={`mb-6 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>Data: {dataSelecionadaTreino}</p>

                <div className="space-y-4">
                  {/* Tipo de Treino */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                      Tipo de Treino
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(TIPOS_TREINO).map(([key, tipo]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleMudarTipoTreino(key)}
                          className={`p-4 rounded-2xl border-2 transition-all ${
                            formularioTreino.tipo === key
                              ? 'border-current shadow-md'
                              : modoNoturno 
                                ? 'border-slate-600 hover:border-slate-500' 
                                : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{
                            color: formularioTreino.tipo === key ? tipo.cor : (modoNoturno ? '#cbd5e1' : '#666'),
                            backgroundColor: formularioTreino.tipo === key ? `${tipo.cor}10` : (modoNoturno ? '#334155' : 'white')
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
                      <label className={`block text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                        Subcategoria
                      </label>
                      <select
                        value={formularioTreino.subcategoria}
                        onChange={(e) => setFormularioTreino({ ...formularioTreino, subcategoria: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-lg ${
                          modoNoturno 
                            ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-rose-400' 
                            : 'border-gray-300 focus:border-rose-400'
                        }`}
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
                    <div className={`p-4 rounded-xl border-2 ${
                      modoNoturno 
                        ? 'bg-purple-900/30 border-purple-700' 
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                    }`}>
                      <h3 className={`text-lg font-bold mb-3 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>Exercícios</h3>
                      
                      {/* Lista de exercícios adicionados */}
                      {exercicios.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {exercicios.map((ex, index) => (
                            <div key={index} className={`p-3 rounded-lg flex justify-between items-center ${
                              modoNoturno ? 'bg-slate-800' : 'bg-white'
                            }`}>
                              <div>
                                <span className={`font-semibold ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>{ex.nome}</span>
                                <span className={`text-sm ml-2 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                                  {ex.repeticoes && `${ex.repeticoes} reps`}
                                  {ex.repeticoes && ex.duracao && ' | '}
                                  {ex.duracao && `${ex.duracao} seg`}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removerExercicio(index)}
                                className={`p-1 rounded-full transition-colors ${
                                  modoNoturno 
                                    ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' 
                                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                }`}
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
                          <label className={`block text-sm font-semibold mb-1 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                            Nome do Exercício
                          </label>
                          <input
                            type="text"
                            value={exercicioAtual.nome}
                            onChange={(e) => setExercicioAtual({ ...exercicioAtual, nome: e.target.value })}
                            placeholder="Ex: Prancha, Abdominais..."
                            className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                              modoNoturno 
                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-purple-400' 
                                : 'border-gray-300 focus:border-purple-400'
                            }`}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-sm font-semibold mb-1 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                              Repetições
                            </label>
                            <input
                              type="number"
                              value={exercicioAtual.repeticoes}
                              onChange={(e) => setExercicioAtual({ ...exercicioAtual, repeticoes: e.target.value })}
                              placeholder="Ex: 15"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                                modoNoturno 
                                  ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-purple-400' 
                                  : 'border-gray-300 focus:border-purple-400'
                              }`}
                            />
                          </div>
                          
                          <div>
                            <label className={`block text-sm font-semibold mb-1 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                              Duração (segundos)
                            </label>
                            <input
                              type="number"
                              value={exercicioAtual.duracao}
                              onChange={(e) => setExercicioAtual({ ...exercicioAtual, duracao: e.target.value })}
                              placeholder="Ex: 60"
                              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                                modoNoturno 
                                  ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-purple-400' 
                                  : 'border-gray-300 focus:border-purple-400'
                              }`}
                            />
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={adicionarExercicio}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Adicionar Exercício
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Horário de Início, Fim e Distância - Não mostrar para funcional */}
                  {formularioTreino.subcategoria && formularioTreino.subcategoria !== 'Funcional' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                          Horário de Início
                        </label>
                        <input
                          type="time"
                          value={formularioTreino.horario_inicio}
                          onChange={(e) => setFormularioTreino({ ...formularioTreino, horario_inicio: e.target.value })}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-lg ${
                            modoNoturno 
                              ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-rose-400' 
                              : 'border-gray-300 focus:border-rose-400'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                          Horário de Fim
                        </label>
                        <input
                          type="time"
                          value={formularioTreino.horario_fim}
                          onChange={(e) => setFormularioTreino({ ...formularioTreino, horario_fim: e.target.value })}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-lg ${
                            modoNoturno 
                              ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-rose-400' 
                              : 'border-gray-300 focus:border-rose-400'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                          Distância (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formularioTreino.distancia}
                          onChange={(e) => setFormularioTreino({ ...formularioTreino, distancia: e.target.value })}
                          placeholder="Ex: 5.5"
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-lg ${
                            modoNoturno 
                              ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-rose-400' 
                              : 'border-gray-300 focus:border-rose-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar duração calculada se ambos horários estiverem preenchidos */}
                  {formularioTreino.horario_inicio && formularioTreino.horario_fim && (
                    <div className={`p-3 rounded-lg border-2 ${
                      modoNoturno 
                        ? 'bg-purple-900/30 border-purple-700' 
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                    }`}>
                      <p className={`text-sm font-semibold ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                        Duração calculada: <span className={modoNoturno ? 'text-purple-400' : 'text-purple-600'}>{calcularDuracao(formularioTreino.horario_inicio, formularioTreino.horario_fim)} minutos</span>
                      </p>
                    </div>
                  )}

                  {/* Observações */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                      Observações (opcional)
                    </label>
                    <textarea
                      value={formularioTreino.observacoes}
                      onChange={(e) => setFormularioTreino({ ...formularioTreino, observacoes: e.target.value })}
                      placeholder="Ex: Treino intenso, boa recuperação..."
                      rows="3"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-lg ${
                        modoNoturno 
                          ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-rose-400' 
                          : 'border-gray-300 focus:border-rose-400'
                      }`}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={treinoEditando ? salvarEdicaoTreino : adicionarTreino}
                      className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-2xl font-bold text-lg hover:from-rose-600 hover:to-pink-600 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <Save size={20} />
                      {treinoEditando ? 'Salvar Alterações' : 'Adicionar Treino'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarFormularioTreino(false);
                        setTreinoEditando(null);
                        setFormularioTreino({
                          tipo: '',
                          subcategoria: '',
                          horario_inicio: '',
                          horario_fim: '',
                          distancia: '',
                          observacoes: ''
                        });
                        setExercicios([]);
                        setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
                      }}
                      className={`px-6 py-3 border-2 rounded-2xl font-bold text-lg transition-colors ${
                        modoNoturno 
                          ? 'border-slate-600 text-slate-200 hover:bg-slate-700' 
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
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
            <div className={`rounded-3xl shadow-xl p-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-4 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                Treinos de {dataSelecionadaTreino}
              </h2>
              
              {getTreinosNaData(
                parseInt(dataSelecionadaTreino.split('/')[0]),
                parseInt(dataSelecionadaTreino.split('/')[1]) - 1,
                parseInt(dataSelecionadaTreino.split('/')[2])
              ).length === 0 ? (
                <p className={`text-center py-8 ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>Nenhum treino registrado neste dia.</p>
              ) : (
                <div className="space-y-4">
                  {getTreinosNaData(
                    parseInt(dataSelecionadaTreino.split('/')[0]),
                    parseInt(dataSelecionadaTreino.split('/')[1]) - 1,
                    parseInt(dataSelecionadaTreino.split('/')[2])
                  ).map((treino) => (
                    <div
                      key={treino.id}
                      className={`border-2 rounded-2xl p-4 hover:shadow-md transition-all ${
                        modoNoturno ? 'border-slate-600 bg-slate-700/50' : 'border-gray-200'
                      }`}
                      style={{ borderLeftWidth: '6px', borderLeftColor: TIPOS_TREINO[treino.tipo]?.cor }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`text-xl font-bold mb-2 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
                            {treino.subcategoria}
                          </h3>
                          <p className={`text-sm mb-2 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                            Tipo: <span className="font-semibold">{TIPOS_TREINO[treino.tipo]?.nome}</span>
                          </p>
                          
                          {/* Display exercises for functional training */}
                          {treino.subcategoria === 'Funcional' && treino.exercicios && treino.exercicios.length > 0 && (
                            <div className={`mt-3 p-3 rounded-lg ${
                              modoNoturno 
                                ? 'bg-purple-900/30 border border-purple-700' 
                                : 'bg-gradient-to-br from-purple-50 to-pink-50'
                            }`}>
                              <p className={`text-sm font-semibold mb-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>Exercícios:</p>
                              <ul className="space-y-1">
                                {treino.exercicios.map((ex, idx) => (
                                  <li key={idx} className={`text-sm flex items-center gap-2 ${modoNoturno ? 'text-slate-200' : 'text-gray-700'}`}>
                                    <Check size={14} className={modoNoturno ? 'text-purple-400' : 'text-purple-600'} />
                                    <span className="font-medium">{ex.nome}</span>
                                    <span className={modoNoturno ? 'text-slate-300' : 'text-gray-600'}>
                                      {ex.repeticoes && `${ex.repeticoes} reps`}
                                      {ex.repeticoes && ex.duracao && ' | '}
                                      {ex.duracao && `${ex.duracao} seg`}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {treino.horario_inicio && treino.horario_fim && (
                            <>
                              <p className={`text-sm ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                                Horário: <span className="font-semibold">{treino.horario_inicio} - {treino.horario_fim}</span>
                              </p>
                              {treino.duracao && (
                                <p className={`text-sm ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                                  Duração: <span className="font-semibold">{treino.duracao} minutos</span>
                                </p>
                              )}
                            </>
                          )}
                          {!treino.horario_inicio && !treino.horario_fim && treino.duracao && (
                            <p className={`text-sm ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                              Duração: <span className="font-semibold">{treino.duracao} minutos</span>
                            </p>
                          )}
                          {treino.distancia && (
                            <p className={`text-sm ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                              Distância: <span className="font-semibold">{treino.distancia} km</span>
                            </p>
                          )}
                          {treino.observacoes && (
                            <p className={`text-sm mt-2 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                              <span className="font-semibold">Obs:</span> {treino.observacoes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editarTreino(treino)}
                            className={`p-2 rounded-full transition-colors ${
                              modoNoturno 
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30' 
                                : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                            }`}
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirTreino(treino.id)}
                            className={`p-2 rounded-full transition-colors ${
                              modoNoturno 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' 
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            }`}
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
                type="button"
                onClick={() => {
                  setMostrarFormularioTreino(true);
                  setFormularioTreino({
                    tipo: '',
                    subcategoria: '',
                    horario_inicio: '',
                    horario_fim: '',
                    distancia: '',
                    observacoes: ''
                  });
                  setExercicios([]);
                  setExercicioAtual({ nome: '', repeticoes: '', duracao: '' });
                  setTreinoEditando(null);
                }}
                className="w-full mt-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-2xl font-bold text-lg hover:from-rose-600 hover:to-pink-600 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
    <div className={`min-h-screen p-4 ${
      modoNoturno ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setTela('inicial')}
          className={`mb-6 flex items-center gap-2 px-6 py-3 rounded-full shadow hover:shadow-md transition-all ${
            modoNoturno ? 'bg-slate-700 text-slate-100' : 'bg-white'
          }`}
        >
          <Home size={20} />
          Voltar para Início
        </button>

        {/* Filtros e Download */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${
              modoNoturno ? 'text-slate-100' : 'text-gray-800'
            }`}>
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
                <label className={`block text-sm font-semibold mb-2 ${
                  modoNoturno ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Ano
                </label>
                <select
                  value={anoFiltro}
                  onChange={(e) => setAnoFiltro(parseInt(e.target.value))}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    modoNoturno 
                      ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-400' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
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
                <div className={`w-full p-4 rounded-lg border-2 ${
                  modoNoturno 
                    ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700' 
                    : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                }`}>
                  <p className={`text-sm font-semibold ${
                    modoNoturno ? 'text-slate-300' : 'text-gray-600'
                  }`}>Total do Período</p>
                  <p className={`text-2xl font-bold ${
                    modoNoturno ? 'text-green-400' : 'text-green-600'
                  }`}>
                    R$ {calcularTotal(transferenciasFiltradas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de Meses */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className={`block text-sm font-semibold ${
                  modoNoturno ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Selecione os meses (pode escolher vários)
                </label>
                {mesesSelecionados.length > 0 && (
                  <button
                    onClick={limparSelecaoMeses}
                    className={`text-sm font-semibold ${
                      modoNoturno ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'
                    }`}
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
                            : (modoNoturno 
                                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
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
          <div className={`rounded-2xl shadow-xl p-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
              modoNoturno ? 'text-slate-100' : 'text-gray-800'
            }`}>
              <PieChart size={24} className={modoNoturno ? 'text-blue-400' : 'text-blue-600'} />
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
                      <span className={`text-sm font-semibold ${modoNoturno ? 'text-slate-200' : ''}`}>
                        {item.name}
                      </span>
                      <span className={`text-sm ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className={`text-center py-12 ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>
                Nenhum dado disponível para o período selecionado
              </p>
            )}
          </div>

          {/* Gráfico de Linha */}
          <div className={`rounded-2xl shadow-xl p-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
              modoNoturno ? 'text-slate-100' : 'text-gray-800'
            }`}>
              <TrendingUp size={24} className={modoNoturno ? 'text-blue-400' : 'text-blue-600'} />
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
        <div className={`rounded-2xl shadow-xl p-6 ${modoNoturno ? 'bg-slate-800/90' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${modoNoturno ? 'text-slate-100' : 'text-gray-800'}`}>
            Histórico de Transferências
          </h2>

          {transferenciasFiltradas.length === 0 ? (
            <p className={`text-center py-8 ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>
              Nenhuma transferência encontrada no período selecionado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b-2 ${modoNoturno ? 'border-slate-600' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>Data</th>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>Valor</th>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>Tipo</th>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>Descrição</th>
                    <th className={`text-left py-3 px-4 font-semibold ${
                      modoNoturno ? 'text-slate-200' : 'text-gray-700'
                    }`}>Registrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {transferenciasFiltradas.map((t) => (
                    <tr key={t.id} className={`border-b ${
                      modoNoturno 
                        ? 'border-slate-700 hover:bg-slate-700/50' 
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <td className={`py-3 px-4 ${modoNoturno ? 'text-slate-200' : ''}`}>{t.data}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">R$ {t.valor}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${t.tipo === 'especie'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                          {t.tipo === 'especie' ? 'Em Espécie' : 'Digital'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${modoNoturno ? 'text-slate-300' : 'text-gray-600'}`}>
                        {t.descricao || '-'}
                      </td>
                      <td className={`py-3 px-4 text-sm ${modoNoturno ? 'text-slate-400' : 'text-gray-500'}`}>
                        {t.dataRegistro}
                      </td>
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
