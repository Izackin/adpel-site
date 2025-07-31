// ===================== Helpers =====================
function safeHtml(text) {
  return ("" + text).replace(/[<>&"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'
  }[c]));
}

// ========== TAB SYSTEM ==========
const tabs = ["eventos", "escalas", "cursos", "noticias"];
let currentTab = "eventos";

// Troca de aba e renderização
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => switchTab(btn.getAttribute("data-tab"));
  });
  renderTab();
});

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    if (btn.getAttribute("data-tab") === tab) {
      btn.classList.add("tab-active"); btn.classList.remove("tab-inactive");
    } else {
      btn.classList.remove("tab-active"); btn.classList.add("tab-inactive");
    }
  });
  renderTab();
}

function renderTab() {
  const content = document.getElementById("tab-content");
  let title = "", desc = "";
  if (currentTab === "eventos") {
    title = "Eventos"; desc = "Gerencie os eventos da igreja.";
  } else if (currentTab === "escalas") {
    title = "Escalas"; desc = "Gerencie as escalas dos cultos.";
  } else if (currentTab === "cursos") {
    title = "Cursos"; desc = "Gerencie os cursos (módulos, aulas e vídeo do YouTube privado).";
  } else if (currentTab === "noticias") {
    title = "Notícias"; desc = "Gerencie as notícias da igreja.";
  }
  content.innerHTML = `
    <h2 class="text-2xl font-bold mb-4 text-[#a259ff]">${title}</h2>
    <p class="mb-6 text-gray-400">${desc}</p>
    <div id="${currentTab}-crud"></div>
  `;
  if (currentTab === "eventos") renderEventosCRUD();
  if (currentTab === "escalas") renderEscalasCRUD();
  if (currentTab === "cursos") renderCursosCRUD();
  if (currentTab === "noticias") renderNoticiasCRUD();
}

