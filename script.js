/* =========================================================
   CONFIGURAÇÕES / CONSTANTES
   Servem para guardar chaves e padrões do app
   ========================================================= */
const CHAVE_STORAGE = 'studyflix-data-v7';

const IMAGEM_PADRAO =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';

const IMAGENS_CATEGORIA = {
  programming: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  cyber: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  qa: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  data: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
  other: IMAGEM_PADRAO
};

const NOMES_CATEGORIA = {
  programming: 'Programação',
  design: 'Design',
  cyber: 'Cibersegurança',
  qa: 'QA e Testes',
  data: 'Ciência de Dados',
  other: 'Outros'
};

const ICONES_CATEGORIA = {
  programming: 'fa-code',
  design: 'fa-paint-brush',
  cyber: 'fa-shield-alt',
  qa: 'fa-vial',
  data: 'fa-chart-bar',
  other: 'fa-ellipsis-h'
};

/* =========================================================
   DADOS INICIAIS
   Servem para preencher exemplos na primeira execução
   ========================================================= */
const dadosPadrao = [
  {
    id: 'js',
    name: 'JavaScript Moderno',
    category: 'programming',
    image: IMAGENS_CATEGORIA.programming,
    color: '#F0DB4F',
    createdAt: new Date().toISOString(),
    links: [
      {
        id: 'lesson-1',
        title: 'Introdução ao ES6+',
        url: 'https://youtube.com/watch?v=example1',
        status: 'done',
        time: '15:30 - Conceitos básicos de ES6'
      },
      {
        id: 'lesson-2',
        title: 'Async/Await e Promises',
        url: 'https://youtube.com/watch?v=example2',
        status: 'progress',
        time: '22:10 - Trabalhando com async/await'
      }
    ]
  }
];

/* =========================================================
   DADOS DO APP
   Servem para manter as trilhas carregadas do navegador
   ========================================================= */
let data = JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || dadosPadrao;

/* =========================================================
   ESTADO DA INTERFACE
   Serve para controlar o que está aberto/filtrado/editando
   ========================================================= */
let currentCourseId = null;
let currentLessonIndex = null;
let activeFilter = 'all';
let currentSearchTerm = '';
let confirmCallback = null;

/* Serve para saber se o usuário está editando um “onde parei” específico */
let editingTimestamp = null;

/* =========================================================
   INICIALIZAÇÃO
   Serve para preparar eventos e renderizar o conteúdo inicial
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
  setupEventListeners();
  renderCourses();
  updateCoursesCount();
});

/* =========================================================
   FUNÇÕES GERAIS DO APP
   ========================================================= */
function initializeApp() {
  /* Serve para alterar o topo quando rola a página */
  window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  /* Serve para fechar modal ao clicar fora do conteúdo */
  document.addEventListener('click', function (e) {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach(modal => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  /* Serve para fechar modal com tecla ESC */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) closeModal(activeModal.id);
    }
  });
}

/* =========================================================
   EVENTOS DE BOTÕES / AÇÕES
   ========================================================= */
