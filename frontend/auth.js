/* =========================================================
   CADASTRO E LOGIN (os dois ficam no login.html, em abas)
   ========================================================= */

const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');

function mostrarMensagem(form, texto, tipo) {
  const mensagem = form.querySelector('.mensagem');
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

// quem já está logado vai direto para o painel
if (pegarToken()) {
  window.location.href = 'painel.html';
}


/* ---------- ABAS ---------- */

// mostra o formulário da aba escolhida ("login" ou "cadastro") e esconde o outro
function abrirAba(nome) {
  document.querySelectorAll('.auth-aba').forEach(aba => {
    const ativa = aba.dataset.aba === nome;
    aba.classList.toggle('ativa', ativa);
    aba.setAttribute('aria-selected', ativa);
  });
  document.querySelectorAll('[data-painel]').forEach(form => {
    form.hidden = form.dataset.painel !== nome;
  });
  history.replaceState(null, '', `#${nome}`);
}

document.querySelectorAll('.auth-aba').forEach(aba => {
  aba.addEventListener('click', () => abrirAba(aba.dataset.aba));
});

// links "Criar conta" / "Entrar" no rodapé de cada formulário
document.querySelectorAll('[data-ir]').forEach(link => {
  link.addEventListener('click', evento => {
    evento.preventDefault();
    abrirAba(link.dataset.ir);
  });
});

// login.html#cadastro já abre na aba de criar conta
abrirAba(window.location.hash === '#cadastro' ? 'cadastro' : 'login');


/* ---------- MOSTRAR / ESCONDER A SENHA ---------- */

// o texto do botão depende de a senha estar visível ou não
function atualizarBotoesSenha() {
  document.querySelectorAll('.ver-senha').forEach(botao => {
    const mostrando = botao.previousElementSibling.type === 'text';
    botao.textContent = t(mostrando ? 'auth.ocultar' : 'auth.mostrar');
  });
}

document.querySelectorAll('.ver-senha').forEach(botao => {
  botao.addEventListener('click', () => {
    const campo = botao.previousElementSibling;
    campo.type = campo.type === 'text' ? 'password' : 'text';
    atualizarBotoesSenha();
  });
});

atualizarBotoesSenha();


/* ---------- IDIOMA ---------- */

const campoIdioma = document.getElementById('cadastroIdioma');
campoIdioma.value = pegarIdioma();

// escolher o idioma no cadastro já troca a página
campoIdioma.addEventListener('change', () => definirIdioma(campoIdioma.value));

// quando o idioma muda (pelo botão PT/EN ou pelo cadastro)
document.addEventListener('idiomamudou', () => {
  campoIdioma.value = pegarIdioma();
  atualizarBotoesSenha();
  // apaga mensagens antigas, que estavam no outro idioma
  document.querySelectorAll('.mensagem').forEach(m => {
    m.textContent = '';
    m.className = 'mensagem';
  });
});


/* ---------- CADASTRO ---------- */

formCadastro.addEventListener('submit', async evento => {
  evento.preventDefault();

  const nome = document.getElementById('cadastroNome').value.trim();
  const email = document.getElementById('cadastroEmail').value.trim();
  const idioma = campoIdioma.value;   // "pt-BR" ou "en"
  const senha = document.getElementById('cadastroSenha').value;
  const confirmar = document.getElementById('cadastroConfirmar').value;

  if (senha.length < 6) {
    return mostrarMensagem(formCadastro, t('auth.erroSenhaCurta'), 'erro');
  }
  if (senha !== confirmar) {
    return mostrarMensagem(formCadastro, t('auth.erroSenhasDiferentes'), 'erro');
  }

  const botao = formCadastro.querySelector('button[type="submit"]');
  botao.disabled = true;

  try {
    const resposta = await requisicao('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, idioma, senha })
    });

    if (resposta.status === 409) {
      return mostrarMensagem(formCadastro, t('auth.erroEmailExiste'), 'erro');
    }
    if (!resposta.ok) throw new Error();

    // conta criada: vai para a aba Entrar com o e-mail já preenchido
    formCadastro.reset();
    campoIdioma.value = pegarIdioma();
    abrirAba('login');
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginSenha').focus();
    mostrarMensagem(formLogin, t('auth.contaCriada'), 'ok');
  } catch {
    mostrarMensagem(formCadastro, t('auth.erroCadastro'), 'erro');
  } finally {
    botao.disabled = false;
  }
});


/* ---------- LOGIN ---------- */

formLogin.addEventListener('submit', async evento => {
  evento.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const botao = formLogin.querySelector('button[type="submit"]');
  botao.disabled = true;

  try {
    const resposta = await requisicao('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });

    if (resposta.status === 401) {
      return mostrarMensagem(formLogin, t('auth.erroLogin'), 'erro');
    }
    if (!resposta.ok) throw new Error();

    const dados = await resposta.json();   // espera { token, nome, idioma }
    salvarSessao(dados.token, dados.nome);
    // o site passa a usar o idioma que a pessoa escolheu no cadastro
    if (dados.idioma) localStorage.setItem('idioma', dados.idioma);
    window.location.href = 'painel.html';
  } catch {
    mostrarMensagem(formLogin, t('auth.erroEntrar'), 'erro');
  } finally {
    botao.disabled = false;
  }
});
