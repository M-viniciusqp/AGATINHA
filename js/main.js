/**
 * LÓGICA DO SITE PÚBLICO
 * Lê os textos de siteConfig (config.js) e os projetos do Firestore
 * (coleção "projetos", escrita apenas pelo painel admin).
 */

document.addEventListener("DOMContentLoaded", () => {
  aplicarConfig();
  montarFiltros();
  configurarMenuMobile();
  configurarPreviewFlutuante();
  configurarModal();
  configurarFormularioContato();
  carregarProjetos();
});

let todosProjetos = [];
let categoriaAtiva = "todos";

/* ---------- Config estático (texto/links) ---------- */
function aplicarConfig() {
  document.title = `${siteConfig.nome} — ${siteConfig.cargo}`;

  set("marcaNome", siteConfig.nome);
  set("heroNome", siteConfig.nome);
  set("heroTagline", siteConfig.tagline);
  set("sobreEyebrow", siteConfig.bioTitulo);
  set("sobreParagrafo", siteConfig.bio);
  set("rodapeNome", `${siteConfig.nome} · ${siteConfig.cargo}`);
  set("rodapeAno", `© ${siteConfig.anoFundacao}–${new Date().getFullYear()}`);

  const foto = document.getElementById("sobreFoto");
  if (foto) foto.src = siteConfig.fotoSobre;

  const servicosEl = document.getElementById("sobreServicos");
  if (servicosEl) {
    servicosEl.innerHTML = siteConfig.servicos
      .map((s) => `<li>${s}</li>`)
      .join("");
  }

  ["botaoDriveTopo", "botaoDriveMobile", "botaoDriveContato"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = siteConfig.driveLink;
  });

  const linkEmail = document.getElementById("linkEmail");
  if (linkEmail) {
    linkEmail.href = `mailto:${siteConfig.email}`;
    linkEmail.textContent = siteConfig.email;
  }
  const linkInsta = document.getElementById("linkInstagram");
  if (linkInsta) linkInsta.href = siteConfig.instagram;

  const trilha = document.getElementById("marqueeTrilha");
  if (trilha) {
    const itens = [...siteConfig.categorias, ...siteConfig.categorias]
      .map((c) => `<span>${c}</span>`)
      .join("");
    trilha.innerHTML = itens;
  }
}

function set(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

/* ---------- Filtros de categoria ---------- */
function montarFiltros() {
  const container = document.getElementById("filtros");
  if (!container) return;
  siteConfig.categorias.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filtro-botao";
    btn.dataset.categoria = cat;
    btn.textContent = cat;
    container.appendChild(btn);
  });

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".filtro-botao");
    if (!btn) return;
    categoriaAtiva = btn.dataset.categoria;
    container
      .querySelectorAll(".filtro-botao")
      .forEach((b) => b.classList.toggle("ativo", b === btn));
    renderizarProjetos();
  });
}

/* ---------- Firestore ---------- */
function carregarProjetos() {
  db.collection("projetos")
    .orderBy("ordem", "asc")
    .onSnapshot(
      (snapshot) => {
        todosProjetos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderizarProjetos();
        montarHeroFundo();
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
    lista.innerHTML = `<li class="trabalhos-vazio">Nenhum projeto nessa categoria ainda.</li>`;
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

function montarHeroFundo() {
  const fundo = document.getElementById("heroFundo");
  if (!fundo) return;
  const destaques = todosProjetos.filter((p) => p.destaque && p.imagemUrl);
  const lista = destaques.length ? destaques : todosProjetos.filter((p) => p.imagemUrl);
  if (!lista.length) return;

  let indice = 0;
  const aplicar = () => {
    fundo.style.backgroundImage = `url('${lista[indice].imagemUrl}')`;
    indice = (indice + 1) % lista.length;
  };
  aplicar();
  if (lista.length > 1) setInterval(aplicar, 5000);
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

function abrirModal(id) {
  const projeto = todosProjetos.find((p) => p.id === id);
  if (!projeto) return;

  document.getElementById("modalCategoria").textContent = projeto.categoria || "";
  document.getElementById("modalTitulo").textContent = projeto.titulo || "";
  document.getElementById("modalDescricao").textContent = projeto.descricao || "";
  document.getElementById("modalImagem").style.backgroundImage = projeto.imagemUrl
    ? `url('${projeto.imagemUrl}')`
    : "none";

  const driveBtn = document.getElementById("modalDriveLink");
  if (projeto.driveLink) {
    driveBtn.href = projeto.driveLink;
    driveBtn.hidden = false;
  } else {
    driveBtn.hidden = true;
  }

  const videoBtn = document.getElementById("modalVideoLink");
  if (projeto.videoUrl) {
    videoBtn.href = projeto.videoUrl;
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

    const url = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
