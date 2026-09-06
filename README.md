# Portfólio — Publicidade & Propaganda

Site com **duas telas**:

- `index.html` — página pública, para quem visita.
- `admin.html` — painel pra você adicionar/editar/remover projetos, categorias e as configurações do site (bio, foto, WhatsApp, Instagram, e-mail).

Arquitetura: HTML/CSS/JS puro (sem build, sem framework) + **Firebase** (Firestore, plano gratuito Spark) como banco de dados — 100% grátis, sem cartão de crédito.

> ⚠️ **Importante sobre segurança:** o painel admin **não pede login**. Isso significa que qualquer pessoa que souber o endereço `/admin.html` consegue editar ou apagar qualquer coisa do site — não existe mais nenhuma trava. A única proteção que resta é não divulgar esse link em nenhum lugar público (não colocar em menu, não linkar do site principal). Se um dia quiser reforçar isso com login de novo, é uma mudança simples de fazer.

---

## 1. Criar o projeto Firebase (grátis)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto novo.
2. No menu lateral, ative **Firestore Database** → criar banco → modo produção → escolha a região mais próxima (ex: `southamerica-east1`).
3. Vá em **Configurações do projeto → Geral → Seus apps → </> (Web)** e registre um app. Copie o objeto `firebaseConfig` que aparece.
4. Cole esses valores em `js/firebase-config.js`, substituindo os campos `SUA_API_KEY`, `SEU_PROJETO`, etc.

## 2. Regras de segurança do Firestore

Vá na aba **Regras** do Firestore e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projetos/{id} {
      allow read, write: if true;
    }
    match /configuracao/{id} {
      allow read, write: if true;
    }
  }
}
```

Isso libera leitura e escrita pra qualquer um que tenha o link (é o preço de não ter mais login — veja o aviso lá em cima).

## 3. Como colocar as imagens (link, sem Storage)

Nos campos de imagem (foto de capa dos projetos, foto do "Sobre", foto de fundo do topo), cole uma URL direta de imagem. Três jeitos fáceis de conseguir isso, de graça:

- **imgbb.com** (mais simples): suba a foto lá, ele te dá um "link direto" pronto pra colar.
- **Google Drive**: suba a foto → botão direito → Compartilhar → "Qualquer pessoa com o link" → copie o link → cole em um conversor tipo [gdocs2direct](https://sites.google.com/site/gdocs2direct/) pra virar link direto de imagem.
- Qualquer outro host de imagem grátis que gere link direto (terminado em `.jpg`, `.png` etc.).

## 4. O que dá pra editar em cada lugar

**No arquivo `js/config.js`** (precisa editar o código, mudança rara):
- Nome, cargo, tagline
- Lista de "chips" de serviço (Direção de Arte, Social Media etc.)
- Ano de rodapé

**No painel `admin.html`** (sem precisar de código):
- **Configurações do site**: texto do "Sobre", foto do "Sobre", foto de fundo do topo, WhatsApp, Instagram, e-mail.
- **Categorias**: cria e apaga livremente. Aparecem como filtro no site e como opção ao criar um projeto. Apagar uma categoria não apaga os projetos que já usam ela, só tira da lista de opções.
- **Projetos**: título (obrigatório), cliente, categoria, ano, descrição, link de vídeo (YouTube/Vimeo, toca embutido no site), link de imagem de capa, ordem de exibição. Só o título é obrigatório — todo o resto é opcional.

## 5. Rodar localmente

Como o site usa módulos do Firebase, abra com um servidor local (não funciona bem em `file://`):

```bash
npx serve .
```

ou use a extensão "Live Server" do VS Code.

## 6. Publicar de graça

**Opção recomendada — Firebase Hosting** (já está tudo no mesmo ecossistema):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # escolha esta pasta como "public directory"
firebase deploy
```

Alternativas igualmente gratuitas: Vercel ou GitHub Pages.

## 7. Como usar o painel

1. Acesse `seusite.com/admin.html` (sem login, abre direto).
2. Preencha as **Configurações do site** uma vez (bio, fotos, WhatsApp, Instagram, e-mail) e salve.
3. Crie as **categorias** que fizerem sentido pro seu trabalho.
4. Cadastre os **projetos** — só o título é obrigatório.
5. A lista embaixo mostra tudo que já foi publicado, com botões de editar/excluir — atualiza em tempo real no site público.

---

## O que já vem pronto

- Layout responsivo (celular, tablet, desktop).
- Tema escuro com efeito de vidro (glassmorphism) e partículas de fundo.
- Lista de projetos em estilo editorial, com prévia da imagem seguindo o cursor no desktop e miniatura fixa no celular.
- Vídeo do YouTube/Vimeo tocando embutido no modal do projeto.
- Filtro por categoria, com categorias criadas livremente pelo painel.
- Formulário de contato que abre o WhatsApp já com a mensagem preenchida, usando o número cadastrado no painel.
