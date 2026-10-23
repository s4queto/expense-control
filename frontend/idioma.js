/* =========================================================
   IDIOMA: PORTUGUÊS OU INGLÊS
   (usado por index.html e login.html; carregar antes dos outros scripts)

   Como marcar um texto no HTML para ser traduzido:
     data-i18n="chave"             troca o texto
     data-i18n-html="chave"        troca o conteúdo (quando o texto tem <em>, <span>…)
     data-i18n-placeholder="chave" troca o placeholder de um campo
     data-i18n-aria="chave"        troca o aria-label
     <html data-i18n-titulo="chave"> troca o título da aba
   ========================================================= */

const TEXTOS = {
  'pt-BR': {
    // comum
    'comum.dinheiro': 'dinheiro',
    'comum.trocaIdioma': 'EN',
    'comum.trocaIdiomaAria': 'Switch to English',

    // página inicial
    'index.titulo': 'Expense Control',
    'index.navProblema': 'O problema',
    'index.navPorque': 'Por que guardar',
    'index.navSimulador': 'Simulador',
    'index.navPassos': 'Como guardar',
    'index.navMeusGastos': 'Meus gastos',
    'index.navCriarConta': 'Criar conta',

    'index.heroSobre': 'Educação financeira · Controle de gastos',
    'index.heroTitulo': 'Para onde vai seu <span class="pouso">dinheiro</span>?',
    'index.heroLead': 'Antes de guardar, é preciso enxergar. Role a página e acompanhe o caminho que ele faz todo mês.',
    'index.rolar': 'Role para baixo',

    'index.vazSobre': '01 · O vazamento',
    'index.vazTitulo': 'Seu <span class="pouso">dinheiro</span> escapa nos detalhes.',
    'index.vazTexto': 'Raramente é uma grande compra que desequilibra o mês. São os gastos pequenos e repetidos, que parecem inofensivos sozinhos, mas viram muito no fim do ano.',
    'index.cafe': 'Um café por dia',
    'index.cafeConta': 'R$ 8 × 365 dias',
    'index.delivery': 'Delivery 2× por semana',
    'index.deliveryConta': 'R$ 45 × 104 pedidos',
    'index.assinaturas': 'Assinaturas esquecidas',
    'index.assinaturasConta': 'R$ 60 × 12 meses',
    'index.porAno': 'por ano',
    'index.juntos': 'Juntos, só esses três hábitos somam',

    'index.porqueSobre': '02 · O motivo',
    'index.porqueTitulo': 'Guardar <span class="pouso">dinheiro</span> é comprar tranquilidade.',
    'index.motivo1Titulo': 'Imprevistos não avisam',
    'index.motivo1Texto': 'Um conserto, uma consulta, um mês sem renda. Com uma reserva, o imprevisto vira um incômodo, não uma dívida no cartão.',
    'index.motivo2Titulo': 'Liberdade de escolha',
    'index.motivo2Texto': 'Quem tem uma reserva consegue dizer não: a um emprego ruim, a um parcelamento caro, a uma decisão tomada por pressão.',
    'index.motivo3Titulo': 'O tempo trabalha por você',
    'index.motivo3Texto': 'Com juros compostos, o rendimento também rende. Quanto antes você começa, menos esforço precisa fazer depois.',

    'index.simSobre': '03 · O tempo',
    'index.simTitulo': 'Seu <span class="pouso">dinheiro</span> cresce quando fica parado.',
    'index.simTexto': 'Mexa nos valores e veja quanto um hábito de guardar todo mês pode virar.',
    'index.simPorMes': 'Guardar por mês',
    'index.simDurante': 'Durante',
    'index.simGuardou': 'Você guardou',
    'index.simRendimento': 'Rendimento',
    'index.simTotal': 'Total acumulado',
    'index.simGraficoAria': 'Gráfico do valor acumulado por ano',
    'index.simValorGuardado': 'Valor guardado',
    'index.simAviso': 'Simulação ilustrativa com rendimento fixo de 0,7% ao mês, sem impostos e sem inflação. Não é uma recomendação de investimento.',
    'index.umAno': '1 ano',
    'index.anos': '{n} anos',
    'index.anoCurto': '{n}a',

    'index.passosSobre': '04 · O método',
    'index.passosTitulo': 'Cinco passos para cuidar do seu <span class="pouso">dinheiro</span>.',
    'index.passo1Titulo': 'Anote tudo por 30 dias',
    'index.passo1Texto': 'Sem julgar e sem cortar nada ainda. O objetivo é descobrir para onde o dinheiro vai de verdade, não para onde você acha que ele vai.',
    'index.passo2Titulo': 'Divida a renda: 50 · 30 · 20',
    'index.passo2Texto': 'Uma referência simples para começar: metade para o essencial, uma parte para o que você gosta e uma parte para o futuro.',
    'index.essencial': 'Essencial',
    'index.desejos': 'Desejos',
    'index.futuro': 'Futuro',
    'index.passo3Titulo': 'Pague-se primeiro',
    'index.passo3Texto': 'Guarde assim que o salário cair, não com o que sobrar no fim do mês. O que sobra no fim do mês costuma ser nada.',
    'index.passo4Titulo': 'Monte sua reserva de emergência',
    'index.passo4Texto': 'Uma meta comum é juntar de 3 a 6 meses do seu custo de vida, num lugar seguro e fácil de sacar.',
    'index.passo5Titulo': 'Automatize e revise todo mês',
    'index.passo5Texto': 'Programe a transferência para a poupança e reserve dez minutos por mês para olhar seus gastos. Constância vale mais que perfeição.',

    'index.chamadaSobre': '05 · Comece agora',
    'index.chamadaTitulo': 'Agora o seu <span class="pouso">dinheiro</span> tem endereço.',
    'index.chamadaTexto': 'Crie sua conta, registre seus gastos e veja, mês a mês, para onde cada real está indo.',
    'index.vantagem1': 'Registre gastos em segundos',
    'index.vantagem2': 'Veja o total por categoria',
    'index.vantagem3': 'Acompanhe cada mês',
    'index.criarMinhaConta': 'Criar minha conta',
    'index.jaTenhoConta': 'Já tenho conta',
    'index.rodape': 'Feito para você enxergar, entender e cuidar do seu dinheiro.',

    // login e cadastro
    'auth.titulo': 'Meus gastos · Expense Control',
    'auth.frase': 'Quem sabe para onde vai o próprio <em>dinheiro</em> decide para onde ele vai.',
    'auth.lista1': 'Registre seus gastos em segundos',
    'auth.lista2': 'Veja quanto vai para cada categoria',
    'auth.lista3': 'Só você vê os seus dados',
    'auth.voltar': '← Voltar ao início',
    'auth.abaEntrar': 'Entrar',
    'auth.abaCriar': 'Criar conta',

    'auth.loginTitulo': 'Entrar',
    'auth.loginSub': 'Acesse seu painel de gastos.',
    'auth.email': 'E-mail',
    'auth.emailExemplo': 'voce@email.com',
    'auth.senha': 'Senha',
    'auth.suaSenha': 'Sua senha',
    'auth.mostrar': 'Mostrar',
    'auth.ocultar': 'Ocultar',
    'auth.botaoEntrar': 'Entrar',
    'auth.semConta': 'Ainda não tem conta?',
    'auth.linkCriar': 'Criar conta',

    'auth.cadastroTitulo': 'Crie sua conta',
    'auth.cadastroSub': 'Leva menos de um minuto.',
    'auth.nome': 'Nome',
    'auth.seuNome': 'Seu nome',
    'auth.idioma': 'Idioma',
    'auth.minimo': 'Mínimo de 6 caracteres',
    'auth.confirmar': 'Confirmar senha',
    'auth.repita': 'Repita a senha',
    'auth.botaoCriar': 'Criar conta',
    'auth.temConta': 'Já tem conta?',
    'auth.linkEntrar': 'Entrar',

    'auth.erroSenhaCurta': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth.erroSenhasDiferentes': 'As senhas não são iguais.',
    'auth.erroEmailExiste': 'Esse e-mail já tem uma conta. Tente entrar.',
    'auth.erroCadastro': 'Não foi possível criar a conta. O back-end está rodando?',
    'auth.contaCriada': 'Conta criada! Agora é só entrar.',
    'auth.erroLogin': 'E-mail ou senha incorretos.',
    'auth.erroEntrar': 'Não foi possível entrar. O back-end está rodando?'
  },

  'en': {
    // comum
    'comum.dinheiro': 'money',
    'comum.trocaIdioma': 'PT',
    'comum.trocaIdiomaAria': 'Mudar para português',

    // página inicial
    'index.titulo': 'Expense Control',
    'index.navProblema': 'The problem',
    'index.navPorque': 'Why save',
    'index.navSimulador': 'Simulator',
    'index.navPassos': 'How to save',
    'index.navMeusGastos': 'My expenses',
    'index.navCriarConta': 'Sign up',

    'index.heroSobre': 'Financial education · Expense tracking',
    'index.heroTitulo': 'Where does your <span class="pouso">money</span> go?',
    'index.heroLead': 'Before you can save, you need to see. Scroll down and follow the path it takes every month.',
    'index.rolar': 'Scroll down',

    'index.vazSobre': '01 · The leak',
    'index.vazTitulo': 'Your <span class="pouso">money</span> slips away in the details.',
    'index.vazTexto': 'It is rarely one big purchase that throws the month off. It is the small, repeated expenses that look harmless on their own but add up to a lot by the end of the year.',
    'index.cafe': 'A coffee a day',
    'index.cafeConta': 'R$ 8 × 365 days',
    'index.delivery': 'Delivery twice a week',
    'index.deliveryConta': 'R$ 45 × 104 orders',
    'index.assinaturas': 'Forgotten subscriptions',
    'index.assinaturasConta': 'R$ 60 × 12 months',
    'index.porAno': 'per year',
    'index.juntos': 'Together, just these three habits add up to',

    'index.porqueSobre': '02 · The reason',
    'index.porqueTitulo': 'Saving <span class="pouso">money</span> is buying peace of mind.',
    'index.motivo1Titulo': 'Emergencies don’t warn you',
    'index.motivo1Texto': 'A repair, a doctor’s visit, a month without income. With savings, the unexpected becomes a nuisance, not credit card debt.',
    'index.motivo2Titulo': 'Freedom to choose',
    'index.motivo2Texto': 'People with savings can say no: to a bad job, to an expensive installment plan, to a decision made under pressure.',
    'index.motivo3Titulo': 'Time works for you',
    'index.motivo3Texto': 'With compound interest, your earnings earn too. The sooner you start, the less effort you need later.',

    'index.simSobre': '03 · Time',
    'index.simTitulo': 'Your <span class="pouso">money</span> grows when it sits still.',
    'index.simTexto': 'Move the values and see what a monthly saving habit can turn into.',
    'index.simPorMes': 'Save per month',
    'index.simDurante': 'For',
    'index.simGuardou': 'You saved',
    'index.simRendimento': 'Earnings',
    'index.simTotal': 'Total',
    'index.simGraficoAria': 'Chart of the accumulated amount per year',
    'index.simValorGuardado': 'Amount saved',
    'index.simAviso': 'Illustrative simulation with a fixed return of 0.7% per month, no taxes and no inflation. This is not investment advice.',
    'index.umAno': '1 year',
    'index.anos': '{n} years',
    'index.anoCurto': '{n}y',

    'index.passosSobre': '04 · The method',
    'index.passosTitulo': 'Five steps to take care of your <span class="pouso">money</span>.',
    'index.passo1Titulo': 'Write everything down for 30 days',
    'index.passo1Texto': 'No judging and no cutting yet. The goal is to find out where your money really goes, not where you think it goes.',
    'index.passo2Titulo': 'Split your income: 50 · 30 · 20',
    'index.passo2Texto': 'A simple starting point: half for essentials, a part for what you enjoy and a part for the future.',
    'index.essencial': 'Essentials',
    'index.desejos': 'Wants',
    'index.futuro': 'Future',
    'index.passo3Titulo': 'Pay yourself first',
    'index.passo3Texto': 'Save as soon as your paycheck arrives, not whatever is left at the end of the month. What is left at the end of the month is usually nothing.',
    'index.passo4Titulo': 'Build your emergency fund',
    'index.passo4Texto': 'A common goal is to save 3 to 6 months of your living costs, somewhere safe and easy to withdraw from.',
    'index.passo5Titulo': 'Automate and review every month',
    'index.passo5Texto': 'Schedule the transfer to your savings and set aside ten minutes a month to look at your expenses. Consistency beats perfection.',

    'index.chamadaSobre': '05 · Start now',
    'index.chamadaTitulo': 'Now your <span class="pouso">money</span> has an address.',
    'index.chamadaTexto': 'Create your account, record your expenses and see, month by month, where every real is going.',
    'index.vantagem1': 'Record expenses in seconds',
    'index.vantagem2': 'See the total per category',
    'index.vantagem3': 'Follow every month',
    'index.criarMinhaConta': 'Create my account',
    'index.jaTenhoConta': 'I already have an account',
    'index.rodape': 'Made for you to see, understand and take care of your money.',

    // login e cadastro
    'auth.titulo': 'My expenses · Expense Control',
    'auth.frase': 'Those who know where their <em>money</em> goes decide where it goes.',
    'auth.lista1': 'Record your expenses in seconds',
    'auth.lista2': 'See how much goes to each category',
    'auth.lista3': 'Only you can see your data',
    'auth.voltar': '← Back to home',
    'auth.abaEntrar': 'Log in',
    'auth.abaCriar': 'Sign up',

    'auth.loginTitulo': 'Log in',
    'auth.loginSub': 'Access your expense dashboard.',
    'auth.email': 'Email',
    'auth.emailExemplo': 'you@email.com',
    'auth.senha': 'Password',
    'auth.suaSenha': 'Your password',
    'auth.mostrar': 'Show',
    'auth.ocultar': 'Hide',
    'auth.botaoEntrar': 'Log in',
    'auth.semConta': 'Don’t have an account yet?',
    'auth.linkCriar': 'Sign up',

    'auth.cadastroTitulo': 'Create your account',
    'auth.cadastroSub': 'It takes less than a minute.',
    'auth.nome': 'Name',
    'auth.seuNome': 'Your name',
    'auth.idioma': 'Language',
    'auth.minimo': 'At least 6 characters',
    'auth.confirmar': 'Confirm password',
    'auth.repita': 'Repeat your password',
    'auth.botaoCriar': 'Sign up',
    'auth.temConta': 'Already have an account?',
    'auth.linkEntrar': 'Log in',

    'auth.erroSenhaCurta': 'Your password must be at least 6 characters long.',
    'auth.erroSenhasDiferentes': 'The passwords don’t match.',
    'auth.erroEmailExiste': 'This email already has an account. Try logging in.',
    'auth.erroCadastro': 'Could not create the account. Is the back-end running?',
    'auth.contaCriada': 'Account created! Now just log in.',
    'auth.erroLogin': 'Incorrect email or password.',
    'auth.erroEntrar': 'Could not log in. Is the back-end running?'
  }
};

