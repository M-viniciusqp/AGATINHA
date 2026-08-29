/**
 * LÓGICA DO SITE PÚBLICO
 * Lê nome/cargo/tagline/serviços de siteConfig (config.js) e o resto
 * (bio, fotos, contato, categorias, projetos) do Firestore — tudo
 * editável pelo painel admin, sem precisar mexer em código.
 */

document.addEventListener("DOMContentLoaded", () => {
  aplicarConfigEstatico();
  configurarMenuMobile();
  configurarPreviewFlutuante();
  configurarModal();
  configurarFormularioContato();
  escutarConfiguracaoSite();
  carregarProjetos();
});

let todosProjetos = [];
let categoriaAtiva = "todos";
let categoriasDisponiveis = [];
let configuracaoSite = {};

const CONFIG_REF = db.collection("configuracao").doc("site");

/* ---------- O que vem do config.js (fixo) ---------- */
function aplicarConfigEstatico() {
  document.title = `${siteConfig.nome} — ${siteConfig.cargo}`;

  set("marcaNome", siteConfig.nome);
  set("heroNome", siteConfig.nome);
  set("heroTagline", siteConfig.tagline);
  set("sobreEyebrow", siteConfig.bioTitulo);
  set("rodapeNome", `${siteConfig.nome} · ${siteConfig.cargo}`);
  set("rodapeAno", `© ${siteConfig.anoFundacao}–${new Date().getFullYear()}`);

  const servicosEl = document.getElementById("sobreServicos");
  if (servicosEl) {
    servicosEl.innerHTML = siteConfig.servicos.map((s) => `<li>${s}</li>`).join("");
  }
}

function set(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

/* ---------- O que vem do Firestore (editável no painel) ---------- */
function escutarConfiguracaoSite() {
  CONFIG_REF.onSnapshot((doc) => {
    configuracaoSite = doc.exists ? doc.data() : {};
    aplicarConfiguracaoSite();

    const novasCategorias = configuracaoSite.categorias || [];
    if (JSON.stringify(novasCategorias) !== JSON.stringify(categoriasDisponiveis)) {
      categoriasDisponiveis = novasCategorias;
      montarFiltros();
      renderizarProjetos();
    }
  });
}

function aplicarConfiguracaoSite() {
  const bioEl = document.getElementById("sobreParagrafo");
  if (bioEl) bioEl.textContent = configuracaoSite.bio || "";

  const foto = document.getElementById("sobreFoto");
  if (foto) foto.src = configuracaoSite.fotoSobre || "";

  const fundo = document.getElementById("heroFundo");
  if (fundo) {
    fundo.style.backgroundImage = configuracaoSite.fotoTopo
      ? `url('${configuracaoSite.fotoTopo}')`
      : "none";
  }

  const linkEmail = document.getElementById("linkEmail");
  if (linkEmail && configuracaoSite.email) {
    linkEmail.href = `mailto:${configuracaoSite.email}`;
    linkEmail.textContent = configuracaoSite.email;
  }
  const linkInsta = document.getElementById("linkInstagram");
  if (linkInsta && configuracaoSite.instagram) linkInsta.href = configuracaoSite.instagram;

  const trilha = document.getElementById("marqueeTrilha");
  if (trilha) {
    const cats = configuracaoSite.categorias || [];
    const itens = [...cats, ...cats].map((c) => `<span>${escapeHtml(c)}</span>`).join("");
    trilha.innerHTML = itens;
  }
}

/* ---------- Filtros de categoria (dinâmicos) ---------- */
function montarFiltros() {
  const container = document.getElementById("filtros");
  if (!container) return;

  container.innerHTML = `<button class="filtro-botao ativo" data-categoria="todos">Todos</button>`;
  categoriasDisponiveis.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filtro-botao";
    btn.dataset.categoria = cat;
    btn.textContent = cat;
    container.appendChild(btn);
  });

  container.onclick = (e) => {
    const btn = e.target.closest(".filtro-botao");
    if (!btn) return;
    categoriaAtiva = btn.dataset.categoria;
    container
      .querySelectorAll(".filtro-botao")
      .forEach((b) => b.classList.toggle("ativo", b === btn));
    renderizarProjetos();
  };
}

/* ---------- Firestore: projetos ---------- */
function carregarProjetos() {
  db.collection("projetos")
    .orderBy("ordem", "asc")
    .onSnapshot(
      (snapshot) => {
        todosProjetos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderizarProjetos();
      },
      (erro) => {
        console.error("Erro ao carregar projetos:", erro);
        const lista = document.getElementById("listaTrabalhos");
        if (lista) {
          lista.innerHTML = `<li class="trabalhos-vazio">Não foi possível carregar os projetos agora.</li>`;
        }
      }
    );
}

