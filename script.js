/* =========================================================
   ARMAZENAMENTO LOCAL
   Serve para guardar trilhas e aulas no navegador do usuário,
   mantendo o progresso mesmo ao fechar a página.
   ========================================================= */
const CHAVE_STORAGE = 'studyflix-dados-pt-v1';

/* =========================================================
   IMAGENS PADRÃO
   Servem para preencher automaticamente a imagem da trilha
   quando o usuário não informar uma URL.
   ========================================================= */
const IMAGEM_PADRAO =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';

const IMAGENS_CATEGORIA = {
  programacao:
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  design:
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  ciber:
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  qa:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  dados:
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  outros: IMAGEM_PADRAO
};

const NOMES_CATEGORIA = {
  programacao: 'Programação',
  design: 'Design',
  ciber: 'Cibersegurança',
  qa: 'QA e Testes',
  dados: 'Ciência de Dados',
  outros: 'Outros'
};

const ICONES_CATEGORIA = {
  programacao: 'fa-code',
  design: 'fa-paint-brush',
  ciber: 'fa-shield-alt',
  qa: 'fa-vial',
  dados: 'fa-chart-bar',
  outros: 'fa-ellipsis-h'
};

/* =========================================================
   DADOS INICIAIS
   Servem para o app iniciar com exemplos na primeira vez.
   ========================================================= */
const dadosPadrao = [
  {
    id: 'trilha-js',
    nome: 'JavaScript Moderno',
    categoria: 'programacao',
    imagem: IMAGENS_CATEGORIA.programacao,
    cor: '#F0DB4F',
    criadoEm: new Date().toISOString(),
    aulas: [
      {
        id: 'aula-1',
        titulo: 'Introdução ao ES6+',
        url: 'https://youtube.com/watch?v=example1',
        status: 'concluida',
        marcador: '15:30 - Conceitos básicos de ES6'
      },
      {
        id: 'aula-2',
        titulo: 'Async/Await e Promises',
        url: 'https://youtube.com/watch?v=example2',
        status: 'andamento',
        marcador: '22:10 - Trabalhando com async/await'
      }
    ]
  }
];

/* =========================================================
   ESTADO DA APLICAÇÃO
   Serve para controlar trilha selecionada, filtros e edição.
   ========================================================= */
let trilhas = carregarDoStorage();
let idTrilhaAtual = null;              // trilha aberta no modal de detalhes
let indiceAulaAtual = null;            // aula em edição (se existir)
let filtroAtivo = 'todas';             // todas | andamento | concluidas
let termoBusca = '';                   // texto digitado na busca
let callbackConfirmacao = null;        // ação confirmada no modal
let edicaoMarcador = null;             // { idTrilha, idAula } para editar “onde parei”

/* =========================================================
   INICIALIZAÇÃO
   Serve para ligar os eventos e renderizar a interface.
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  configurarEventos();
  renderizarTrilhas();
  atualizarContadorTrilhas();
  configurarBarraRolagem();
});

/* =========================================================
   EVENTOS GERAIS
   Servem para interações de botões, filtros e modais.
   ========================================================= */
