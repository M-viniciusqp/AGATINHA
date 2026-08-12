# Portfólio — Publicidade & Propaganda

Site com **duas telas**:

- `index.html` — página pública, para quem visita.
- `admin.html` — painel de login para você adicionar/editar/remover projetos. Ninguém acessa sem login.

Arquitetura: HTML/CSS/JS puro (sem build, sem framework) + **Firebase** (plano gratuito Spark) como banco de dados e autenticação — 100% grátis, sem cartão de crédito.

> **Nota:** desde out/2024 o Google passou a exigir o plano pago (Blaze) até pra usar o Firebase Storage — mesmo dentro da cota grátis, ele pede cartão cadastrado. Pra manter o projeto sem custo nenhum, este site **não usa Storage**: as imagens de capa entram por **link** (você cola a URL de uma imagem já hospedada em algum lugar). O **acervo completo de fotos e vídeos fica no Google Drive**, e o site só aponta pra lá com botões.

---

## 1. Criar o projeto Firebase (grátis)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto novo.
2. No menu lateral, ative:
   - **Authentication** → aba "Sign-in method" → ative **E-mail/senha**.
   - **Firestore Database** → criar banco → modo produção → escolha a região mais próxima (ex: `southamerica-east1`).
   - **Não ative o Storage** — ele agora exige plano pago (Blaze) mesmo dentro da cota grátis.
3. Vá em **Configurações do projeto → Geral → Seus apps → </> (Web)** e registre um app. Copie o objeto `firebaseConfig` que aparece.
4. Cole esses valores em `js/firebase-config.js`, substituindo os campos `SUA_API_KEY`, `SEU_PROJETO`, etc.

## 2. Criar seu usuário de login (o único admin)

Em **Authentication → Users → Add user**, cadastre seu e-mail e uma senha. É com esse e-mail/senha que você entra em `admin.html`.

## 3. Regras de segurança (importante — copiar exatamente)

### Firestore (aba "Regras")

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projetos/{id} {
      allow read: if true;            // qualquer visitante pode ver
      allow write: if request.auth != null;  // só usuário logado pode editar
    }
  }
}
```

Isso garante: qualquer pessoa pode **ver** o portfólio, mas só quem tem login consegue **editar**.

## 4. Como colocar as imagens de capa (sem Storage)

No painel admin, o campo "Link da imagem de capa" pede uma URL direta de imagem. Três jeitos fáceis de conseguir isso, de graça:

- **imgbb.com** (mais simples): suba a foto lá, ele te dá um "link direto" pronto pra colar.
- **Google Drive**: suba a foto → botão direito → Compartilhar → "Qualquer pessoa com o link" → copie o link → cole em um conversor tipo [gdocs2direct](https://sites.google.com/site/gdocs2direct/) pra virar link direto de imagem.
- Qualquer outro host de imagem grátis que gere link direto (terminado em `.jpg`, `.png` etc.).

O acervo completo (fotos e vídeos em alta) continua só no Drive, linkado pelos botões do site.

## 5. Personalizar textos e links

Abra `js/config.js` e edite:

- `nome`, `cargo`, `tagline`, `bio`, `servicos`
- `categorias` (as abas de filtro do portfólio)
- `driveLink` → link da pasta do Google Drive com o acervo completo
- `email`, `whatsapp`, `instagram`

Troque também `img/foto-sobre.jpg` pela foto real (ou aponte `fotoSobre` no config para uma URL).

> Dica sobre o Drive: deixe a pasta com permissão **"Qualquer pessoa com o link pode visualizar"**, senão o botão vai pedir login de quem visita.

## 6. Rodar localmente

Como o site usa `fetch`/módulos do Firebase, abra com um servidor local (não funciona bem em `file://`):

```bash
npx serve .
```

ou use a extensão "Live Server" do VS Code.

## 7. Publicar de graça

**Opção recomendada — Firebase Hosting** (já está tudo no mesmo ecossistema):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # escolha esta pasta como "public directory"
firebase deploy
```

Alternativas igualmente gratuitas: Vercel ou GitHub Pages (arrastar a pasta funciona nos dois).

## 8. Como usar o painel

1. Acesse `seusite.com/admin.html`.
2. Faça login com o e-mail/senha criados no passo 2.
3. Preencha o formulário: título, categoria, ano, descrição, link da imagem de capa (veja passo 4), link do Drive daquele projeto específico e (opcional) link de vídeo.
4. Marque **"destaque"** nos 2-3 melhores projetos — eles aparecem alternando no fundo da tela inicial.
5. O campo **"ordem"** controla a sequência de exibição (0 aparece primeiro).
6. A lista embaixo mostra tudo que já foi publicado, com botões de editar/excluir — atualiza em tempo real no site público.

---

## O que já vem pronto

- Layout responsivo (celular, tablet, desktop).
- Lista de projetos em estilo editorial, com prévia da imagem seguindo o cursor no desktop (comum em portfólios de agência) e miniatura fixa no celular.
- Modal com detalhes do projeto, botão para o Drive e botão para vídeo.
- Filtro por categoria.
- Formulário de contato que abre o WhatsApp já com a mensagem preenchida.
- Botão de acesso ao acervo completo no Drive em três pontos do site.