// idioma salvo no navegador; na primeira visita, usa o idioma do próprio navegador
function pegarIdioma() {
  const salvo = localStorage.getItem('idioma');
  if (TEXTOS[salvo]) return salvo;
  return navigator.language.startsWith('pt') ? 'pt-BR' : 'en';
}

// t('auth.email') → "E-mail" ou "Email"
// t('index.anos', { n: 5 }) → "5 anos" ou "5 years"
function t(chave, valores = {}) {
  let texto = TEXTOS[pegarIdioma()][chave] ?? TEXTOS['pt-BR'][chave] ?? chave;
  for (const nome in valores) {
    texto = texto.replace(`{${nome}}`, valores[nome]);
  }
  return texto;
}

// troca todos os textos marcados na página
function traduzirPagina() {
  const idioma = pegarIdioma();
  document.documentElement.lang = idioma === 'pt-BR' ? 'pt-br' : 'en';

  const titulo = document.documentElement.dataset.i18nTitulo;
  if (titulo) document.title = t(titulo);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}

// muda o idioma, traduz a página e avisa os outros scripts (evento "idiomamudou")
function definirIdioma(idioma) {
  if (!TEXTOS[idioma]) return;
  localStorage.setItem('idioma', idioma);
  traduzirPagina();
  document.dispatchEvent(new Event('idiomamudou'));
}

// botão PT / EN
document.querySelectorAll('.troca-idioma').forEach(botao => {
  botao.addEventListener('click', () => {
    definirIdioma(pegarIdioma() === 'pt-BR' ? 'en' : 'pt-BR');
  });
});

traduzirPagina();