function configurarEventos() {
  // Botões do banner
  document.getElementById('botaoNovaTrilha').addEventListener('click', () => abrirModal('modalNovaTrilha'));
  document.getElementById('botaoExplorar').addEventListener('click', () => document.getElementById('entradaBusca').focus());

  // Busca
  document.getElementById('entradaBusca').addEventListener('input', (e) => {
    termoBusca = e.target.value.toLowerCase().trim();
    renderizarTrilhas();
    atualizarContadorTrilhas();
  });
  document.getElementById('botaoBusca').addEventListener('click', () => {
    termoBusca = document.getElementById('entradaBusca').value.toLowerCase().trim();
    renderizarTrilhas();
    atualizarContadorTrilhas();
  });

  // Filtros
  document.querySelectorAll('.botao-filtro').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.botao-filtro').forEach((b) => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      filtroAtivo = btn.dataset.filtro;
      renderizarTrilhas();
      atualizarContadorTrilhas();
    });
  });

  // Seletor de categoria (modal nova trilha)
  document.querySelectorAll('.opcao-categoria').forEach((op) => {
    op.addEventListener('click', () => {
      document.querySelectorAll('.opcao-categoria').forEach((o) => o.classList.remove('ativo'));
      op.classList.add('ativo');
      document.getElementById('categoriaTrilha').value = op.dataset.valor;
    });
  });

  // Seletor de status (modal aula)
  document.querySelectorAll('.opcao-status').forEach((op) => {
    op.addEventListener('click', () => {
      document.querySelectorAll('.opcao-status').forEach((o) => o.classList.remove('ativo'));
      op.classList.add('ativo');
      document.getElementById('statusAula').value = op.dataset.valor;
    });
  });

  // Cor (modal nova trilha)
  document.getElementById('corTrilha').addEventListener('input', (e) => {
    document.getElementById('valorCor').textContent = e.target.value;
  });

  // Salvar trilha
  document.getElementById('botaoSalvarTrilha').addEventListener('click', salvarNovaTrilha);

  // Salvar aula
  document.getElementById('botaoSalvarAula').addEventListener('click', salvarAula);

  // Fechar modais (botões X e Cancelar com data-fechar-modal)
  document.querySelectorAll('[data-fechar-modal]').forEach((btn) => {
    btn.addEventListener('click', () => fecharModal(btn.dataset.fecharModal));
  });

  // Fechar modal clicando fora (overlay)
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharModal(modal.id);
    });
  });

  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalAtivo = document.querySelector('.modal.ativo');
      if (modalAtivo) fecharModal(modalAtivo.id);
    }
  });

  // Modal confirmação
  document.getElementById('botaoCancelarConfirmacao').addEventListener('click', () => fecharModal('modalConfirmacao'));
  document.getElementById('botaoConfirmar').addEventListener('click', () => {
    if (typeof callbackConfirmacao === 'function') callbackConfirmacao();
    callbackConfirmacao = null;
    fecharModal('modalConfirmacao');
  });

  // Botões do modal detalhes
  document.getElementById('botaoNovaAulaNaTrilha').addEventListener('click', () => abrirModalAula(idTrilhaAtual));
  document.getElementById('botaoMarcarTodas').addEventListener('click', marcarTodasConcluidas);
  document.getElementById('botaoExcluirTrilha').addEventListener('click', () => {
    if (!idTrilhaAtual) return;
    mostrarConfirmacao('Tem certeza que deseja excluir esta trilha e todas as aulas?', () => {
      excluirTrilha(idTrilhaAtual);
      fecharModal('modalDetalhesTrilha');
    });
  });

  // Delegação de eventos (cards e aulas são criados dinamicamente)
  document.getElementById('containerTrilhas').addEventListener('click', tratarCliqueTrilha);
  document.getElementById('listaAulas').addEventListener('click', tratarCliqueAula);
}

/* =========================================================
   BARRA ROLAGEM (NAVBAR)
   Serve para realçar o menu ao rolar a página.
   ========================================================= */
function configurarBarraRolagem() {
  const barra = document.getElementById('barraNavegacao');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) barra.classList.add('rolado');
    else barra.classList.remove('rolado');
  });
}

/* =========================================================
   MODAIS
   Servem para mostrar/ocultar janelas e travar rolagem do body.
   ========================================================= */
function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  modal.classList.add('ativo');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Serve para facilitar o usuário começar a digitar rapidamente
  if (idModal === 'modalNovaTrilha') setTimeout(() => document.getElementById('nomeTrilha').focus(), 100);
  if (idModal === 'modalAula') setTimeout(() => document.getElementById('tituloAula').focus(), 100);
}

function fecharModal(idModal) {
  const modal = document.getElementById(idModal);
  modal.classList.remove('ativo');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'auto';

  // Serve para limpar os campos quando fecha
  if (idModal === 'modalNovaTrilha') limparFormularioTrilha();
  if (idModal === 'modalAula') limparFormularioAula();
  if (idModal === 'modalConfirmacao') callbackConfirmacao = null;

  // Serve para evitar estado preso da edição do marcador
  if (idModal === 'modalDetalhesTrilha') edicaoMarcador = null;
}

/* =========================================================
   CONFIRMAÇÃO
   Serve para reduzir erros em ações destrutivas.
   ========================================================= */
