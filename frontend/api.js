/* =========================================================
   FUNÇÕES COMPARTILHADAS: LOGIN, SESSÃO E CHAMADAS AO BACK
   (usado por login.html e painel.html)
   ========================================================= */

const API_URL = 'http://localhost:8080';

// a sessão fica guardada no navegador depois do login
function salvarSessao(token, nome) {
  localStorage.setItem('token', token);
  localStorage.setItem('nome', nome || '');
}

function pegarToken() {
  return localStorage.getItem('token');
}

function pegarNome() {
  return localStorage.getItem('nome') || '';
}

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('nome');
  window.location.href = 'login.html';
}

// faz uma chamada ao back já mandando o token de quem está logado
async function requisicao(caminho, opcoes = {}) {
  const cabecalhos = { 'Content-Type': 'application/json', ...opcoes.headers };
  const token = pegarToken();
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(API_URL + caminho, { ...opcoes, headers: cabecalhos });

  // token inválido ou vencido: volta para o login
  if (resposta.status === 401 && token) {
    sair();
  }

  return resposta;
}
