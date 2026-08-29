/**
 * CONFIGURAÇÃO DO FIREBASE
 * -------------------------
 * 1. Crie um projeto grátis em https://console.firebase.google.com
 * 2. Ative: Firestore Database (não precisa de Authentication —
 *    o painel admin não pede mais login. Veja o README.md pra
 *    entender o que isso significa em termos de segurança).
 * 3. Copie as chaves do seu projeto (Configurações do projeto > Geral >
 *    "Seus apps" > SDK setup) e cole aqui embaixo.
 *
 * Essas chaves NÃO são segredo — elas identificam o projeto, não dão
 * acesso a nada sozinhas. A segurança real vem das Regras do Firestore
 * (veja README.md).
 */

const firebaseConfig = {
  apiKey: "AIzaSyAwYl4iK8elkxR20S_z00HGpi60A7OneCI",
  authDomain: "agata-810bd.firebaseapp.com",
  projectId: "agata-810bd",
  storageBucket: "agata-810bd.firebasestorage.app",
  messagingSenderId: "864792673649",
  appId: "1:864792673649:web:a66f2b109d5a1f70e6cad0"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