function mostrarConfirmacao(mensagem, aoConfirmar) {
  document.getElementById('mensagemConfirmacao').textContent = mensagem;
  callbackConfirmacao = aoConfirmar;
  abrirModal('modalConfirmacao');
}

/* =========================================================
   STORAGE
   Serve para persistir dados do usuário.
   ========================================================= */
function salvarNoStorage() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(trilhas));
}

function carregarDoStorage() {
  const bruto = localStorage.getItem(CHAVE_STORAGE);
  if (!bruto) return dadosPadrao;
  try {
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed : dadosPadrao;
  } catch {
    return dadosPadrao;
  }
}

/* =========================================================
   TRILHAS - CRIAÇÃO
   Serve para cadastrar e abrir a trilha recém-criada.
   ========================================================= */
function salvarNovaTrilha() {
  const nome = document.getElementById('nomeTrilha').value.trim();
  const categoria = document.getElementById('categoriaTrilha').value;
  const imagemInformada = document.getElementById('imagemTrilha').value.trim();
  const cor = document.getElementById('corTrilha').value;

  if (!nome) {
    alert('Por favor, informe o nome da trilha.');
    return;
  }

  const novaTrilha = {
    id: 'trilha-' + Date.now(),
    nome,
    categoria,
    imagem: imagemInformada || IMAGENS_CATEGORIA[categoria] || IMAGEM_PADRAO,
    cor,
    criadoEm: new Date().toISOString(),
    aulas: []
  };

  trilhas.push(novaTrilha);
  salvarNoStorage();

  fecharModal('modalNovaTrilha');
  renderizarTrilhas();
  atualizarContadorTrilhas();

  // Serve para o usuário já começar adicionando aulas
  setTimeout(() => abrirDetalhesTrilha(novaTrilha.id), 200);
}

function limparFormularioTrilha() {
  document.getElementById('nomeTrilha').value = '';
  document.getElementById('imagemTrilha').value = '';
  document.getElementById('corTrilha').value = '#E50914';
  document.getElementById('valorCor').textContent = '#E50914';

  // Serve para voltar ao padrão inicial
  document.querySelectorAll('.opcao-categoria').forEach((o) => o.classList.remove('ativo'));
  document.querySelector('.opcao-categoria[data-valor="programacao"]').classList.add('ativo');
  document.getElementById('categoriaTrilha').value = 'programacao';
}

/* =========================================================
   TRILHAS - EXCLUSÃO
   Serve para remover trilha e atualizar a interface.
   ========================================================= */
function excluirTrilha(idTrilha) {
  trilhas = trilhas.filter((t) => t.id !== idTrilha);
  salvarNoStorage();
  renderizarTrilhas();
  atualizarContadorTrilhas();
}

/* =========================================================
   AULAS - MODAL NOVA/EDITAR
   Serve para cadastrar ou atualizar aula na trilha.
   ========================================================= */
function abrirModalAula(idTrilha, indiceAula = null) {
  idTrilhaAtual = idTrilha;
  indiceAulaAtual = indiceAula;

  const titulo = document.getElementById('tituloModalAula');

  // Serve para diferenciar visualmente criação e edição
  if (indiceAula !== null) {
    titulo.innerHTML = '<i class="fas fa-edit"></i> Editar Aula';
    preencherFormularioAula(idTrilha, indiceAula);
  } else {
    titulo.innerHTML = '<i class="fas fa-plus-circle"></i> Nova Videoaula';
    limparFormularioAula();
  }

  abrirModal('modalAula');
}

function preencherFormularioAula(idTrilha, indiceAula) {
  const trilha = trilhas.find((t) => t.id === idTrilha);
  if (!trilha || !trilha.aulas[indiceAula]) return;

  const aula = trilha.aulas[indiceAula];
  document.getElementById('tituloAula').value = aula.titulo;
  document.getElementById('urlAula').value = aula.url;
  document.getElementById('marcadorAula').value = aula.marcador || '';
  document.getElementById('indiceAulaEdicao').value = String(indiceAula);

  // Serve para refletir o status selecionado
  document.querySelectorAll('.opcao-status').forEach((o) => o.classList.remove('ativo'));
  document.querySelector(`.opcao-status[data-valor="${aula.status}"]`).classList.add('ativo');
  document.getElementById('statusAula').value = aula.status;
}

