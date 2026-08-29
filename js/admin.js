/**
 * LÓGICA DO PAINEL ADMIN
 * Sem login — o painel abre direto (veja o README.md pra entender
 * o que isso significa em termos de segurança).
 *
 * Três coisas editáveis, todas salvas no Firestore:
 * 1) Configurações do site (bio, fotos, contato) → configuracao/site
 * 2) Categorias (lista livre, criada por você) → configuracao/site.categorias
 * 3) Projetos (coleção "projetos", como antes)
 */

let projetosCache = [];
let categoriasCache = [];

const CONFIG_REF = db.collection("configuracao").doc("site");

document.addEventListener("DOMContentLoaded", () => {
  configurarConfiguracoesSite();
  configurarCategorias();
  configurarSelectCategoriaCustom();
  configurarPreviewImagemUrl();
  configurarFormularioProjeto();
  configurarCancelarEdicao();
  escutarProjetos();
});

/* ---------- Configurações gerais do site ---------- */
function configurarConfiguracoesSite() {
  CONFIG_REF.get().then((doc) => {
    const dados = doc.exists ? doc.data() : {};
    document.getElementById("configBio").value = dados.bio || "";
    document.getElementById("configFotoTopo").value = dados.fotoTopo || "";
    document.getElementById("configWhatsapp").value = dados.whatsapp || "";
    document.getElementById("configInstagram").value = dados.instagram || "";
    document.getElementById("configEmail").value = dados.email || "";
  });

  const form = document.getElementById("formularioConfig");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("configStatus");
    const botao = document.getElementById("botaoSalvarConfig");
    botao.disabled = true;
    status.textContent = "Salvando…";

    try {
      await CONFIG_REF.set(
        {
          bio: document.getElementById("configBio").value.trim(),
          fotoTopo: document.getElementById("configFotoTopo").value.trim(),
          whatsapp: document.getElementById("configWhatsapp").value.trim(),
          instagram: document.getElementById("configInstagram").value.trim(),
          email: document.getElementById("configEmail").value.trim(),
        },
        { merge: true }
      );
      status.textContent = "Configurações salvas!";
    } catch (err) {
      console.error(err);
      status.textContent = "Erro ao salvar. Tente novamente.";
    } finally {
      botao.disabled = false;
    }
  });
}

/* ---------- Categorias (lista livre) ---------- */
function configurarCategorias() {
  CONFIG_REF.onSnapshot((doc) => {
    const dados = doc.exists ? doc.data() : {};
    categoriasCache = dados.categorias || [];
    renderizarCategorias();
    montarSelectCategorias();
  });

  document.getElementById("formularioCategoria").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("campoNovaCategoria");
    const nome = input.value.trim();
    if (!nome) return;
    if (categoriasCache.includes(nome)) {
      input.value = "";
      return;
    }
    input.value = "";
    await CONFIG_REF.set(
      { categorias: firebase.firestore.FieldValue.arrayUnion(nome) },
      { merge: true }
    );
  });
}

function renderizarCategorias() {
  const container = document.getElementById("listaCategorias");
  const vazio = document.getElementById("categoriasVazio");

  if (categoriasCache.length === 0) {
    container.innerHTML = "";
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  container.innerHTML = categoriasCache
    .map(
      (cat) => `
      <span class="admin-tag">
        ${escapeHtmlAdmin(cat)}
        <button type="button" data-remover-categoria="${escapeHtmlAdmin(cat)}" aria-label="Remover categoria">✕</button>
      </span>`
    )
    .join("");

  container.querySelectorAll("[data-remover-categoria]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const nome = btn.dataset.removerCategoria;
      const confirmar = confirm(`Remover a categoria "${nome}"? Projetos que já usam ela mantêm o nome salvo, só não aparece mais na lista pra escolher.`);
      if (!confirmar) return;
      await CONFIG_REF.set(
        { categorias: firebase.firestore.FieldValue.arrayRemove(nome) },
        { merge: true }
      );
    });
  });
}

function montarSelectCategorias() {
  const lista = document.getElementById("categoriaSelectLista");
  const hidden = document.getElementById("campoCategoria");
  if (!lista || !hidden) return;

  const opcoes = ["", ...categoriasCache];
  lista.innerHTML = opcoes
    .map((c) => {
      const rotulo = c === "" ? "Sem categoria" : escapeHtmlAdmin(c);
      const selecionada = c === hidden.value ? "selecionada" : "";
      return `<li data-valor="${escapeHtmlAdmin(c)}" class="${selecionada}">${rotulo}</li>`;
    })
    .join("");

  lista.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      definirCategoriaSelecionada(item.dataset.valor);
      fecharSelectCategoria();
    });
  });

  // Se a categoria atual não existe mais na lista, mostra "Sem categoria"
  if (hidden.value && !categoriasCache.includes(hidden.value)) {
    definirCategoriaSelecionada(hidden.value); // mantém o texto salvo mesmo assim
  }
}

function definirCategoriaSelecionada(valor) {
  document.getElementById("campoCategoria").value = valor;
  document.getElementById("categoriaSelectTexto").textContent = valor || "Sem categoria";
}

function configurarSelectCategoriaCustom() {
  const botao = document.getElementById("categoriaSelectBotao");
  const lista = document.getElementById("categoriaSelectLista");
  if (!botao || !lista) return;

  botao.addEventListener("click", (e) => {
    e.stopPropagation();
    const abrindo = lista.hidden;
    lista.hidden = !abrindo;
    botao.classList.toggle("aberto", abrindo);
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("categoriaSelectCustom").contains(e.target)) {
      fecharSelectCategoria();
    }
  });
}