// ========== CRUD DE EVENTOS ==========
// Agora utiliza Supabase para persistência e sincronização em tempo real
async function fetchEventos() {
  const { data, error } = await supabase.from('eventos').select().order('id', { ascending: false });
  if (error) { console.error('Erro ao buscar eventos', error); return []; }
  return data || [];
}
async function insertEvento(evento) {
  const { error } = await supabase.from('eventos').insert(evento);
  if (error) console.error('Erro ao inserir evento', error);
}
async function deleteEvento(id) {
  const { error } = await supabase.from('eventos').delete().eq('id', id);
  if (error) console.error('Erro ao remover evento', error);
}
async function updateEvento(id, fields) {
  const { error } = await supabase.from('eventos').update(fields).eq('id', id);
  if (error) console.error('Erro ao atualizar evento', error);
}
function renderEventosCRUD() {
  const container = document.getElementById('eventos-crud');
  if (!container) return;
  container.innerHTML = `
    <form id="evento-form" class="bg-gray-800 p-4 rounded-lg shadow-lg mb-8 flex flex-col md:flex-row md:items-end gap-4">
      <div class="flex-1">
        <label class="block mb-1 font-semibold">Título</label>
        <input required id="evento-title" type="text" class="w-full p-2 rounded bg-gray-700 text-gray-200" placeholder="Título do evento"/>
      </div>
      <div class="flex-1">
        <label class="block mb-1 font-semibold">Descrição</label>
        <input required id="evento-desc" type="text" class="w-full p-2 rounded bg-gray-700 text-gray-200" placeholder="Descrição"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Data</label>
        <input required id="evento-data" type="date" class="w-full p-2 rounded bg-gray-700 text-gray-200"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Início</label>
        <input required id="evento-hora-inicio" type="time" class="w-full p-2 rounded bg-gray-700 text-gray-200"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Término</label>
        <input required id="evento-hora-fim" type="time" class="w-full p-2 rounded bg-gray-700 text-gray-200"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Imagem <span class="text-yellow-400">(obrigatória)</span></label>
        <input required id="evento-img" type="file" accept="image/*" class="text-gray-200"/>
      </div>
      <button type="submit" class="bg-[#a259ff] hover:bg-violet-700 text-white font-bold py-2 px-4 rounded">Adicionar</button>
    </form>
    <div id="eventos-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
  `;
  renderEventosCards();
  document.getElementById('evento-form').onsubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById('evento-title').value.trim();
    const desc = document.getElementById('evento-desc').value.trim();
    const data = document.getElementById('evento-data').value.trim();
    const horaInicio = document.getElementById('evento-hora-inicio').value.trim();
    const horaFim = document.getElementById('evento-hora-fim').value.trim();
    const fileInput = document.getElementById('evento-img');
    const file = fileInput.files[0];
    if (!file) return alert('Imagem obrigatória!');
    const reader = new FileReader();
    reader.onload = async function(evt) {
      await insertEvento({ title, desc, img: evt.target.result, data, horaInicio, horaFim });
      renderEventosCards();
      document.getElementById('evento-form').reset();
    };
    reader.readAsDataURL(file);
  };
}
async function renderEventosCards() {
  const list = document.getElementById('eventos-list');
  if (!list) return;
  const eventos = await fetchEventos();
  list.innerHTML = '';
  eventos.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col';
    card.innerHTML = `
      <img src="${ev.img}" alt="Imagem do evento" class="w-full h-48 object-cover cursor-pointer visualizar-img"/>
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="text-lg font-bold mb-2">${ev.title}</h3>
        <div class="text-gray-400 mb-1 text-sm">
          Data: ${ev.data ? ev.data.split('-').reverse().join('/') : "-"}<br>
          Início: <span class="text-[#a259ff]">${ev.horaInicio || '-'}</span>
          ${ev.horaFim ? `&nbsp;|&nbsp;Término: <span class="text-[#a259ff]">${ev.horaFim}</span>` : ''}
        </div>
        <p class="mb-4 flex-1">${ev.desc}</p>
        <div class="flex flex-wrap gap-2 mt-auto">
          <a href="${getGoogleCalendarUrl(ev)}" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><i class="fa fa-calendar-plus"></i> Google Agenda</a>
          <a href="${getWhatsAppMsg(ev)}" target="_blank" class="bg-[#25d366] hover:bg-green-800 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><i class="fa fa-whatsapp"></i> WhatsApp</a>
          <button class="editar bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs" data-id="${ev.id}">Editar</button>
          <button class="remover bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs" data-id="${ev.id}">Remover</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll('.visualizar-img').forEach((img, idx) => {
    img.onclick = () => abrirImagem(eventos[idx].img);
  });
  list.querySelectorAll('.remover').forEach(btn => {
    btn.onclick = async function() {
      const id = this.getAttribute('data-id');
      if (confirm('Remover este evento?')) {
        await deleteEvento(id);
        renderEventosCards();
      }
    };
  });
  list.querySelectorAll('.editar').forEach(btn => {
    btn.onclick = function() {
      const id = this.getAttribute('data-id');
      editarEvento(id);
    };
  });
}
// Gera link Google Agenda
function getGoogleCalendarUrl(ev) {
  if (!ev.data) return "#";
  const data = ev.data.replace(/-/g,"");
  const hi = (ev.horaInicio||"19:00").replace(":","");
  const hf = (ev.horaFim||"21:00").replace(":","");
  const dtStart = data + "T" + hi + "00Z";
  const dtEnd = data + "T" + hf + "00Z";
  const url = [
    "https://calendar.google.com/calendar/render?action=TEMPLATE",
    "text=" + encodeURIComponent(ev.title||"Evento"),
    "dates=" + dtStart + "/" + dtEnd,
    "details=" + encodeURIComponent(ev.desc||""),
  ].join("&");
  return url;
}
// Gera mensagem para WhatsApp
function getWhatsAppMsg(ev) {
  let msg = `Evento: ${ev.title}\nQuando: ${ev.data ? ev.data.split('-').reverse().join('/') : "-"}\nInício: ${ev.horaInicio||''}`;
  if (ev.horaFim) msg += ` até ${ev.horaFim}`;
  if (ev.desc) msg += `\n${ev.desc}`;
  return "https://wa.me/?text=" + encodeURIComponent(msg);
}
async function editarEvento(id) {
  const eventos = await fetchEventos();
  const ev = eventos.find(e => e.id == id);
  if (!ev) return;
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md relative">
      <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-gray-200 text-2xl">&times;</button>
      <h3 class="text-xl font-bold mb-4">Editar Evento</h3>
      <form id="editar-form">
        <label class="block mb-2 font-semibold">Título</label>
        <input required type="text" id="edit-title" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-2" value="${ev.title}"/>
        <label class="block mb-2 font-semibold">Descrição</label>
        <input required type="text" id="edit-desc" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-2" value="${ev.desc}"/>
        <label class="block mb-2 font-semibold">Data</label>
        <input required type="date" id="edit-data" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-2" value="${ev.data}"/>
        <label class="block mb-2 font-semibold">Início</label>
        <input required type="time" id="edit-hora-inicio" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-2" value="${ev.horaInicio||''}"/>
        <label class="block mb-2 font-semibold">Término</label>
        <input required type="time" id="edit-hora-fim" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-2" value="${ev.horaFim||''}"/>
        <label class="block mb-2 font-semibold">Nova Imagem <span class="text-gray-400">(opcional)</span></label>
        <input type="file" id="edit-img" accept="image/*" class="mb-4 text-gray-200"/>
        <button type="submit" class="bg-[#a259ff] hover:bg-violet-700 text-white font-bold py-2 px-4 rounded">Salvar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("editar-form").onsubmit = function(e) {
    e.preventDefault();
    const fields = {
      title: document.getElementById("edit-title").value.trim(),
      desc: document.getElementById("edit-desc").value.trim(),
      data: document.getElementById("edit-data").value.trim(),
      horaInicio: document.getElementById("edit-hora-inicio").value.trim(),
      horaFim: document.getElementById("edit-hora-fim").value.trim()
    };
    const file = document.getElementById("edit-img").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function(evt) {
        fields.img = evt.target.result;
        await updateEvento(id, fields);
        renderEventosCards();
        modal.remove();
      };
      reader.readAsDataURL(file);
    } else {
      updateEvento(id, fields).then(() => {
        renderEventosCards();
        modal.remove();
      });
    }
  };
}


// ========== CRUD DE ESCALAS ==========
function getEscalas() {
  return JSON.parse(localStorage.getItem("adpel_escalas")) || [];
}
function saveEscalas(escalas) {
  localStorage.setItem("adpel_escalas", JSON.stringify(escalas));
}
function renderEscalasCRUD() {
  const container = document.getElementById("escalas-crud");
  if (!container) return;
  container.innerHTML = `
    <form id="escala-form" class="bg-gray-800 p-4 rounded-lg shadow-lg mb-8 flex flex-col md:flex-row md:items-end gap-4">
      <div>
        <label class="block mb-1 font-semibold">Título</label>
        <input required id="escala-title" type="text" class="w-full p-2 rounded bg-gray-700 text-gray-200" placeholder="Título da escala"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Data</label>
        <input required id="escala-data" type="date" class="w-full p-2 rounded bg-gray-700 text-gray-200"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Imagem</label>
        <input required id="escala-img" type="file" accept="image/*" class="text-gray-200"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Observação</label>
        <input id="escala-obs" type="text" class="w-full p-2 rounded bg-gray-700 text-gray-200" placeholder="Opcional"/>
      </div>
      <button type="submit" class="bg-[#a259ff] hover:bg-violet-700 text-white font-bold py-2 px-4 rounded">Adicionar</button>
    </form>
    <div class="mb-2">
      <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded" onclick="abrirModalFuncoes()">+ Funções/Cargos</button>
    </div>
    <div id="escalas-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
  `;
  renderEscalasCards();
  document.getElementById("escala-form").onsubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById("escala-title").value.trim();
    const data = document.getElementById("escala-data").value.trim();
    const obs = document.getElementById("escala-obs").value.trim();
    const fileInput = document.getElementById("escala-img");
    const file = fileInput.files[0];
    if (!file) return alert("Imagem obrigatória!");
    const funcoes = window.ultimaEscalaFuncoes || [];
    if (!funcoes.length) return alert("Adicione ao menos uma função/cargo!");
    const reader = new FileReader();
    reader.onload = function(evt) {
      const escalas = getEscalas();
      escalas.push({ title, data, obs, img: evt.target.result, funcoes: funcoes });
      saveEscalas(escalas);
      renderEscalasCards();
      document.getElementById("escala-form").reset();
      window.ultimaEscalaFuncoes = [];
    };
    reader.readAsDataURL(file);
  };
}
window.ultimaEscalaFuncoes = [];
function abrirModalFuncoes() {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50";
  let funcoes = window.ultimaEscalaFuncoes || [];
  modal.innerHTML = `
    <div class="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-lg relative">
      <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-gray-200 text-2xl">&times;</button>
      <h3 class="text-xl font-bold mb-4">Funções/Cargos</h3>
      <div id="funcoes-area"></div>
      <button class="bg-green-600 text-white px-4 py-1 rounded my-2" onclick="addFuncao()">+ Adicionar Função</button>
      <button class="bg-[#a259ff] text-white px-6 py-2 rounded font-bold mt-4 float-right" onclick="salvarFuncoes()">Salvar</button>
    </div>
  `;
  document.body.appendChild(modal);
  window.renderFuncoes = function() {
    document.getElementById("funcoes-area").innerHTML = funcoes.map((f, idx) => `
      <div class="flex gap-2 mb-2">
        <input class="p-1 bg-gray-900 rounded text-xs w-32" placeholder="Função/cargo" value="${f.funcao||''}" onchange="window.ultimaEscalaFuncoes[${idx}].funcao=this.value">
        <input class="p-1 bg-gray-900 rounded text-xs flex-1" placeholder="Nomes (separados por vírgula)" value="${f.nomes||''}" onchange="window.ultimaEscalaFuncoes[${idx}].nomes=this.value">
        <button onclick="removeFuncao(${idx})" class="text-red-400 px-2 rounded hover:bg-red-900">&times;</button>
      </div>
    `).join('');
  };
  window.addFuncao = function() {
    funcoes.push({ funcao: "", nomes: "" });
    window.renderFuncoes();
  };
  window.removeFuncao = function(idx) {
    funcoes.splice(idx, 1);
    window.renderFuncoes();
  };
  window.salvarFuncoes = function() {
    window.ultimaEscalaFuncoes = funcoes;
    modal.remove();
  };
  window.renderFuncoes();
}
function renderEscalasCards() {
  const escalas = getEscalas();
  const list = document.getElementById("escalas-list");
  if (!list) return;
  list.innerHTML = "";
  escalas.slice().reverse().forEach((es, idx) => {
    const realIdx = escalas.length - 1 - idx;
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col";
    card.innerHTML = `
      <img src="${es.img}" alt="Imagem da escala" class="w-full h-40 object-cover cursor-pointer visualizar-img"/>
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="text-lg font-bold mb-2">${es.title}</h3>
        <div class="text-gray-400 mb-2 text-sm">${es.data ? ("Data: " + es.data.split('-').reverse().join('/')) : ""}</div>
        ${es.obs ? `<div class="mb-2 text-[#a259ff] italic">${es.obs}</div>` : ""}
        <div class="mb-2">
          ${(es.funcoes||[]).map(f => `
            <div class="flex gap-2 items-center">
              <span class="font-bold text-[#a259ff]">${f.funcao}:</span>
              <span>${f.nomes}</span>
            </div>
          `).join("")}
        </div>
        <div class="flex gap-2 mt-auto">
          <button class="editar bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded" data-index="${realIdx}">Editar</button>
          <button class="remover bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded" data-index="${realIdx}">Remover</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll(".visualizar-img").forEach((img, idx) => {
    img.onclick = () => abrirImagem(escalas[escalas.length-1-idx].img);
  });
  list.querySelectorAll(".remover").forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute("data-index"));
      if (confirm("Remover esta escala?")) {
        const escalas = getEscalas();
        escalas.splice(idx, 1);
        saveEscalas(escalas);
        renderEscalasCards();
      }
    };
  });
  list.querySelectorAll(".editar").forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute("data-index"));
      editarEscala(idx);
    };
  });
}
function editarEscala(idx) {
  const escalas = getEscalas();
  const es = escalas[idx];
  if (!es) return;
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md relative">
      <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-gray-200 text-2xl">&times;</button>
      <h3 class="text-xl font-bold mb-4">Editar Escala</h3>
      <form id="editar-escala-form">
        <label class="block mb-2 font-semibold">Título</label>
        <input required type="text" id="edit-escala-title" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-4" value="${es.title}"/>
        <label class="block mb-2 font-semibold">Data</label>
        <input required type="date" id="edit-escala-data" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-4" value="${es.data}"/>
        <label class="block mb-2 font-semibold">Observação</label>
        <input type="text" id="edit-escala-obs" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-4" value="${es.obs||""}"/>
        <label class="block mb-2 font-semibold">Nova Imagem <span class="text-gray-400">(opcional)</span></label>
        <input type="file" id="edit-escala-img" accept="image/*" class="mb-4 text-gray-200"/>
        <button type="button" class="bg-green-600 text-white px-3 py-1 rounded mb-3" onclick="editarFuncoesEscala(${idx})">Editar Funções/Cargos</button>
        <button type="submit" class="bg-[#a259ff] hover:bg-violet-700 text-white font-bold py-2 px-4 rounded float-right">Salvar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("editar-escala-form").onsubmit = function(e) {
    e.preventDefault();
    es.title = document.getElementById("edit-escala-title").value.trim();
    es.data = document.getElementById("edit-escala-data").value.trim();
    es.obs = document.getElementById("edit-escala-obs").value.trim();
    const file = document.getElementById("edit-escala-img").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        es.img = evt.target.result;
        escalas[idx] = es;
        saveEscalas(escalas);
        renderEscalasCards();
        modal.remove();
      };
      reader.readAsDataURL(file);
    } else {
      escalas[idx] = es;
      saveEscalas(escalas);
      renderEscalasCards();
      modal.remove();
    }
  };
}
function editarFuncoesEscala(idx) {
  const escalas = getEscalas();
  window.ultimaEscalaFuncoes = escalas[idx].funcoes || [];
  abrirModalFuncoes();
}

