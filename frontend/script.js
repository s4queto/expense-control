/* =========================================================
   QUEM JÁ ESTÁ LOGADO
   (roda antes de tudo, porque muda os botões e o layout)
   ========================================================= */

// o token é salvo no navegador pelo login (ver api.js)
if (localStorage.getItem('token')) {
  // some com os botões de conta do final da página e mostra o atalho para o painel
  document.querySelectorAll('[data-visitante]').forEach(el => el.remove());
  document.querySelectorAll('[data-logado]').forEach(el => { el.hidden = false; });

  // "Meus gastos" do cabeçalho vai direto para o painel
  document.querySelector('.nav-conta').href = 'painel.html';
}


/* =========================================================
   1. A PALAVRA "DINHEIRO" VIAJANDO PELO SITE
   ========================================================= */

const viajante = document.getElementById('viajante');
// "let" porque, quando o idioma muda, os títulos são trocados e buscamos os novos
let pousos = document.querySelectorAll('.pouso');
const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// altura da tela (em %) onde a palavra "pousa" em cada título
const LINHA_DE_POUSO = 0.38;

let paradas = [];

// mede onde fica cada título na página
function medirPousos() {
  const tamanhoBase = parseFloat(getComputedStyle(viajante).fontSize);

  paradas = Array.from(pousos).map(pouso => {
    const caixa = pouso.getBoundingClientRect();
    const x = caixa.left + window.scrollX;
    const y = caixa.top + window.scrollY;

    return {
      x,
      y,
      escala: parseFloat(getComputedStyle(pouso).fontSize) / tamanhoBase,
      escuro: pouso.closest('.secao-escura') !== null,
      // rolagem em que este título passa pela linha de pouso
      rolagem: Math.max(0, y + caixa.height / 2 - window.innerHeight * LINHA_DE_POUSO)
    };
  });
}