function setupEventListeners() {
  document.getElementById('addCourseBtn').addEventListener('click', () => openModal('addModal'));

  document.getElementById('exploreBtn').addEventListener('click', () => {
    document.getElementById('searchInput').focus();
  });

  document.getElementById('saveCourseBtn').addEventListener('click', saveNewCourse);

  document.getElementById('saveLessonBtn').addEventListener('click', saveLesson);

  document.getElementById('addLessonToCourseBtn').addEventListener('click', () => {
    if (currentCourseId) openLessonModal(currentCourseId, null, null);
  });

  document.getElementById('deleteCourseBtn').addEventListener('click', () => {
    if (!currentCourseId) return;
    showConfirm('Tem certeza que deseja excluir esta trilha e todas as suas aulas?', () => {
      deleteCourse(currentCourseId);
      closeModal('courseDetailsModal');
    });
  });

  document.getElementById('confirmCancel').addEventListener('click', () => closeModal('confirmModal'));
  document.getElementById('confirmDelete').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
    closeModal('confirmModal');
  });

  /* Serve para selecionar categoria visualmente */
  document.querySelectorAll('.category-option').forEach(option => {
    option.addEventListener('click', function () {
      document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('courseCategory').value = this.dataset.value;
    });
  });

  /* Serve para selecionar status visualmente */
  document.querySelectorAll('.status-option').forEach(option => {
    option.addEventListener('click', function () {
      document.querySelectorAll('.status-option').forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('editLessonStatus').value = this.dataset.value;
    });
  });

  /* Serve para mostrar o valor da cor */
  document.getElementById('courseColor').addEventListener('input', function () {
    document.getElementById('colorValue').textContent = this.value;
  });

  /* Serve para fechar modais pelo botão X */
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });

  /* Filtros */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderCourses();
      updateCoursesCount();
    });
  });

  /* Busca em tempo real */
  document.getElementById('searchInput').addEventListener('input', function () {
    currentSearchTerm = this.value.toLowerCase().trim();
    renderCourses();
    updateCoursesCount();
  });

  document.getElementById('searchBtn').addEventListener('click', function () {
    currentSearchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    renderCourses();
    updateCoursesCount();
  });
}