function fecharSelectCategoria() {
  const botao = document.getElementById("categoriaSelectBotao");
  const lista = document.getElementById("categoriaSelectLista");
  if (!botao || !lista) return;
  lista.hidden = true;
  botao.classList.remove("aberto");
}

/* ---------- Pré-visualização da imagem (a partir do link colado) ---------- */
function configurarPreviewImagemUrl() {
  const input = document.getElementById("campoImagemUrl");
  const preview = document.getElementById("previewImagem");
  const previewTag = document.getElementById("previewImagemTag");

  input.addEventListener("input", () => {
    const url = input.value.trim();
    if (!url) {
      preview.hidden = true;
      return;
    }
    previewTag.src = url;
    preview.hidden = false;
  });
}

/* ---------- Lista de projetos em tempo real ---------- */
function escutarProjetos() {
  db.collection("projetos")
    .orderBy("ordem", "asc")
    .onSnapshot((snapshot) => {
      projetosCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderizarListaAdmin();
    });
}

function renderizarListaAdmin() {
  const container = document.getElementById("adminLista");
  const vazio = document.getElementById("adminListaVazio");

  if (projetosCache.length === 0) {
    container.innerHTML = "";
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  container.innerHTML = projetosCache
    .map(
      (p) => `
      <div class="admin-lista-item">
        <div class="admin-lista-thumb" style="background-image:url('${p.imagemUrl || ""}')"></div>
        <div>
          <div class="admin-lista-info-titulo">${escapeHtmlAdmin(p.titulo || "Sem título")}</div>
          <div class="admin-lista-info-sub">${escapeHtmlAdmin(p.categoria || "Sem categoria")} · ${p.ano || "—"}</div>
        </div>
        <div class="admin-lista-acoes">
          <button type="button" data-editar="${p.id}">Editar</button>
          <button type="button" class="excluir" data-excluir="${p.id}">Excluir</button>
        </div>
      </div>`
    )
    .join("");

  container.querySelectorAll("[data-editar]").forEach((btn) =>
    btn.addEventListener("click", () => preencherFormularioParaEdicao(btn.dataset.editar))
  );
  container.querySelectorAll("[data-excluir]").forEach((btn) =>
    btn.addEventListener("click", () => excluirProjeto(btn.dataset.excluir))
  );
}

/* ---------- Criar / editar projeto ---------- */
function configurarFormularioProjeto() {
  const form = document.getElementById("formularioProjeto");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("formStatus");
    const botaoSalvar = document.getElementById("botaoSalvar");
    status.textContent = "";

    const id = document.getElementById("projetoId").value;
    const anoValor = document.getElementById("campoAno").value;
    const dados = {
      titulo: document.getElementById("campoTitulo").value.trim(),
      cliente: document.getElementById("campoCliente").value.trim(),
      categoria: document.getElementById("campoCategoria").value,
      ano: anoValor ? Number(anoValor) : null,
      descricao: document.getElementById("campoDescricao").value.trim(),
      videoUrl: document.getElementById("campoVideo").value.trim(),
      imagemUrl: document.getElementById("campoImagemUrl").value.trim(),
      ordem: Number(document.getElementById("campoOrdem").value) || 0,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    botaoSalvar.disabled = true;
    status.textContent = "Salvando…";

    try {
      if (id) {
        await db.collection("projetos").doc(id).update(dados);
      } else {
        dados.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("projetos").add(dados);
      }

      status.textContent = "Projeto salvo!";
      resetarFormulario();
    } catch (err) {
      console.error(err);
      status.textContent = "Erro ao salvar. Tente novamente.";
    } finally {
      botaoSalvar.disabled = false;
    }
  });
}

function preencherFormularioParaEdicao(id) {
  const p = projetosCache.find((item) => item.id === id);
  if (!p) return;

  document.getElementById("projetoId").value = p.id;
  document.getElementById("campoTitulo").value = p.titulo || "";
  document.getElementById("campoCliente").value = p.cliente || "";
  montarSelectCategorias();
  definirCategoriaSelecionada(p.categoria || "");
  document.getElementById("campoAno").value = p.ano || "";
  document.getElementById("campoDescricao").value = p.descricao || "";
  document.getElementById("campoVideo").value = p.videoUrl || "";
  document.getElementById("campoImagemUrl").value = p.imagemUrl || "";
  document.getElementById("campoOrdem").value = p.ordem || 0;

  const preview = document.getElementById("previewImagem");
  const previewTag = document.getElementById("previewImagemTag");
  if (p.imagemUrl) {
    previewTag.src = p.imagemUrl;
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }

  document.getElementById("formTitulo").textContent = "Editar projeto";
  document.getElementById("botaoCancelarEdicao").hidden = false;
  document.getElementById("formularioProjeto").scrollIntoView({ behavior: "smooth" });
}

function configurarCancelarEdicao() {
  document.getElementById("botaoCancelarEdicao").addEventListener("click", resetarFormulario);
}

function resetarFormulario() {
  document.getElementById("formularioProjeto").reset();
  document.getElementById("projetoId").value = "";
  definirCategoriaSelecionada("");
  document.getElementById("previewImagem").hidden = true;
  document.getElementById("formTitulo").textContent = "Novo projeto";
  document.getElementById("botaoCancelarEdicao").hidden = true;
}

async function excluirProjeto(id) {
  const confirmar = confirm("Excluir este projeto? Essa ação não pode ser desfeita.");
  if (!confirmar) return;
  try {
    await db.collection("projetos").doc(id).delete();
  } catch (err) {
    console.error(err);
    alert("Não foi possível excluir. Tente novamente.");
  }
}

function escapeHtmlAdmin(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
