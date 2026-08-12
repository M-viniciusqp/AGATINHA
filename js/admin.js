/**
 * LÓGICA DO PAINEL ADMIN
 * Login com Firebase Auth (e-mail/senha) + CRUD da coleção "projetos"
 * no Firestore. A imagem de capa entra por link (sem Storage, que
 * agora exige plano pago).
 */

let projetosCache = [];

document.addEventListener("DOMContentLoaded", () => {
  montarSelectCategorias();
  configurarLogin();
  configurarPreviewImagemUrl();
  configurarFormularioProjeto();
  configurarCancelarEdicao();
});

/* ---------- Autenticação ---------- */
function configurarLogin() {
  const form = document.getElementById("formularioLogin");
  const erro = document.getElementById("loginErro");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    erro.textContent = "";
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

    auth.signInWithEmailAndPassword(email, senha).catch((err) => {
      erro.textContent = traduzirErroAuth(err.code);
    });
  });

  document.getElementById("botaoSair").addEventListener("click", () => {
    auth.signOut();
  });

  auth.onAuthStateChanged((usuario) => {
    const telaLogin = document.getElementById("telaLogin");
    const telaPainel = document.getElementById("telaPainel");
    if (usuario) {
      telaLogin.hidden = true;
      telaPainel.hidden = false;
      escutarProjetos();
    } else {
      telaLogin.hidden = false;
      telaPainel.hidden = true;
    }
  });
}

function traduzirErroAuth(code) {
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Tente de novo em instantes.",
  };
  return mapa[code] || "Não foi possível entrar. Confira os dados.";
}

/* ---------- Categorias no select ---------- */
function montarSelectCategorias() {
  const select = document.getElementById("campoCategoria");
  if (!select) return;
  select.innerHTML = siteConfig.categorias
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
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
          <div class="admin-lista-info-titulo">${p.titulo || "Sem título"}</div>
          <div class="admin-lista-info-sub">${p.categoria || "—"} · ${p.ano || "—"}${p.destaque ? " · destaque" : ""}</div>
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
    const dados = {
      titulo: document.getElementById("campoTitulo").value.trim(),
      cliente: document.getElementById("campoCliente").value.trim(),
      categoria: document.getElementById("campoCategoria").value,
      ano: Number(document.getElementById("campoAno").value),
      descricao: document.getElementById("campoDescricao").value.trim(),
      driveLink: document.getElementById("campoDriveProjeto").value.trim(),
      videoUrl: document.getElementById("campoVideo").value.trim(),
      imagemUrl: document.getElementById("campoImagemUrl").value.trim(),
      destaque: document.getElementById("campoDestaque").checked,
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
  document.getElementById("campoCategoria").value = p.categoria || siteConfig.categorias[0];
  document.getElementById("campoAno").value = p.ano || new Date().getFullYear();
  document.getElementById("campoDescricao").value = p.descricao || "";
  document.getElementById("campoDriveProjeto").value = p.driveLink || "";
  document.getElementById("campoVideo").value = p.videoUrl || "";
  document.getElementById("campoDestaque").checked = !!p.destaque;
  document.getElementById("campoOrdem").value = p.ordem || 0;
  document.getElementById("campoImagemUrl").value = p.imagemUrl || "";

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