/* =========================================================
   MODAIS
   Servem para abrir/fechar e limpar estados
   ========================================================= */
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';

  /* Serve para focar no primeiro campo do modal */
  if (modalId === 'lessonModal') {
    setTimeout(() => document.getElementById('editLessonTitle').focus(), 100);
  } else if (modalId === 'addModal') {
    setTimeout(() => document.getElementById('courseName').focus(), 100);

    /* Serve para resetar o seletor visual de categoria */
    document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('.category-option[data-value="programming"]').classList.add('active');
    document.getElementById('courseCategory').value = 'programming';
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = 'auto';

  /* Serve para limpar campos ao fechar modal */
  if (modalId === 'addModal') {
    document.getElementById('courseName').value = '';
    document.getElementById('courseImage').value = '';
    document.getElementById('courseColor').value = '#E50914';
    document.getElementById('colorValue').textContent = '#E50914';
  } else if (modalId === 'lessonModal') {
    document.getElementById('editLessonTitle').value = '';
    document.getElementById('editLessonUrl').value = '';
    document.getElementById('editLessonTime').value = '';
    document.getElementById('editLessonStatus').value = 'progress';
    document.getElementById('lessonIndex').value = '';
    document.getElementById('lessonModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Videoaula';
    document.querySelectorAll('.status-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('.status-option[data-value="progress"]').classList.add('active');
    currentLessonIndex = null;
  } else if (modalId === 'courseDetailsModal') {
    currentCourseId = null;
    editingTimestamp = null;
  } else if (modalId === 'confirmModal') {
    confirmCallback = null;
  }
}

/* Serve para abrir uma confirmação com callback */
function showConfirm(message, callback) {
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = callback;
  openModal('confirmModal');
}

/* =========================================================
   CRIAR TRILHA
   Serve para adicionar uma trilha no sistema
   ========================================================= */
function saveNewCourse() {
  const name = document.getElementById('courseName').value.trim();
  const category = document.getElementById('courseCategory').value;
  const image = document.getElementById('courseImage').value.trim() || IMAGENS_CATEGORIA[category] || IMAGEM_PADRAO;
  const color = document.getElementById('courseColor').value;

  if (!name) {
    alert('Por favor, insira um nome para a trilha.');
    return;
  }

  const newCourse = {
    id: 'course-' + Date.now(),
    name,
    category,
    image,
    color,
    createdAt: new Date().toISOString(),
    links: []
  };

  data.push(newCourse);
  saveToStorage();
  renderCourses();
  updateCoursesCount();
  closeModal('addModal');

  /* Serve para abrir automaticamente a trilha criada */
  setTimeout(() => openCourseDetails(newCourse.id), 200);
}

/* =========================================================
   MODAL AULA (NOVA/EDITAR)
   Serve para abrir o formulário da aula (com preenchimento se for edição)
   ========================================================= */
function openLessonModal(courseId, lessonIndex = null, evento = null) {
  /* Serve para evitar que o clique suba para o card */
  if (evento) {
    evento.stopPropagation();
    evento.preventDefault();
  }

  currentCourseId = courseId;
  currentLessonIndex = lessonIndex;

  const title = document.getElementById('lessonModalTitle');
  const lessonTitle = document.getElementById('editLessonTitle');
  const lessonUrl = document.getElementById('editLessonUrl');
  const lessonTime = document.getElementById('editLessonTime');
  const lessonStatus = document.getElementById('editLessonStatus');
  const statusOptions = document.querySelectorAll('.status-option');

  if (lessonIndex !== null) {
    /* Serve para editar aula existente */
    const course = data.find(c => c.id === courseId);
    if (course && course.links[lessonIndex]) {
      const lesson = course.links[lessonIndex];
      title.innerHTML = '<i class="fas fa-edit"></i> Editar Aula';
      lessonTitle.value = lesson.title;
      lessonUrl.value = lesson.url;
      lessonTime.value = lesson.time || '';
      lessonStatus.value = lesson.status;

      statusOptions.forEach(opt => opt.classList.remove('active'));
      const activeOption = document.querySelector(`.status-option[data-value="${lesson.status}"]`);
      if (activeOption) activeOption.classList.add('active');

      document.getElementById('lessonIndex').value = String(lessonIndex);
    }
  } else {
    /* Serve para cadastrar nova aula */
    title.innerHTML = '<i class="fas fa-plus-circle"></i> Nova Videoaula';
    lessonTitle.value = '';
    lessonUrl.value = '';
    lessonTime.value = '';
    lessonStatus.value = 'progress';

    statusOptions.forEach(opt => opt.classList.remove('active'));
    document.querySelector('.status-option[data-value="progress"]').classList.add('active');

    document.getElementById('lessonIndex').value = '';
  }

  /* Serve para fechar detalhes e abrir formulário de aula */
  const detailsModal = document.getElementById('courseDetailsModal');
  if (detailsModal.classList.contains('active')) detailsModal.classList.remove('active');

  openModal('lessonModal');
}

/* =========================================================
   SALVAR AULA
   Serve para criar ou atualizar uma aula dentro da trilha atual
   ========================================================= */
function saveLesson() {
  const title = document.getElementById('editLessonTitle').value.trim();
  const url = document.getElementById('editLessonUrl').value.trim();
  const time = document.getElementById('editLessonTime').value.trim();
  const status = document.getElementById('editLessonStatus').value;
  const lessonIndex = document.getElementById('lessonIndex').value;

  if (!title || !url) {
    alert('Por favor, preencha o título e a URL da aula.');
    return;
  }

  if (!isValidUrl(url)) {
    alert('Por favor, insira uma URL válida.');
    return;
  }

  const course = data.find(c => c.id === currentCourseId);
  if (!course) return;

  if (lessonIndex !== '') {
    /* Serve para atualizar aula existente */
    course.links[lessonIndex] = {
      ...course.links[lessonIndex],
      title,
      url,
      time,
      status
    };
  } else {
    /* Serve para inserir nova aula */
    course.links.push({
      id: 'lesson-' + Date.now(),
      title,
      url,
      time,
      status
    });
  }

  saveToStorage();
  closeModal('lessonModal');

  /* Serve para reabrir detalhes atualizados */
  setTimeout(() => {
    if (currentCourseId) openCourseDetails(currentCourseId);
  }, 100);

  renderCourses();
  updateCoursesCount();
}

/* =========================================================
   EDITAR “ONDE PAREI” DIRETO NA LISTA
   Serve para trocar o marcador sem abrir modal de aula
   ========================================================= */
function editTimestamp(courseId, lessonIndex, evento) {
  if (evento) {
    evento.stopPropagation();
    evento.preventDefault();
  }

  editingTimestamp = { courseId, lessonIndex };
  openCourseDetails(courseId);
}

/* Serve para salvar marcador editado direto */
function saveTimestampDirect(courseId, lessonIndex, evento) {
  if (evento) {
    evento.stopPropagation();
    evento.preventDefault();
  }

  const input = document.getElementById(`timestamp-input-${courseId}-${lessonIndex}`);
  if (!input) return;

  const course = data.find(c => c.id === courseId);
  if (!course || !course.links[lessonIndex]) return;

  course.links[lessonIndex].time = input.value.trim();
  saveToStorage();
  editingTimestamp = null;

  openCourseDetails(courseId);
  renderCourses();
  updateCoursesCount();
}

/* Serve para cancelar edição do marcador */
function cancelTimestampEditDirect(courseId, lessonIndex, evento) {
  if (evento) {
    evento.stopPropagation();
    evento.preventDefault();
  }

  editingTimestamp = null;
  openCourseDetails(courseId);
}

/* =========================================================
   STATUS / EXCLUSÃO DE AULA
   ========================================================= */
function toggleLessonStatus(courseId, lessonIndex, evento) {
  if (evento) {
    evento.stopPropagation();
    evento.preventDefault();
  }

  const course = data.find(c => c.id === courseId);
  if (!course || !course.links[lessonIndex]) return;

  course.links[lessonIndex].status =
    course.links[lessonIndex].status === 'done' ? 'progress' : 'done';

  saveToStorage();

  if (document.getElementById('courseDetailsModal').classList.contains('active') && courseId === currentCourseId) {
    openCourseDetails(courseId);
  } else {
    renderCourses();
  }

  updateCoursesCount();
}

function deleteLesson(courseId, lessonIndex, evento) {
  if (evento) {
    evento.stopPropagation();
    evento.preventDefault();
  }

  showConfirm('Tem certeza que deseja excluir esta aula?', () => {
    const course = data.find(c => c.id === courseId);
    if (!course) return;

    course.links.splice(lessonIndex, 1);
    saveToStorage();

    if (document.getElementById('courseDetailsModal').classList.contains('active') && courseId === currentCourseId) {
      openCourseDetails(courseId);
    } else {
      renderCourses();
    }

    updateCoursesCount();
  });
}

/* =========================================================
   EXCLUSÃO DE TRILHA
   Serve para remover uma trilha inteira
   ========================================================= */
function deleteCourse(courseId) {
  const courseIndex = data.findIndex(c => c.id === courseId);
  if (courseIndex === -1) return;
  data.splice(courseIndex, 1);
  saveToStorage();
  renderCourses();
  updateCoursesCount();
}

/* =========================================================
   MARCAR TODAS COMO CONCLUÍDAS
   Serve para finalizar todas as aulas de uma trilha
   ========================================================= */
function markAllAsDone() {
  if (!currentCourseId) return;

  const course = data.find(c => c.id === currentCourseId);
  if (!course || course.links.length === 0) return;

  showConfirm('Marcar todas as aulas como concluídas?', () => {
    course.links.forEach(link => (link.status = 'done'));
    saveToStorage();
    openCourseDetails(currentCourseId);
    renderCourses();
    updateCoursesCount();
  });
}

/* =========================================================
   CÁLCULOS E FORMATAÇÃO
   ========================================================= */
function calculateProgress(links) {
  if (!links || links.length === 0) return 0;
  const completed = links.filter(link => link.status === 'done').length;
  return Math.round((completed / links.length) * 100);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Hoje';
  if (diffDays === 2) return 'Ontem';
  if (diffDays <= 7) return `${diffDays} dias atrás`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  return date.toLocaleDateString('pt-BR');
}

function updateCoursesCount() {
  const container = document.getElementById('coursesContainer');
  const courseCards = container.querySelectorAll('.course-card').length;
  document.getElementById('coursesCount').textContent =
    `${courseCards} ${courseCards === 1 ? 'trilha' : 'trilhas'}`;
}

/* =========================================================
   RENDERIZAR TRILHAS (CARDS)
   Serve para montar os cards conforme filtro e busca
   ========================================================= */
function renderCourses() {
  const container = document.getElementById('coursesContainer');
  let filteredCourses = data;

  if (activeFilter === 'progress') {
    filteredCourses = data.filter(course => calculateProgress(course.links) < 100);
  } else if (activeFilter === 'done') {
    filteredCourses = data.filter(course => course.links.length > 0 && calculateProgress(course.links) === 100);
  }

  if (currentSearchTerm) {
    filteredCourses = filteredCourses.filter(course =>
      course.name.toLowerCase().includes(currentSearchTerm) ||
      NOMES_CATEGORIA[course.category].toLowerCase().includes(currentSearchTerm) ||
      course.links.some(link =>
        link.title.toLowerCase().includes(currentSearchTerm) ||
        link.url.toLowerCase().includes(currentSearchTerm) ||
        (link.time && link.time.toLowerCase().includes(currentSearchTerm))
      )
    );
  }

  filteredCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = filteredCourses.map(course => {
    const progress = calculateProgress(course.links);
    const completedCount = course.links.filter(link => link.status === 'done').length;
    const totalCount = course.links.length;
    const formattedDate = formatDate(course.createdAt);
    const categoryName = NOMES_CATEGORIA[course.category] || course.category;
    const categoryIcon = ICONES_CATEGORIA[course.category] || 'fa-tag';

    return `
      <div class="course-card" onclick="openCourseDetails('${course.id}')">
        <div class="course-image" style="background-image: url('${course.image}');">
          <div class="course-overlay">
            <span class="course-category">
              <i class="fas ${categoryIcon}"></i> ${categoryName}
            </span>
          </div>
        </div>

        <div class="course-content">
          <h3 class="course-title">${course.name}</h3>

          <div class="course-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${progress}% concluído • ${formattedDate}</div>
          </div>

          <div class="course-stats">
            <span><i class="fas fa-play-circle"></i> ${totalCount} aulas</span>
            <span><i class="fas fa-check-circle"></i> ${completedCount} concluídas</span>
          </div>

          <div class="course-actions">
            <button class="btn-primary" onclick="event.stopPropagation(); openCourseDetails('${course.id}')">
              <i class="fas fa-play"></i> Continuar
            </button>

            <button class="btn-secondary" onclick="event.stopPropagation(); openLessonModal('${course.id}', null, event)">
              <i class="fas fa-plus"></i> Aula
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (filteredCourses.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-search"></i>
        <h5>Nenhuma trilha encontrada</h5>
        <p>${currentSearchTerm ? 'Nenhuma trilha corresponde à sua busca.' : 'Comece criando sua primeira trilha de estudos!'}</p>
        <button class="btn-primary" onclick="openModal('addModal')" style="margin-top: 20px;">
          <i class="fas fa-plus-circle"></i> Criar Primeira Trilha
        </button>
      </div>
    `;
  }
}

/* =========================================================
   DETALHES DA TRILHA
   Serve para preencher modal com dados e aulas
   ========================================================= */
function openCourseDetails(courseId) {
  currentCourseId = courseId;
  const course = data.find(c => c.id === courseId);
  if (!course) return;

  const progress = calculateProgress(course.links);
  const completedCount = course.links.filter(link => link.status === 'done').length;
  const totalCount = course.links.length;
  const categoryName = NOMES_CATEGORIA[course.category] || course.category;
  const formattedDate = formatDate(course.createdAt);

  document.getElementById('courseDetailsTitle').textContent = course.name;
  document.getElementById('courseDetailsImage').style.backgroundImage = `url('${course.image}')`;
  document.getElementById('courseProgressFill').style.width = `${progress}%`;
  document.getElementById('courseProgressText').textContent = `Criado ${formattedDate} • ${progress}% concluído`;
  document.getElementById('courseTotalLessons').textContent = totalCount;
  document.getElementById('courseCompletedLessons').textContent = completedCount;
  document.getElementById('courseCategoryBadge').innerHTML =
    `<i class="fas ${ICONES_CATEGORIA[course.category] || 'fa-tag'}"></i> ${categoryName}`;

  const lessonsList = document.getElementById('courseLessonsList');
  const emptyState = document.getElementById('emptyLessonsState');

  if (course.links.length === 0) {
    lessonsList.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    lessonsList.style.display = 'block';
    emptyState.style.display = 'none';

    lessonsList.innerHTML = course.links.map((lesson, index) => {
      const isEditing = editingTimestamp &&
        editingTimestamp.courseId === courseId &&
        editingTimestamp.lessonIndex === index;

      if (isEditing) {
        return `
          <div class="lesson-item">
            <div class="lesson-info">
              <div class="lesson-title">
                <span>${lesson.title}</span>
                <span class="lesson-status ${lesson.status === 'done' ? 'status-done' : 'status-progress'}">
                  ${lesson.status === 'done' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                </span>
              </div>

              <a href="${lesson.url}" target="_blank" class="lesson-url">
                <i class="fas fa-external-link-alt"></i> ${lesson.url}
              </a>

              <div class="lesson-timestamp">
                <div class="timestamp-input" id="timestamp-${courseId}-${index}">
                  <input type="text"
                         id="timestamp-input-${courseId}-${index}"
                         value="${lesson.time || ''}"
                         placeholder="Ex: 15:30 ou 'Capítulo 3 - Arrays'">
                  <button onclick="saveTimestampDirect('${courseId}', ${index}, event)">
                    <i class="fas fa-check"></i> Salvar
                  </button>
                  <button onclick="cancelTimestampEditDirect('${courseId}', ${index}, event)"
                          style="background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1);">
                    <i class="fas fa-times"></i> Cancelar
                  </button>
                </div>
              </div>
            </div>

            <div class="lesson-actions">
              <button class="btn-sm ${lesson.status === 'done' ? 'btn-secondary' : 'btn-primary'}"
                      onclick="toggleLessonStatus('${course.id}', ${index}, event)">
                <i class="fas ${lesson.status === 'done' ? 'fa-undo' : 'fa-check'}"></i>
                ${lesson.status === 'done' ? 'Voltar' : 'Concluir'}
              </button>

              <button class="btn-sm btn-warning" onclick="openLessonModal('${course.id}', ${index}, event)">
                <i class="fas fa-edit"></i> Editar
              </button>

              <button class="btn-sm btn-danger" onclick="deleteLesson('${course.id}', ${index}, event)">
                <i class="fas fa-trash"></i> Excluir
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div class="lesson-item">
          <div class="lesson-info">
            <div class="lesson-title">
              <span>${lesson.title}</span>
              <span class="lesson-status ${lesson.status === 'done' ? 'status-done' : 'status-progress'}">
                ${lesson.status === 'done' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
              </span>
            </div>

            <a href="${lesson.url}" target="_blank" class="lesson-url">
              <i class="fas fa-external-link-alt"></i> ${lesson.url}
            </a>

            <div class="lesson-timestamp">
              ${lesson.time ? `
                <div class="timestamp-content" id="timestamp-${courseId}-${index}" onclick="editTimestamp('${courseId}', ${index}, event)">
                  <i class="fas fa-bookmark"></i>
                  <span>${lesson.time}</span>
                  <small style="margin-left: auto; color: rgba(255,255,255,0.5); font-size: 11px;">
                    <i class="fas fa-edit"></i> editar
                  </small>
                </div>
              ` : `
                <div class="timestamp-content" id="timestamp-${courseId}-${index}" onclick="editTimestamp('${courseId}', ${index}, event)" style="opacity: 0.7;">
                  <i class="fas fa-bookmark"></i>
                  <span>Clique para adicionar onde parou</span>
                </div>
              `}
            </div>
          </div>

          <div class="lesson-actions">
            <button class="btn-sm ${lesson.status === 'done' ? 'btn-secondary' : 'btn-primary'}"
                    onclick="toggleLessonStatus('${course.id}', ${index}, event)">
              <i class="fas ${lesson.status === 'done' ? 'fa-undo' : 'fa-check'}"></i>
              ${lesson.status === 'done' ? 'Voltar' : 'Concluir'}
            </button>

            <button class="btn-sm btn-warning" onclick="openLessonModal('${course.id}', ${index}, event)">
              <i class="fas fa-edit"></i> Editar
            </button>

            <button class="btn-sm btn-danger" onclick="deleteLesson('${course.id}', ${index}, event)">
              <i class="fas fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  openModal('courseDetailsModal');
}

/* =========================================================
   UTILITÁRIOS
   ========================================================= */
function saveToStorage() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(data));
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