function limparFormularioAula() {
  document.getElementById('tituloAula').value = '';
  document.getElementById('urlAula').value = '';
  document.getElementById('marcadorAula').value = '';
  document.getElementById('indiceAulaEdicao').value = '';

  document.querySelectorAll('.opcao-status').forEach((o) => o.classList.remove('ativo'));
  document.querySelector('.opcao-status[data-valor="andamento"]').classList.add('ativo');
  document.getElementById('statusAula').value = 'andamento';
}

/* =========================================================
   AULAS - SALVAR
   Serve para criar ou atualizar uma aula na trilha atual.
   ========================================================= */
function salvarAula() {
  if (!idTrilhaAtual) return;

  const titulo = document.getElementById('tituloAula').value.trim();
  const url = document.getElementById('urlAula').value.trim();
  const marcador = document.getElementById('marcadorAula').value.trim();
  const status = document.getElementById('statusAula').value;
  const indiceEdicao = document.getElementById('indiceAulaEdicao').value;

  if (!titulo || !url) {
    alert('Por favor, preencha o título e o link da aula.');
    return;
  }

  if (!urlValida(url)) {
    alert('Por favor, informe uma URL válida.');
    return;
  }

  const trilha = trilhas.find((t) => t.id === idTrilhaAtual);
  if (!trilha) return;

  // Serve para decidir entre criar uma nova aula ou atualizar uma existente
  if (indiceEdicao !== '') {
    const idx = Number(indiceEdicao);
    trilha.aulas[idx] = { ...trilha.aulas[idx], titulo, url, marcador, status };
  } else {
    trilha.aulas.push({
      id: 'aula-' + Date.now(),
      titulo,
      url,
      marcador,
      status
    });
  }

  salvarNoStorage();
  fecharModal('modalAula');

  // Serve para o usuário voltar automaticamente para os detalhes atualizados
  abrirDetalhesTrilha(idTrilhaAtual);
  renderizarTrilhas();
  atualizarContadorTrilhas();
}

/* =========================================================
   AULAS - AÇÕES (STATUS / EXCLUIR / MARCAR TODAS)
   Servem para atualizar progresso com poucos cliques.
   ========================================================= */
function alternarStatusAula(idTrilha, idAula) {
  const trilha = trilhas.find((t) => t.id === idTrilha);
  if (!trilha) return;

  const aula = trilha.aulas.find((a) => a.id === idAula);
  if (!aula) return;

  aula.status = (aula.status === 'concluida') ? 'andamento' : 'concluida';
  salvarNoStorage();

  abrirDetalhesTrilha(idTrilha);
  renderizarTrilhas();
  atualizarContadorTrilhas();
}

function marcarTodasConcluidas() {
  if (!idTrilhaAtual) return;

  const trilha = trilhas.find((t) => t.id === idTrilhaAtual);
  if (!trilha || trilha.aulas.length === 0) return;

  mostrarConfirmacao('Marcar todas as aulas como concluídas?', () => {
    trilha.aulas.forEach((a) => (a.status = 'concluida'));
    salvarNoStorage();
    abrirDetalhesTrilha(idTrilhaAtual);
    renderizarTrilhas();
    atualizarContadorTrilhas();
  });
}

function excluirAula(idTrilha, idAula) {
  mostrarConfirmacao('Tem certeza que deseja excluir esta aula?', () => {
    const trilha = trilhas.find((t) => t.id === idTrilha);
    if (!trilha) return;

    trilha.aulas = trilha.aulas.filter((a) => a.id !== idAula);
    salvarNoStorage();

    abrirDetalhesTrilha(idTrilha);
    renderizarTrilhas();
    atualizarContadorTrilhas();
  });
}

/* =========================================================
   “ONDE PAREI” - EDIÇÃO DIRETA
   Serve para atualizar o marcador sem abrir o modal da aula.
   ========================================================= */
function iniciarEdicaoMarcador(idTrilha, idAula) {
  edicaoMarcador = { idTrilha, idAula };
  abrirDetalhesTrilha(idTrilha);
}