// ========== CRUD DE CURSOS ==========
function getCursos() {
  return JSON.parse(localStorage.getItem("adpel_cursos")) || [];
}
function saveCursos(cursos) {
  localStorage.setItem("adpel_cursos", JSON.stringify(cursos));
}
function renderCursosCRUD() {
  const container = document.getElementById("cursos-crud");
  if (!container) return;
  container.innerHTML = `
    <button onclick="abrirModalCurso()" class="bg-[#a259ff] text-white px-4 py-2 rounded mb-4 font-bold flex items-center gap-2">
      <i class="fas fa-plus"></i> Novo Curso
    </button>
    <div id="admin-cursos-list"></div>
  `;
  renderCursosAdmin();
}
function renderCursosAdmin() {
  const cursos = getCursos();
  const list = document.getElementById("admin-cursos-list");
  list.innerHTML = "";
  if (!cursos.length) {
    list.innerHTML = `<div class="text-gray-500 text-center col-span-full">Nenhum curso cadastrado ainda.</div>`;
    return;
  }
  cursos.slice().reverse().forEach((cu, i) => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col hover:scale-[1.01] transition mb-4";
    card.innerHTML = `
      <img src="${cu.img}" alt="Imagem do curso" class="w-full h-32 object-cover" />
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="text-lg font-bold mb-2">${safeHtml(cu.title)}</h3>
        <p class="mb-2 text-sm">${safeHtml(cu.desc)}</p>
        <div class="flex flex-wrap gap-2 mt-auto">
          <button class="bg-[#a259ff] text-white text-xs px-3 py-1 rounded editar">Editar</button>
          <button class="bg-red-500 text-white text-xs px-3 py-1 rounded remover">Remover</button>
        </div>
      </div>
    `;
    card.querySelector('.editar').onclick = () => abrirModalCurso(cu);
    card.querySelector('.remover').onclick = () => {
      if (confirm("Remover este curso?")) {
        let cursos = getCursos();
        cursos = cursos.filter(x => String(x.id) !== String(cu.id));
        saveCursos(cursos);
        renderCursosAdmin();
      }
    };
    list.appendChild(card);
  });
}
function abrirModalCurso(editData = null) {
  window.modulosTemp = JSON.parse(JSON.stringify(editData?.modulos || []));
  const modal = document.createElement('div');
  modal.className = "fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl p-6 relative animate-fade-in" onclick="event.stopPropagation()">
      <h2 class="text-2xl font-bold mb-3 text-[#a259ff]">${editData ? 'Editar Curso' : 'Novo Curso'}</h2>
      <label class="block mb-1 text-sm">Título:</label>
      <input id="curso-titulo" class="w-full mb-2 p-2 rounded bg-gray-800" placeholder="Título do curso" value="${editData?.title || ''}">
      <label class="block mb-1 text-sm">URL/Arquivo da Imagem:</label>
      <input id="curso-img" class="w-full mb-2 p-2 rounded bg-gray-800" placeholder="URL ou selecione imagem" value="${editData?.img || ''}">
      <label class="block mb-1 text-sm">Descrição:</label>
      <textarea id="curso-desc" class="w-full mb-2 p-2 rounded bg-gray-800" placeholder="Descrição do curso">${editData?.desc || ''}</textarea>
      <div class="my-4">
        <h3 class="text-lg font-bold text-[#a259ff] mb-2">Módulos</h3>
        <div id="modulos-area"></div>
        <button class="bg-[#a259ff] text-white text-xs px-2 py-1 rounded mt-2" onclick="addModulo()">Adicionar Módulo</button>
      </div>
      <div class="flex justify-end gap-2 mt-3">
        <button class="bg-gray-700 text-white px-4 py-2 rounded" onclick="fecharModalAdmin()">Cancelar</button>
        <button class="bg-green-600 text-white px-4 py-2 rounded" onclick="salvarCurso(${editData?.id ? `'${editData.id}'` : 'null'})">${editData ? 'Salvar Alterações' : 'Salvar Curso'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  renderModulos(window.modulosTemp);
}
function fecharModalAdmin() {
  document.querySelectorAll('.fixed.bg-black.bg-opacity-60').forEach(modal => modal.remove());
}
function addModulo(moduloData = {nome:'',aulas:[]}) {
  window.modulosTemp.push(moduloData);
  renderModulos(window.modulosTemp);
}
function removeModulo(idx) {
  window.modulosTemp.splice(idx, 1);
  renderModulos(window.modulosTemp);
}
function addAula(moduloIdx, aulaData = {titulo:'',desc:'',link:''}) {
  window.modulosTemp[moduloIdx].aulas = window.modulosTemp[moduloIdx].aulas || [];
  window.modulosTemp[moduloIdx].aulas.push(aulaData);
  renderModulos(window.modulosTemp);
}
function removeAula(moduloIdx, aulaIdx) {
  window.modulosTemp[moduloIdx].aulas.splice(aulaIdx, 1);
  renderModulos(window.modulosTemp);
}
function renderModulos(modulos) {
  let html = modulos.map((m, idx) => `
    <div class="bg-gray-800 p-3 mb-4 rounded-lg shadow">
      <div class="flex items-center mb-2 gap-2">
        <input class="flex-1 p-2 rounded bg-gray-900" placeholder="Nome do módulo" value="${safeHtml(m.nome||'')}" onchange="window.modulosTemp[${idx}].nome=this.value">
        <button onclick="removeModulo(${idx})" class="text-red-400 px-2 py-1 rounded hover:bg-red-900">&times;</button>
      </div>
      <div>
        ${(m.aulas||[]).map((a,j) => `
          <div class="flex gap-2 items-center mb-1">
            <input class="p-1 bg-gray-900 rounded text-xs w-28" placeholder="Título" value="${safeHtml(a.titulo||'')}" onchange="window.modulosTemp[${idx}].aulas[${j}].titulo=this.value">
            <input class="p-1 bg-gray-900 rounded text-xs w-32" placeholder="Descrição" value="${safeHtml(a.desc||'')}" onchange="window.modulosTemp[${idx}].aulas[${j}].desc=this.value">
            <input class="p-1 bg-gray-900 rounded text-xs flex-1" placeholder="Link do YouTube" value="${safeHtml(a.link||'')}" onchange="window.modulosTemp[${idx}].aulas[${j}].link=this.value">
            <button onclick="removeAula(${idx},${j})" class="text-red-400 px-1 py-1 rounded hover:bg-red-900">&times;</button>
          </div>
        `).join('')}
      </div>
      <button onclick="addAula(${idx})" class="mt-2 bg-[#a259ff] text-white text-xs px-2 py-1 rounded">Adicionar Aula</button>
    </div>
  `).join('');
  document.getElementById('modulos-area').innerHTML = html;
}
function salvarCurso(editId=null) {
  let titulo = document.getElementById('curso-titulo').value.trim();
  let img = document.getElementById('curso-img').value.trim();
  let desc = document.getElementById('curso-desc').value.trim();
  if (!titulo || !img || !desc || !window.modulosTemp.length) {
    alert("Preencha todos os campos e ao menos 1 módulo com 1 aula!");
    return;
  }
  let cursos = getCursos();
  let id = editId!==null && editId!=='null' ? editId : Date.now();
  let cursoObj = { id, title: titulo, img, desc, modulos: JSON.parse(JSON.stringify(window.modulosTemp)) };
  if(editId!==null && editId!=='null') {
    let idx = cursos.findIndex(c=>String(c.id)===String(editId));
    if(idx!==-1) cursos[idx] = cursoObj;
  } else {
    cursos.push(cursoObj);
  }
  saveCursos(cursos);
  fecharModalAdmin();
  renderCursosAdmin();
}

// ========== CRUD DE NOTÍCIAS ==========
function getNoticias() {
  return JSON.parse(localStorage.getItem("adpel_noticias")) || [];
}
function saveNoticias(noticias) {
  localStorage.setItem("adpel_noticias", JSON.stringify(noticias));
}
function renderNoticiasCRUD() {
  const container = document.getElementById("noticias-crud");
  if (!container) return;
  container.innerHTML = `
    <form id="noticia-form" class="bg-gray-800 p-4 rounded-lg shadow-lg mb-8 flex flex-col md:flex-row md:items-end gap-4">
      <div class="flex-1">
        <label class="block mb-1 font-semibold">Título</label>
        <input required id="noticia-title" type="text" class="w-full p-2 rounded bg-gray-700 text-gray-200" placeholder="Título da notícia"/>
      </div>
      <div class="flex-1">
        <label class="block mb-1 font-semibold">Descrição</label>
        <input required id="noticia-desc" type="text" class="w-full p-2 rounded bg-gray-700 text-gray-200" placeholder="Descrição"/>
      </div>
      <div>
        <label class="block mb-1 font-semibold">Imagem <span class="text-yellow-400">(obrigatória)</span></label>
        <input required id="noticia-img" type="file" accept="image/*" class="text-gray-200"/>
      </div>
      <button type="submit" class="bg-[#a259ff] hover:bg-violet-700 text-white font-bold py-2 px-4 rounded">Adicionar</button>
    </form>
    <div id="noticias-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
  `;
  renderNoticiasCards();
  document.getElementById("noticia-form").onsubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById("noticia-title").value.trim();
    const desc = document.getElementById("noticia-desc").value.trim();
    const fileInput = document.getElementById("noticia-img");
    const file = fileInput.files[0];
    if (!file) return alert("Imagem obrigatória!");
    const reader = new FileReader();
    reader.onload = function(evt) {
      const noticias = getNoticias();
      noticias.push({ title, desc, img: evt.target.result });
      saveNoticias(noticias);
      renderNoticiasCards();
      document.getElementById("noticia-form").reset();
    };
    reader.readAsDataURL(file);
  };
}
function renderNoticiasCards() {
  const noticias = getNoticias();
  const list = document.getElementById("noticias-list");
  if (!list) return;
  list.innerHTML = "";
  noticias.slice().reverse().forEach((no, idx) => {
    const realIdx = noticias.length - 1 - idx;
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col";
    card.innerHTML = `
      <img src="${no.img}" alt="Imagem da notícia" class="w-full h-40 object-cover cursor-pointer visualizar-img"/>
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="text-lg font-bold mb-2">${no.title}</h3>
        <p class="mb-4 flex-1">${no.desc}</p>
        <div class="flex gap-2 mt-auto">
          <button class="editar bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded" data-index="${realIdx}">Editar</button>
          <button class="remover bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded" data-index="${realIdx}">Remover</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll(".visualizar-img").forEach((img, idx) => {
    img.onclick = () => abrirImagem(noticias[noticias.length-1-idx].img);
  });
  list.querySelectorAll(".remover").forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute("data-index"));
      if (confirm("Remover esta notícia?")) {
        const noticias = getNoticias();
        noticias.splice(idx, 1);
        saveNoticias(noticias);
        renderNoticiasCards();
      }
    };
  });
  list.querySelectorAll(".editar").forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute("data-index"));
      editarNoticia(idx);
    };
  });
}
function editarNoticia(idx) {
  const noticias = getNoticias();
  const no = noticias[idx];
  if (!no) return;
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50";
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md relative">
      <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-gray-200 text-2xl">&times;</button>
      <h3 class="text-xl font-bold mb-4">Editar Notícia</h3>
      <form id="editar-noticia-form">
        <label class="block mb-2 font-semibold">Título</label>
        <input required type="text" id="edit-noticia-title" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-4" value="${no.title}"/>
        <label class="block mb-2 font-semibold">Descrição</label>
        <input required type="text" id="edit-noticia-desc" class="w-full p-2 rounded bg-gray-700 text-gray-200 mb-4" value="${no.desc}"/>
        <label class="block mb-2 font-semibold">Nova Imagem <span class="text-gray-400">(opcional)</span></label>
        <input type="file" id="edit-noticia-img" accept="image/*" class="mb-4 text-gray-200"/>
        <button type="submit" class="bg-[#a259ff] hover:bg-violet-700 text-white font-bold py-2 px-4 rounded">Salvar</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("editar-noticia-form").onsubmit = function(e) {
    e.preventDefault();
    no.title = document.getElementById("edit-noticia-title").value.trim();
    no.desc = document.getElementById("edit-noticia-desc").value.trim();
    const file = document.getElementById("edit-noticia-img").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        no.img = evt.target.result;
        noticias[idx] = no;
        saveNoticias(noticias);
        renderNoticiasCards();
        modal.remove();
      };
      reader.readAsDataURL(file);
    } else {
      noticias[idx] = no;
      saveNoticias(noticias);
      renderNoticiasCards();
      modal.remove();
    }
  };
}

// ========== MODAL DE IMAGEM ==========
function abrirImagem(src) {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50";
  modal.innerHTML = `
    <img src="${src}" class="max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl border-4 border-[#a259ff]" />
    <button onclick="this.parentElement.remove()" class="absolute top-8 right-8 text-white text-3xl font-bold">&times;</button>
  `;
  document.body.appendChild(modal);
}