// suaviza o movimento: começa e termina devagar, sem trancos no meio
function suavizar(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// "alvo" é onde a palavra deveria estar; "posicao" é onde ela está agora.
// a cada quadro ela anda só um pedaço do caminho até o alvo, e isso deixa o movimento macio
const alvo = { x: 0, y: 0, escala: 1, giro: 0 };
const posicao = { x: 0, y: 0, escala: 1, giro: 0 };
const SUAVIDADE = 0.08;    // menor = mais suave e mais lento para alcançar
let animando = false;
let ultimoQuadro = 0;

function calcularAlvo() {
  if (menosMovimento || paradas.length === 0) return;

  const rolagem = window.scrollY;

  // descobre entre quais títulos a palavra está agora
  let atual = 0;
  while (atual < paradas.length - 2 && rolagem >= paradas[atual + 1].rolagem) {
    atual++;
  }

  const de = paradas[atual];
  const para = paradas[atual + 1];
  let progresso = (rolagem - de.rolagem) / (para.rolagem - de.rolagem);
  progresso = Math.min(Math.max(progresso, 0), 1);

  // uma pausa curta no título antes de sair e depois de chegar
  let t = (progresso - 0.05) / 0.9;
  t = suavizar(Math.min(Math.max(t, 0), 1));

  alvo.x = de.x + (para.x - de.x) * t;
  alvo.y = de.y + (para.y - de.y) * t;
  alvo.escala = de.escala + (para.escala - de.escala) * t;
  alvo.giro = Math.sin(t * Math.PI) * -4;

  viajante.classList.toggle('no-escuro', (t < 0.5 ? de : para).escuro);

  // os títulos por onde a palavra já passou ficam com a palavra escrita
  pousos.forEach((pouso, i) => {
    const jaPassou = i < atual || (i === atual && t > 0);
    pouso.classList.toggle('preenchida', jaPassou);
  });

  if (!animando) {
    animando = true;
    ultimoQuadro = performance.now();
    requestAnimationFrame(desenharViajante);
  }
}

function desenharViajante(agora) {
  // ajusta pelo tempo do quadro, para ficar igual em telas de 60 Hz ou 144 Hz
  const fator = 1 - Math.pow(1 - SUAVIDADE, (agora - ultimoQuadro) / 16.67);
  ultimoQuadro = agora;

  let falta = 0;
  for (const chave in alvo) {
    posicao[chave] += (alvo[chave] - posicao[chave]) * fator;
    falta += Math.abs(alvo[chave] - posicao[chave]);
  }

  viajante.style.transform =
    `translate(${posicao.x}px, ${posicao.y}px) rotate(${posicao.giro}deg) scale(${posicao.escala})`;

  // continua animando até chegar no alvo
  if (falta > 0.01) {
    requestAnimationFrame(desenharViajante);
  } else {
    animando = false;
  }
}

function atualizarViajante() {
  medirPousos();
  calcularAlvo();
}

// na primeira vez, a palavra já começa no lugar certo (sem deslizar do canto da tela)
function posicionarDeUmaVez() {
  atualizarViajante();
  Object.assign(posicao, alvo);
}

posicionarDeUmaVez();
window.addEventListener('scroll', calcularAlvo, { passive: true });
window.addEventListener('resize', atualizarViajante);
document.fonts.ready.then(posicionarDeUmaVez);
// se algo mudar de tamanho (ex.: a lista de gastos cresce), mede de novo
new ResizeObserver(atualizarViajante).observe(document.body);


/* =========================================================
   2. ELEMENTOS QUE APARECEM AO ROLAR + CONTADORES
   ========================================================= */

// o formato do número muda com o idioma: "R$ 2.920" em português, "R$2,920" em inglês
let moedaSemCentavos;

function criarFormatoMoeda() {
  moedaSemCentavos = new Intl.NumberFormat(pegarIdioma(), {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0
  });
}

criarFormatoMoeda();

function animarContador(elemento) {
  const valorFinal = Number(elemento.dataset.valor);
  const duracao = 1400;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const valor = valorFinal * (1 - Math.pow(1 - progresso, 3));
    elemento.textContent = moedaSemCentavos.format(valor);
    if (progresso < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

const observador = new IntersectionObserver(entradas => {
  entradas.forEach(entrada => {
    if (!entrada.isIntersecting) return;

    entrada.target.classList.add('visivel');
    entrada.target.querySelectorAll('.contador').forEach(animarContador);
    observador.unobserve(entrada.target);
  });
}, { threshold: 0.25 });

document.querySelectorAll('.revelar').forEach(el => observador.observe(el));


/* =========================================================
   3. SIMULADOR DE JUROS COMPOSTOS
   ========================================================= */

const TAXA_MENSAL = 0.007;

const campoAporte = document.getElementById('aporte');
const campoAnos = document.getElementById('anos');
const grafico = document.getElementById('grafico');

function simular() {
  const aporte = Number(campoAporte.value);
  const anos = Number(campoAnos.value);

  // calcula mês a mês e guarda o resultado do fim de cada ano
  const porAno = [];
  let saldo = 0;
  for (let mes = 1; mes <= anos * 12; mes++) {
    saldo = saldo * (1 + TAXA_MENSAL) + aporte;
    if (mes % 12 === 0) {
      porAno.push({ guardado: aporte * mes, total: saldo });
    }
  }

  const final = porAno[porAno.length - 1];
  document.getElementById('saidaAporte').textContent = moedaSemCentavos.format(aporte);
  document.getElementById('saidaAnos').textContent = anos === 1 ? t('index.umAno') : t('index.anos', { n: anos });
  document.getElementById('totalGuardado').textContent = moedaSemCentavos.format(final.guardado);
  document.getElementById('totalJuros').textContent = moedaSemCentavos.format(final.total - final.guardado);
  document.getElementById('totalFinal').textContent = moedaSemCentavos.format(final.total);

  desenharGrafico(porAno);
}

function desenharGrafico(porAno) {
  const largura = grafico.clientWidth;
  const altura = grafico.clientHeight;
  const margemBaixo = 24;
  const alturaUtil = altura - margemBaixo - 8;
  const maximo = porAno[porAno.length - 1].total;
  const espaco = largura / porAno.length;
  const larguraBarra = Math.max(espaco * 0.68, 2);

  let svg = '';
  porAno.forEach((ano, i) => {
    const x = i * espaco + (espaco - larguraBarra) / 2;
    const hTotal = (ano.total / maximo) * alturaUtil;
    const hGuardado = (ano.guardado / maximo) * alturaUtil;
    const base = altura - margemBaixo;

    svg += `<rect class="barra-juros" x="${x}" y="${base - hTotal}" width="${larguraBarra}" height="${hTotal}" rx="3"></rect>`;
    svg += `<rect class="barra-guardado" x="${x}" y="${base - hGuardado}" width="${larguraBarra}" height="${hGuardado}" rx="3"></rect>`;

    // mostra o número de alguns anos embaixo, sem amontoar
    const pulo = Math.ceil(porAno.length / 10);
    if ((i + 1) % pulo === 0 || i === 0) {
      svg += `<text x="${x + larguraBarra / 2}" y="${altura - 6}" text-anchor="middle">${t('index.anoCurto', { n: i + 1 })}</text>`;
    }
  });

  grafico.setAttribute('viewBox', `0 0 ${largura} ${altura}`);
  grafico.innerHTML = svg;
}

campoAporte.addEventListener('input', simular);
campoAnos.addEventListener('input', simular);
window.addEventListener('resize', simular);
simular();


/* =========================================================
   4. QUANDO O IDIOMA MUDA (botão PT / EN)
   ========================================================= */

document.addEventListener('idiomamudou', () => {
  criarFormatoMoeda();
  simular();

  // contadores que já apareceram mostram o valor final no novo formato
  document.querySelectorAll('.visivel .contador').forEach(contador => {
    contador.textContent = moedaSemCentavos.format(Number(contador.dataset.valor));
  });

  // os títulos foram trocados: busca os novos e reposiciona a palavra "dinheiro"/"money"
  pousos = document.querySelectorAll('.pouso');
  atualizarViajante();
});