function salvarMarcadorDireto(idTrilha, idAula) {
  const input = document.querySelector(`[data-input-marcador="${idAula}"]`);
  const valor = (input?.value || '').trim();

  const trilha = trilhas.find((t) => t.id === idTrilha);
  if (!trilha) return;

  const aula = trilha.aulas.find((a) => a.id === idAula);
  if (!aula) return;

  aula.marcador = valor;
  salvarNoStorage();
  edicaoMarcador = null;

  abrirDetalhesTrilha(idTrilha);
  renderizarTrilhas();
}

function cancelarEdicaoMarcador(idTrilha) {
  edicaoMarcador = null;
  abrirDetalhesTrilha(idTrilha);
}

/* =========================================================
   PROGRESSO
   Serve para calcular porcentagem concluída de uma trilha.
   ========================================================= */
function calcularProgresso(aulas) {
  if (!aulas || aulas.length === 0) return 0;
  const concluidas = aulas.filter((a) => a.status === 'concluida').length;
  return Math.round((concluidas / aulas.length) * 100);
}

/* =========================================================
   DATA “HUMANA”
   Serve para exibir “Hoje”, “Ontem”, etc.
   ========================================================= */
function formatarDataHumana(iso) {
  const data = new Date(iso);
  const agora = new Date();
  const diffMs = Math.abs(agora - data);
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 1) return 'Hoje';
  if (diffDias === 2) return 'Ontem';
  if (diffDias <= 7) return `${diffDias} dias atrás`;
  if (diffDias <= 30) return `${Math.floor(diffDias / 7)} semanas atrás`;
  return data.toLocaleDateString('pt-BR');
}

/* =========================================================
   RENDERIZAÇÃO DAS TRILHAS (LISTA PRINCIPAL)
   Serve para mostrar cards conforme filtro e busca.
   ========================================================= */
