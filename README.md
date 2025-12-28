# controle-transferencias

Sistema completo para controle de transferências e acompanhamento de treinos.

## Funcionalidades

### 💰 Transferências
- Adicionar transferências com data, valor e tipo (Em Espécie ou Digital)
- Visualizar histórico completo com gráficos
- Filtrar por ano e meses
- Exportar planilhas em CSV
- Gráficos de pizza e linha para análise

### 🏋️ Treino (Novo!)
- Calendário interativo para acompanhamento de treinos
- Dois tipos de treino:
  - **Cardio**: Caminhada, Corrida, Natação, Ciclismo, Elíptico
  - **Intensidade**: Musculação, CrossFit, HIIT, Funcional, Calistenia
- Adicionar múltiplos treinos por dia
- Registrar duração, distância e observações
- Editar e excluir treinos
- Indicadores visuais coloridos no calendário

## Configuração

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o Supabase (veja `SETUP_INSTRUCTIONS.md`)
4. Execute o projeto: `npm run dev`

Para instruções detalhadas de setup da funcionalidade de treino, consulte o arquivo `SETUP_INSTRUCTIONS.md`.
