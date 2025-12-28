const content = document.getElementById('content');

// Recupera transferências do localStorage ou inicializa com uma lista vazia
const getTransferencias = () => JSON.parse(localStorage.getItem('transferencias')) || [];

// Salva as transferências no localStorage
const saveTransferencias = (transferencias) =>
  localStorage.setItem('transferencias', JSON.stringify(transferencias));

// Mostra a lista de transferências
const showTransferencias = () => {
  const transferencias = getTransferencias();
  content.innerHTML = `
    <h2>Histórico de Transferências</h2>
    <div id="historico">
      ${transferencias.length
        ? transferencias
            .map(
              (t, index) => `
        <div class="transfer">
          <span>${t.descricao}</span>
          <span>R$ ${t.valor.toFixed(2)}</span>
          <button onclick="deleteTransferencia(${index})">Excluir</button>
        </div>
      `
            )
            .join('')
        : '<p>Nenhuma transferência registrada.</p>'}
    </div>
    <h3>Adicionar Nova Transferência</h3>
    <form id="formAdicionar">
      <input type="text" id="descricao" placeholder="Descrição" required />
      <input type="number" id="valor" placeholder="Valor (R$)" step="0.01" required />
      <button type="submit">Adicionar</button>
    </form>
  `;

  // Adiciona evento ao formulário para salvar nova transferência
  document.getElementById('formAdicionar').addEventListener('submit', (e) => {
    e.preventDefault();
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    if (descricao && valor) {
      const novasTransferencias = [...transferencias, { descricao, valor }];
      saveTransferencias(novasTransferencias);
      showTransferencias();
    }
  });
};

// Exclui uma transferência
const deleteTransferencia = (index) => {
  const transferencias = getTransferencias();
  transferencias.splice(index, 1);
  saveTransferencias(transferencias);
  showTransferencias();
};

// Mostra a tela de treino
const showTreino = () => {
  content.innerHTML = `
    <h2>Treinos</h2>
    <p>Ainda em construção...</p>
  `;
};

// Configura eventos dos botões principais
document.getElementById('btnTransferencias').addEventListener('click', showTransferencias);
document.getElementById('btnTreino').addEventListener('click', showTreino);