function renderizarTrilhas() {
  const container = document.getElementById('containerTrilhas');

  let lista = [...trilhas];

  // Filtro por progresso
  if (filtroAtivo === 'andamento') {
    lista = lista.filter((t) => calcularProgresso(t.aulas) < 100);
  } else if (filtroAtivo === 'concluidas') {
    lista = lista.filter((t) => t.aulas.length > 0 && calcularProgresso(t.aulas) === 100);
  }

  // Busca (nome, categoria, aulas)
  if (termoBusca) {
    lista = lista.filter((t) => {
      const nomeOk = t.nome.toLowerCase().includes(termoBusca);
      const catOk = (NOMES_CATEGORIA[t.categoria] || '').toLowerCase().includes(termoBusca);
      const aulaOk = (t.aulas || []).some((a) =>
        (a.titulo || '').toLowerCase().includes(termoBusca) ||
        (a.url || '').toLowerCase().includes(termoBusca) ||
        (a.marcador || '').toLowerCase().includes(termoBusca)
      );
      return nomeOk || catOk || aulaOk;
    });
  }

  // Ordenação: mais novas primeiro
  lista.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  if (lista.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio" style="grid-column: 1 / -1;">
        <i class="fas fa-search"></i>
        <h5>Nenhuma trilha encontrada</h5>
        <p>${termoBusca ? 'Nenhuma trilha corresponde à sua busca.' : 'Comece criando sua primeira trilha!'}</p>
        <button class="botao-primario" id="botaoCriarPrimeira" style="margin-top:20px;">
          <i class="fas fa-plus-circle"></i> Criar Primeira Trilha
        </button>
      </div>
    `;
    document.getElementById('botaoCriarPrimeira').addEventListener('click', () => abrirModal('modalNovaTrilha'));
    return;
  }

  container.innerHTML = lista.map((t) => {
    const progresso = calcularProgresso(t.aulas);
    const total = t.aulas.length;
    const concluidas = t.aulas.filter((a) => a.status === 'concluida').length;
    const categoriaNome = NOMES_CATEGORIA[t.categoria] || 'Categoria';
    const icone = ICONES_CATEGORIA[t.categoria] || 'fa-tag';

    return `
      <div class="card-trilha" data-acao="abrir-detalhes" data-id-trilha="${t.id}">
        <div class="imagem-trilha" style="background-image:url('${t.imagem}')">
          <div class="sobreposicao-trilha">
            <span class="badge-categoria-card">
              <i class="fas ${icone}"></i> ${categoriaNome}
            </span>
          </div>
        </div>

        <div class="conteudo-trilha">
          <h3 class="titulo-trilha">${t.nome}</h3>

          <div class="bloco-progresso-card">
            <div class="barra-progresso">
              <div class="preenchimento-progresso" style="width:${progresso}%"></div>
            </div>
            <div class="texto-progresso-card">${progresso}% concluído • ${formatarDataHumana(t.criadoEm)}</div>
          </div>

          <div class="estatisticas-trilha">
            <span><i class="fas fa-play-circle"></i> ${total} aulas</span>
            <span><i class="fas fa-check-circle"></i> ${concluidas} concluídas</span>
          </div>

          <div class="acoes-trilha-card">
            <button class="botao-primario botao-pequeno" data-acao="continuar" data-id-trilha="${t.id}" type="button">
              <i class="fas fa-play"></i> Continuar
            </button>
            <button class="botao-secundario botao-pequeno" data-acao="nova-aula" data-id-trilha="${t.id}" type="button">
              <i class="fas fa-plus"></i> Aula
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* =========================================================
   CLIQUES NO CARD (DELEGAÇÃO)
   Serve para abrir detalhes / abrir modal aula sem conflitos.
   ========================================================= */
function tratarCliqueTrilha(e) {
  const alvo = e.target.closest('[data-acao]');
  if (!alvo) {
    // clique no card sem botão
    const card = e.target.closest('.card-trilha');
    if (card) abrirDetalhesTrilha(card.dataset.idTrilha);
    return;
  }

  const acao = alvo.dataset.acao;
  const idTrilha = alvo.dataset.idTrilha;

  if (acao === 'continuar') {
    e.stopPropagation();
    abrirDetalhesTrilha(idTrilha);
  }

  if (acao === 'nova-aula') {
    e.stopPropagation();
    abrirModalAula(idTrilha);
  }

  if (acao === 'abrir-detalhes') {
    abrirDetalhesTrilha(idTrilha);
  }
}

/* =========================================================
   DETALHES DA TRILHA
   Serve para preencher modal com progresso e lista de aulas.
   ========================================================= */
function abrirDetalhesTrilha(idTrilha) {
  idTrilhaAtual = idTrilha;

  const trilha = trilhas.find((t) => t.id === idTrilha);
  if (!trilha) return;

  const progresso = calcularProgresso(trilha.aulas);
  const total = trilha.aulas.length;
  const concluidas = trilha.aulas.filter((a) => a.status === 'concluida').length;
  const categoriaNome = NOMES_CATEGORIA[trilha.categoria] || 'Categoria';
  const icone = ICONES_CATEGORIA[trilha.categoria] || 'fa-tag';

  document.getElementById('tituloDetalhesTrilha').textContent = trilha.nome;
  document.getElementById('imagemDetalhesTrilha').style.backgroundImage = `url('${trilha.imagem}')`;
  document.getElementById('preenchimentoProgresso').style.width = `${progresso}%`;
  document.getElementById('textoProgresso').textContent = `Criado ${formatarDataHumana(trilha.criadoEm)} • ${progresso}% concluído`;
  document.getElementById('totalAulas').textContent = total;
  document.getElementById('aulasConcluidas').textContent = concluidas;
  document.getElementById('badgeCategoria').innerHTML = `<i class="fas ${icone}"></i> ${categoriaNome}`;

  renderizarAulas(trilha);

  abrirModal('modalDetalhesTrilha');
}

/* =========================================================
   LISTA DE AULAS (NO DETALHES)
   Serve para montar a UI de aulas e ações.
   ========================================================= */
function renderizarAulas(trilha) {
  const lista = document.getElementById('listaAulas');
  const vazio = document.getElementById('estadoVazioAulas');

  if (!trilha.aulas || trilha.aulas.length === 0) {
    lista.innerHTML = '';
    lista.style.display = 'none';
    vazio.style.display = 'block';
    return;
  }

  lista.style.display = 'block';
  vazio.style.display = 'none';

  lista.innerHTML = trilha.aulas.map((aula, idx) => {
    const statusClasse = aula.status === 'concluida' ? 'status-concluida' : 'status-andamento';
    const statusTexto = aula.status === 'concluida' ? 'CONCLUÍDA' : 'EM ANDAMENTO';

    const estaEditandoMarcador =
      edicaoMarcador && edicaoMarcador.idTrilha === trilha.id && edicaoMarcador.idAula === aula.id;

    const blocoMarcador = estaEditandoMarcador
      ? `
        <div class="marcador-edicao">
          <input data-input-marcador="${aula.id}" type="text" value="${aula.marcador || ''}" placeholder="Ex: 15:30 ou uma nota">
          <button class="botao-salvar" data-acao-aula="salvar-marcador" data-id-aula="${aula.id}" type="button">
            <i class="fas fa-check"></i>
          </button>
          <button class="botao-cancelar" data-acao-aula="cancelar-marcador" data-id-aula="${aula.id}" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `
      : `
        <div class="marcador-exibicao" data-acao-aula="editar-marcador" data-id-aula="${aula.id}">
          <i class="fas fa-bookmark"></i>
          <span>${aula.marcador ? aula.marcador : 'Clique para adicionar onde parou'}</span>
          <small style="margin-left:auto; opacity:.6; font-size:11px;">
            <i class="fas fa-edit"></i>
          </small>
        </div>
      `;

    return `
      <div class="item-aula">
        <div class="info-aula">
          <div class="titulo-aula">
            <span>${aula.titulo}</span>
            <span class="status-aula ${statusClasse}">${statusTexto}</span>
          </div>

          <a class="link-aula" href="${aula.url}" target="_blank" rel="noreferrer">
            <i class="fas fa-external-link-alt"></i> ${aula.url}
          </a>

          <div class="bloco-marcador">
            ${blocoMarcador}
          </div>
        </div>

        <div class="acoes-aula">
          <button class="botao-pequeno ${aula.status === 'concluida' ? 'botao-secundario' : 'botao-primario'}"
                  data-acao-aula="alternar-status" data-id-aula="${aula.id}" type="button">
            <i class="fas ${aula.status === 'concluida' ? 'fa-undo' : 'fa-check'}"></i>
            ${aula.status === 'concluida' ? 'Voltar' : 'Concluir'}
          </button>

          <button class="botao-pequeno botao-secundario"
                  data-acao-aula="editar" data-indice="${idx}" type="button">
            <i class="fas fa-edit"></i> Editar
          </button>

          <button class="botao-pequeno botao-perigo"
                  data-acao-aula="excluir" data-id-aula="${aula.id}" type="button">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* =========================================================
   CLIQUES NA LISTA DE AULAS (DELEGAÇÃO)
   Serve para executar ações por data-atributos.
   ========================================================= */
function tratarCliqueAula(e) {
  const botao = e.target.closest('[data-acao-aula]');
  if (!botao) return;

  const acao = botao.dataset.acaoAula;
  const idAula = botao.dataset.idAula;
  const indice = botao.dataset.indice;

  if (!idTrilhaAtual) return;

  if (acao === 'alternar-status') alternarStatusAula(idTrilhaAtual, idAula);
  if (acao === 'excluir') excluirAula(idTrilhaAtual, idAula);
  if (acao === 'editar') abrirModalAula(idTrilhaAtual, Number(indice));

  if (acao === 'editar-marcador') iniciarEdicaoMarcador(idTrilhaAtual, idAula);
  if (acao === 'salvar-marcador') salvarMarcadorDireto(idTrilhaAtual, idAula);
  if (acao === 'cancelar-marcador') cancelarEdicaoMarcador(idTrilhaAtual);
}

/* =========================================================
   CONTADOR
   Serve para indicar quantos cards estão visíveis.
   ========================================================= */
function atualizarContadorTrilhas() {
  const cards = document.querySelectorAll('#containerTrilhas .card-trilha').length;
  document.getElementById('contadorTrilhas').textContent =
    `${cards} ${cards === 1 ? 'trilha' : 'trilhas'}`;
}

/* =========================================================
   URL
   Serve para validar links antes de salvar aula.
   ========================================================= */
function urlValida(texto) {
  try {
    new URL(texto);
    return true;
  } catch {
    return false;
  }
}