function renderizarProjetos() {
  const lista = document.getElementById("listaTrabalhos");
  if (!lista) return;

  const filtrados =
    categoriaAtiva === "todos"
      ? todosProjetos
      : todosProjetos.filter((p) => p.categoria === categoriaAtiva);

  if (filtrados.length === 0) {
    lista.innerHTML = `<li class="trabalhos-vazio">Nenhum projeto por aqui ainda.</li>`;
    return;
  }

  lista.innerHTML = filtrados
    .map((p, i) => {
      const numero = String(i + 1).padStart(2, "0");
      return `
        <li class="trabalho-item"
            data-id="${p.id}"
            data-img="${p.imagemUrl || ""}">
          <span class="trabalho-numero">${numero}</span>
          <span class="trabalho-titulo">${escapeHtml(p.titulo || "Sem título")}</span>
          <span class="trabalho-cliente">${escapeHtml(p.cliente || "")}</span>
          <span class="trabalho-ano">${p.ano || ""}</span>
          <span class="trabalho-seta">→</span>
          <div class="trabalho-thumb-inline" style="background-image:url('${p.imagemUrl || ""}')"></div>
        </li>`;
    })
    .join("");

  lista.querySelectorAll(".trabalho-item").forEach((item) => {
    item.addEventListener("click", () => abrirModal(item.dataset.id));
  });
}

/* ---------- Preview flutuante (segue o cursor, só desktop) ---------- */
function configurarPreviewFlutuante() {
  const preview = document.getElementById("previewFlutuante");
  const lista = document.getElementById("listaTrabalhos");
  if (!preview || !lista || window.matchMedia("(hover: none)").matches) return;

  lista.addEventListener("mouseover", (e) => {
    const item = e.target.closest(".trabalho-item");
    if (!item) return;
    const img = item.dataset.img;
    if (!img) return;
    preview.style.backgroundImage = `url('${img}')`;
    preview.classList.add("visivel");
  });

  lista.addEventListener("mousemove", (e) => {
    preview.style.left = `${e.clientX}px`;
    preview.style.top = `${e.clientY}px`;
  });

  lista.addEventListener("mouseleave", () => {
    preview.classList.remove("visivel");
  });
}

/* ---------- Modal / lightbox ---------- */
function configurarModal() {
  const modal = document.getElementById("modalProjeto");
  const fechar = document.getElementById("modalFechar");
  if (!modal || !fechar) return;

  fechar.addEventListener("click", fecharModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
  });
}

function extrairEmbedVideo(url) {
  if (!url) return null;
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function abrirModal(id) {
  const projeto = todosProjetos.find((p) => p.id === id);
  if (!projeto) return;

  document.getElementById("modalCategoria").textContent = projeto.categoria || "";
  document.getElementById("modalTitulo").textContent = projeto.titulo || "";
  document.getElementById("modalDescricao").textContent = projeto.descricao || "";

  const modalImagem = document.getElementById("modalImagem");
  const embedVideo = extrairEmbedVideo(projeto.videoUrl);
  if (embedVideo) {
    modalImagem.style.backgroundImage = "none";
    modalImagem.innerHTML = `<iframe src="${embedVideo}" title="${escapeHtml(projeto.titulo || "Vídeo do projeto")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  } else {
    modalImagem.innerHTML = "";
    modalImagem.style.backgroundImage = projeto.imagemUrl ? `url('${projeto.imagemUrl}')` : "none";
  }

  const videoBtn = document.getElementById("modalVideoLink");
  if (projeto.videoUrl && !embedVideo) {
    videoBtn.href = projeto.videoUrl;
    videoBtn.textContent = "Assistir vídeo ↗";
    videoBtn.hidden = false;
  } else if (projeto.videoUrl && embedVideo) {
    videoBtn.href = projeto.videoUrl;
    videoBtn.textContent = "Abrir no YouTube/Vimeo ↗";
    videoBtn.hidden = false;
  } else {
    videoBtn.hidden = true;
  }

  const modal = document.getElementById("modalProjeto");
  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function fecharModal() {
  const modal = document.getElementById("modalProjeto");
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ---------- Menu mobile ---------- */
function configurarMenuMobile() {
  const botao = document.getElementById("botaoMenuMobile");
  const menu = document.getElementById("menuMobile");
  if (!botao || !menu) return;

  botao.addEventListener("click", () => menu.classList.toggle("aberto"));
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => menu.classList.remove("aberto"))
  );
}

/* ---------- Formulário de contato -> WhatsApp ---------- */
function configurarFormularioContato() {
  const form = document.getElementById("formularioContato");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("campoNome").value.trim();
    const empresa = document.getElementById("campoEmpresa").value.trim();
    const mensagem = document.getElementById("campoMensagem").value.trim();

    let texto = `Olá! Me chamo ${nome}`;
    if (empresa) texto += `, da ${empresa}`;
    texto += `. ${mensagem}`;

    const numero = configuracaoSite.whatsapp || "";
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
