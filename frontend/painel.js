/* =========================================================
   PAINEL: CONTROLE DE GASTOS DE QUEM ESTÁ LOGADO
   ========================================================= */

// sem login, não entra no painel
if (!pegarToken()) {
  window.location.href = 'login.html';
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moedaInteira = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0
});
const moedaCurta = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1
});

const NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// cada categoria tem sempre a mesma cor, em qualquer gráfico
// "tipo" separa o essencial dos desejos (regra 50/30/20)
const CATEGORIAS = [
  { nome: 'Alimentação', cor: '#2a78d6', tipo: 'essencial' },
  { nome: 'Moradia',     cor: '#eb6834', tipo: 'essencial' },
  { nome: 'Transporte',  cor: '#1baf7a', tipo: 'essencial' },
  { nome: 'Saúde',       cor: '#eda100', tipo: 'essencial' },
  { nome: 'Educação',    cor: '#e87ba4', tipo: 'essencial' },
  { nome: 'Lazer',       cor: '#008300', tipo: 'desejo' },
  { nome: 'Outros',      cor: '#6250d6', tipo: 'desejo' }
];

// taxas de exemplo para comparar (ao ano)
const OPCOES_INVESTIMENTO = [
  { nome: 'Poupança', taxa: 6.2 },
  { nome: 'Tesouro IPCA+', taxa: 11 },
  { nome: 'CDB 100% do CDI', taxa: 12.5 },
  { nome: 'Tesouro Selic', taxa: 12.8 }
];

let gastos = [];
let editandoId = null;


/* ---------- AJUDANTES DE DATA, TEXTO E CONTA ---------- */

// Date → "2026-10-23" (no horário local, sem fuso)
function paraISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

// "2026-10-23" → Date
function deISO(texto) {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia || 1);
}

const HOJE = paraISO(new Date());
const MES_ATUAL = HOJE.slice(0, 7);

// "2026-10-21" → "21/10/2026"
function formatarData(data) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// "2026-10" → "outubro de 2026"
function nomeMes(chave) {
  const [ano, mes] = chave.split('-');
  return `${NOMES_MESES[mes - 1]} de ${ano}`;
}

// "2026-10" → "out"
function mesCurto(chave) {
  return NOMES_MESES[chave.split('-')[1] - 1].slice(0, 3);
}

// "2026-10" e 1 → "2026-09"
function mesAnterior(chave, quantos = 1) {
  const [ano, mes] = chave.split('-').map(Number);
  return paraISO(new Date(ano, mes - 1 - quantos, 1)).slice(0, 7);
}

function diasNoMes(chave) {
  const [ano, mes] = chave.split('-').map(Number);
  return new Date(ano, mes, 0).getDate();
}

// quantos dias do mês já passaram (o mês atual ainda não acabou)
function diasPassados(chave) {
  if (chave === MES_ATUAL) return Number(HOJE.slice(8));
  return diasNoMes(chave);
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "Saúde " → "saude" (para comparar textos sem ligar para acento e maiúscula)
function simplificar(texto) {
  return (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// evita que um texto digitado vire HTML
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function categoriaDe(nome) {
  return CATEGORIAS.find(c => simplificar(c.nome) === simplificar(nome)) || CATEGORIAS[6];
}

function somar(lista) {
  return lista.reduce((soma, g) => soma + g.valor, 0);
}

function doMes(chave) {
  return gastos.filter(g => g.data.startsWith(chave));
}

function maisRecentes(lista) {
  return [...lista].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

function porcentagem(parte, total) {
  return total ? `${Math.round((parte / total) * 100)}%` : '0%';
}

// juros compostos mês a mês; devolve o resultado do fim de cada ano
function simularInvestimento(inicial, aporte, taxaAno, anos) {
  const taxaMes = Math.pow(1 + taxaAno / 100, 1 / 12) - 1;
  const porAno = [];
  let saldo = inicial;
  for (let mes = 1; mes <= anos * 12; mes++) {
    saldo = saldo * (1 + taxaMes) + aporte;
    if (mes % 12 === 0) {
      porAno.push({ investido: inicial + aporte * mes, total: saldo });
    }
  }
  return porAno;
}

// guarda preferências pequenas no navegador (renda, simulador)
function lerLocal(chave, padrao) {
  try {
    const valor = localStorage.getItem(chave);
    return valor === null ? padrao : JSON.parse(valor);
  } catch {
    return padrao;
  }
}

function gravarLocal(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // sem espaço ou bloqueado: só não lembra da próxima vez
  }
}


/* ---------- CABEÇALHO E BARRA LATERAL ---------- */

const nome = pegarNome();
const primeiroNome = nome ? nome.split(' ')[0] : '';
document.getElementById('nomeUsuario').textContent = nome || 'Olá!';
document.getElementById('avatar').textContent = primeiroNome ? primeiroNome[0].toUpperCase() : '?';
document.getElementById('saudacao').textContent = primeiroNome ? `Olá, ${primeiroNome}` : 'Olá';
document.getElementById('botaoSair').addEventListener('click', sair);
document.getElementById('dataHoje').textContent = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long'
});

// no celular, a barra lateral abre por cima da página
document.getElementById('abrirMenu').addEventListener('click', () => {
  document.body.classList.add('menu-aberto');
});
document.getElementById('fundoMenu').addEventListener('click', fecharMenu);

function fecharMenu() {
  document.body.classList.remove('menu-aberto');
}


/* ---------- TROCA DE TELAS (pelo # do endereço) ---------- */

const TELAS = ['adicionar', 'mes', 'gastos', 'graficos', 'estatisticas', 'metas', 'investimentos'];

function telaAtual() {
  const tela = window.location.hash.slice(1);
  return TELAS.includes(tela) ? tela : 'adicionar';
}

function mostrarTela() {
  const atual = telaAtual();

  TELAS.forEach(tela => {
    document.getElementById(`tela-${tela}`).hidden = tela !== atual;
  });
  document.querySelectorAll('.lateral-menu a').forEach(link => {
    link.classList.toggle('ativo', link.dataset.tela === atual);
  });

  fecharMenu();
  window.scrollTo(0, 0);
  renderizar();
}

// desenha só a tela que está aparecendo (os gráficos precisam saber a largura)
function renderizar() {
  esconderDica();
  const desenhar = {
    adicionar: renderAdicionar,
    mes: renderMes,
    gastos: renderGastos,
    graficos: renderGraficos,
    estatisticas: renderEstatisticas,
    metas: renderMetas,
    investimentos: renderInvestimentos
  };
  desenhar[telaAtual()]();
}

window.addEventListener('hashchange', mostrarTela);

let esperandoRedesenho = false;
window.addEventListener('resize', () => {
  if (esperandoRedesenho) return;
  esperandoRedesenho = true;
  requestAnimationFrame(() => {
    esperandoRedesenho = false;
    renderizar();
  });
});


/* ---------- CAIXINHA DE DICA DOS GRÁFICOS ---------- */

const dica = document.getElementById('dica');

document.addEventListener('pointerover', evento => {
  const alvo = evento.target.closest('[data-dica]');
  if (!alvo) return esconderDica();
  dica.textContent = alvo.dataset.dica;
  dica.hidden = false;
});

document.addEventListener('pointermove', evento => {
  if (dica.hidden) return;
  const x = Math.min(evento.clientX + 14, window.innerWidth - dica.offsetWidth - 8);
  const y = evento.clientY - dica.offsetHeight - 14;
  dica.style.transform = `translate(${x}px, ${y < 8 ? evento.clientY + 18 : y}px)`;
});

function esconderDica() {
  dica.hidden = true;
}


/* ---------- CARREGAR OS GASTOS DO BACK ---------- */

const avisoBack = document.getElementById('avisoBack');

async function carregarGastos() {
  try {
    const resposta = await requisicao('/gastos');
    if (!resposta.ok) throw new Error();
    const dados = await resposta.json();

    gastos = dados.map(g => ({
      id: g.id,
      descricao: g.descricao || 'Sem descrição',
      valor: Number(g.valor) || 0,
      data: g.data || '',
      categoria: categoriaDe(g.categoria)
    }));
    avisoBack.hidden = true;
  } catch {
    avisoBack.textContent = 'Não consegui falar com o back-end. Ele está rodando na porta 8080?';
    avisoBack.hidden = false;
  }

  preencherMeses();
  renderizar();
}

// coloca nos <select> os meses que têm gastos (e sempre o mês atual)
function preencherMeses() {
  const meses = new Set(gastos.map(g => g.data.slice(0, 7)).filter(Boolean));
  meses.add(MES_ATUAL);
  const ordenados = [...meses].sort().reverse();

  const opcoes = ordenados.map(m => `<option value="${m}">${capitalizar(nomeMes(m))}</option>`).join('');

  ['mesResumo', 'graficoMes', 'estatMes', 'filtroMes'].forEach(id => {
    const select = document.getElementById(id);
    const escolhido = select.value;
    select.innerHTML = (id === 'filtroMes' ? '<option value="">Todos os meses</option>' : '') + opcoes;
    // mantém o que a pessoa já tinha escolhido
    if (escolhido && [...select.options].some(o => o.value === escolhido)) {
      select.value = escolhido;
    } else if (id !== 'filtroMes') {
      select.value = MES_ATUAL;
    }
  });
}


/* =========================================================
   TELA 1: ADICIONAR GASTO
   ========================================================= */

const form = document.getElementById('formGasto');
const mensagem = document.getElementById('mensagem');
const botaoSalvar = document.getElementById('botaoSalvar');
const botaoCancelar = document.getElementById('botaoCancelar');

// os botões de categoria (um "radio" para cada); nenhum vem marcado
document.getElementById('escolhaCategoria').innerHTML = CATEGORIAS.map(c => `
  <label class="chip">
    <input type="radio" name="categoria" value="${c.nome}">
    <span><i style="background: ${c.cor}"></i>${c.nome}</span>
  </label>`).join('');

const campoValor = document.getElementById('valor');
const campoDescricao = document.getElementById('descricao');
const campoData = document.getElementById('data');
const botaoData = document.getElementById('botaoData');
const tituloForm = document.getElementById('tituloForm');
const tituloOriginal = tituloForm.innerHTML;

// a data fica escondida: quase sempre o gasto é de hoje
botaoData.addEventListener('click', () => {
  botaoData.hidden = true;
  campoData.hidden = false;
  campoData.focus();
  try {
    campoData.showPicker();
  } catch {
    // navegador sem showPicker: a pessoa clica no campo
  }
});

function mostrarData(data, sempreVisivel = false) {
  campoData.value = data;
  const esconder = data === HOJE && !sempreVisivel;
  campoData.hidden = esconder;
  botaoData.hidden = !esconder;
}

mostrarData(HOJE);

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem lancar-mensagem ${tipo}`;
}

// "32,50", "1.234,56" ou "32.50" → número
function lerValor(texto) {
  let limpo = texto.replace(/[^\d.,]/g, '');
  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  }
  return Number(limpo);
}

// tela inicial: só o rodapé com o total de hoje e do mês
function renderAdicionar() {
  document.getElementById('rodapeHoje').textContent = moeda.format(somar(gastos.filter(g => g.data === HOJE)));
  document.getElementById('rodapeMes').textContent = moeda.format(somar(doMes(MES_ATUAL)));

  // no computador, o cursor já fica no valor
  if (window.matchMedia('(pointer: fine)').matches && document.activeElement === document.body) {
    campoValor.focus();
  }
}

form.addEventListener('submit', async evento => {
  evento.preventDefault();   // impede a página de recarregar

  const valor = lerValor(campoValor.value);
  const escolhida = form.querySelector('input[name="categoria"]:checked');

  if (!valor || valor <= 0) {
    mostrarMensagem('Digite quanto você gastou.', 'erro');
    return campoValor.focus();
  }
  if (!escolhida) {
    return mostrarMensagem('Toque em uma categoria.', 'erro');
  }

  const gasto = {
    // sem descrição, usa o nome da categoria
    descricao: campoDescricao.value.trim() || escolhida.value,
    valor,
    data: campoData.value || HOJE,
    categoria: escolhida.value
  };

  // editando usa PUT /gastos/{id}; novo usa POST /gastos
  const editando = editandoId;
  const caminho = editando ? `/gastos/${editando}` : '/gastos';
  const metodo = editando ? 'PUT' : 'POST';

  botaoSalvar.disabled = true;
  try {
    const resposta = await requisicao(caminho, { method: metodo, body: JSON.stringify(gasto) });
    if (!resposta.ok) throw new Error();
    const salvo = await resposta.json();

    limparFormulario();
    if (editando) {
      mostrarMensagem('✓ Gasto atualizado!', 'ok');
    } else {
      // avisa o que foi lançado e deixa desfazer, caso tenha errado
      mostrarMensagem(`✓ ${moeda.format(valor)} em ${gasto.categoria} lançado. `, 'ok');
      const desfazer = document.createElement('button');
      desfazer.type = 'button';
      desfazer.className = 'botao-texto';
      desfazer.dataset.desfazer = salvo.id;
      desfazer.textContent = 'Desfazer';
      mensagem.append(desfazer);
    }
    await carregarGastos();
    campoValor.focus();
  } catch {
    mostrarMensagem('Não foi possível salvar. Confira se o back-end está rodando.', 'erro');
  } finally {
    botaoSalvar.disabled = false;
  }
});

function iniciarEdicao(id) {
  const gasto = gastos.find(g => g.id === id);
  if (!gasto) return;

  editandoId = id;
  campoValor.value = String(gasto.valor).replace('.', ',');
  campoDescricao.value = gasto.descricao;
  mostrarData(gasto.data, true);
  form.querySelector(`input[name="categoria"][value="${gasto.categoria.nome}"]`).checked = true;

  tituloForm.innerHTML = 'Editar <em>gasto</em>';
  botaoSalvar.textContent = 'Salvar alterações';
  botaoCancelar.hidden = false;
  mostrarMensagem('', '');

  window.location.hash = 'adicionar';
  campoValor.focus();
}

function limparFormulario() {
  editandoId = null;
  campoValor.value = '';
  campoDescricao.value = '';
  form.querySelectorAll('input[name="categoria"]').forEach(radio => { radio.checked = false; });
  mostrarData(HOJE);
  tituloForm.innerHTML = tituloOriginal;
  botaoSalvar.textContent = 'Lançar gasto';
  botaoCancelar.hidden = true;
}

botaoCancelar.addEventListener('click', () => {
  limparFormulario();
  mostrarMensagem('', '');
});

// "Desfazer" logo depois de lançar: apaga sem perguntar
async function desfazerLancamento(id) {
  try {
    const resposta = await requisicao(`/gastos/${id}`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error();
    mostrarMensagem('Lançamento desfeito.', '');
    await carregarGastos();
  } catch {
    mostrarMensagem('Não foi possível desfazer.', 'erro');
  }
}


/* =========================================================
   TELA: MEU MÊS (o resumo de verdade)
   ========================================================= */

const mesResumo = document.getElementById('mesResumo');
mesResumo.addEventListener('input', renderMes);

function renderMes() {
  const mes = mesResumo.value || MES_ATUAL;
  const lista = doMes(mes);
  const total = somar(lista);
  const passados = diasPassados(mes);
  const ehAtual = mes === MES_ATUAL;

  document.getElementById('totalMes').textContent = moeda.format(total);

  // mês atual: compara com o mesmo pedaço do mês passado (ex.: 1 a 23 de setembro)
  // mês fechado: compara com o mês anterior inteiro
  const anterior = mesAnterior(mes);
  const limite = `${anterior}-${String(passados).padStart(2, '0')}`;
  const totalAnterior = somar(doMes(anterior).filter(g => !ehAtual || g.data <= limite));
  const comparacao = document.getElementById('comparacaoMes');
  const nomeAnterior = NOMES_MESES[anterior.split('-')[1] - 1];

  if (totalAnterior > 0) {
    const diferenca = (total / totalAnterior - 1) * 100;
    const subiu = diferenca >= 0;
    comparacao.textContent = `${subiu ? '▲' : '▼'} ${Math.abs(diferenca).toFixed(0)}% vs. ${ehAtual ? 'mesmo período de ' : ''}${nomeAnterior}`;
    comparacao.className = subiu ? 'subiu' : 'desceu';
  } else {
    comparacao.textContent = `sem gastos em ${nomeAnterior}`;
    comparacao.className = '';
  }

  const categorias = totaisPorCategoria(lista);
  document.getElementById('qtdMes').textContent = lista.length;
  document.getElementById('maiorCategoriaMes').textContent =
    categorias.length ? `mais em ${categorias[0].nome}` : 'nenhum ainda';

  const media = total / passados;
  document.getElementById('mediaDia').textContent = moeda.format(media);
  document.getElementById('mediaDiaInfo').textContent = `em ${passados} dia${passados > 1 ? 's' : ''}`;

  // mês atual mostra a previsão; mês fechado mostra o maior gasto
  if (ehAtual) {
    document.getElementById('previsaoRotulo').textContent = 'Previsão para o mês';
    document.getElementById('previsaoMes').textContent = moeda.format(media * diasNoMes(mes));
    document.getElementById('previsaoInfo').textContent = 'se continuar nesse ritmo';
  } else {
    const maior = lista.reduce((m, g) => (!m || g.valor > m.valor ? g : m), null);
    document.getElementById('previsaoRotulo').textContent = 'Maior gasto';
    document.getElementById('previsaoMes').textContent = maior ? moeda.format(maior.valor) : '—';
    document.getElementById('previsaoInfo').textContent = maior ? maior.descricao : 'nenhum gasto';
  }

  // para onde foi (uma barra por categoria)
  const porCategoria = document.getElementById('porCategoriaMes');
  porCategoria.innerHTML = categorias.length === 0
    ? '<li class="vazio">Nenhum gasto neste mês.</li>'
    : categorias.map(c => `
      <li data-dica="${c.nome}\n${moeda.format(c.valor)} · ${porcentagem(c.valor, total)}">
        <span><i class="ponto" style="background: ${c.cor}"></i>${c.nome}</span>
        <div class="trilho"><span style="width: ${(c.valor / categorias[0].valor) * 100}%; background: ${c.cor}"></span></div>
        <strong>${moeda.format(c.valor)}</strong>
      </li>`).join('');

  renderResumoMetas();

  // últimos lançamentos do mês
  const ultimos = document.getElementById('ultimosGastos');
  const recentes = maisRecentes(lista).slice(0, 7);

  if (recentes.length === 0) {
    ultimos.innerHTML = '<li class="vazio">Seus gastos vão aparecer aqui.</li>';
    return;
  }

  ultimos.innerHTML = recentes.map(g => `
    <li>
      <div>
        <span class="gasto-descricao">${escapar(g.descricao)}</span>
        <span class="gasto-info"><i class="ponto" style="background: ${g.categoria.cor}"></i>${g.categoria.nome} · ${formatarData(g.data)}</span>
      </div>
      <span class="gasto-valor">${moeda.format(g.valor)}</span>
      <button type="button" class="botao-icone" data-editar="${g.id}" title="Editar gasto">✎</button>
    </li>`).join('');
}

async function apagarGasto(id) {
  const gasto = gastos.find(g => g.id === id);
  if (!confirm(`Apagar "${gasto ? gasto.descricao : 'este gasto'}"?`)) return;

  try {
    const resposta = await requisicao(`/gastos/${id}`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error();
    if (editandoId === id) limparFormulario();
    await carregarGastos();
  } catch {
    alert('Não foi possível apagar esse gasto.');
  }
}

// um único "ouvinte" para todos os botões de editar, apagar e desfazer da página
document.addEventListener('click', evento => {
  const editar = evento.target.closest('[data-editar]');
  const apagar = evento.target.closest('[data-apagar]');
  if (editar) iniciarEdicao(Number(editar.dataset.editar));
  if (apagar) apagarGasto(Number(apagar.dataset.apagar));
  const desfazer = evento.target.closest('[data-desfazer]');
  if (desfazer) desfazerLancamento(Number(desfazer.dataset.desfazer));
});


/* =========================================================
   TELA 2: MEUS GASTOS
   ========================================================= */

const filtroBusca = document.getElementById('filtroBusca');
const filtroMes = document.getElementById('filtroMes');
const filtroCategoria = document.getElementById('filtroCategoria');

filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>' +
  CATEGORIAS.map(c => `<option>${c.nome}</option>`).join('');

[filtroBusca, filtroMes, filtroCategoria].forEach(campo => {
  campo.addEventListener('input', renderGastos);
});

function renderGastos() {
  const busca = simplificar(filtroBusca.value);
  const mes = filtroMes.value;
  const categoria = filtroCategoria.value;

  const filtrados = maisRecentes(gastos).filter(g =>
    (!busca || simplificar(g.descricao).includes(busca)) &&
    (!mes || g.data.startsWith(mes)) &&
    (!categoria || g.categoria.nome === categoria)
  );

  document.getElementById('resumoFiltro').textContent =
    `${filtrados.length} gasto${filtrados.length === 1 ? '' : 's'}`;
  document.getElementById('totalFiltro').textContent = moeda.format(somar(filtrados));

  const corpo = document.getElementById('corpoTabela');

  if (filtrados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum gasto encontrado.</td></tr>';
    return;
  }

  corpo.innerHTML = filtrados.map(g => `
    <tr>
      <td class="tabela-data">${formatarData(g.data)}</td>
      <td>${escapar(g.descricao)}</td>
      <td><span class="etiqueta"><i class="ponto" style="background: ${g.categoria.cor}"></i>${g.categoria.nome}</span></td>
      <td class="num">${moeda.format(g.valor)}</td>
      <td class="acoes">
        <button type="button" class="botao-icone" data-editar="${g.id}" title="Editar">✎</button>
        <button type="button" class="botao-icone apagar" data-apagar="${g.id}" title="Apagar">×</button>
      </td>
    </tr>`).join('');
}


/* =========================================================
   GRÁFICO DE BARRAS (usado em várias telas)
   ========================================================= */

// arredonda o topo do eixo para um número "bonito" (100, 250, 500, 1000…)
function topoDoEixo(valor) {
  if (valor <= 0) return 100;
  const potencia = Math.pow(10, Math.floor(Math.log10(valor)));
  const n = valor / potencia;
  const passo = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return passo * potencia;
}

// retângulo com só os cantos de cima arredondados
function caminhoBarra(x, y, largura, altura, raio = 4) {
  const r = Math.min(raio, largura / 2, altura);
  return `M${x},${y + altura}V${y + r}Q${x},${y} ${x + r},${y}H${x + largura - r}` +
    `Q${x + largura},${y} ${x + largura},${y + r}V${y + altura}Z`;
}

// itens: [{ rotulo, partes: [{ valor, classe }], dica, destaque, mostrarRotulo }]
function desenharBarras(svg, itens, { rotularMaior = true } = {}) {
  const largura = svg.clientWidth;
  const altura = svg.clientHeight;
  if (!largura || itens.length === 0) return;

  const esquerda = 64;
  const baixo = 26;
  const topo = 22;
  const alturaUtil = altura - baixo - topo;
  const base = altura - baixo;

  const totais = itens.map(item => item.partes.reduce((s, p) => s + p.valor, 0));
  // 4 faixas de tamanho "bonito" (ex.: 0, 1 mil, 2 mil, 3 mil, 4 mil)
  const maximo = topoDoEixo(Math.max(...totais) / 4) * 4;
  const espaco = (largura - esquerda) / itens.length;
  const larguraBarra = Math.max(Math.min(espaco * 0.62, 56), 3);

  let conteudo = '';

  // linhas de grade + valores do eixo
  for (let i = 0; i <= 4; i++) {
    const valor = (maximo / 4) * i;
    const y = base - (valor / maximo) * alturaUtil;
    conteudo += `<line class="${i === 0 ? 'eixo' : 'grade'}" x1="${esquerda}" x2="${largura}" y1="${y}" y2="${y}"></line>`;
    conteudo += `<text class="eixo-texto" x="${esquerda - 8}" y="${y + 4}" text-anchor="end">${moedaCurta.format(valor)}</text>`;
  }

  const indiceMaior = totais.indexOf(Math.max(...totais));

  itens.forEach((item, i) => {
    const x = esquerda + i * espaco + (espaco - larguraBarra) / 2;
    let y = base;

    // empilha as partes de baixo para cima, com 2px de folga entre elas
    item.partes.forEach((parte, p) => {
      const h = (parte.valor / maximo) * alturaUtil;
      if (h <= 0) return;
      const ultima = p === item.partes.length - 1;
      const folga = p > 0 ? 2 : 0;
      y -= h;
      conteudo += ultima
        ? `<path class="${parte.classe}" d="${caminhoBarra(x, y, larguraBarra, Math.max(h - folga, 0))}"></path>`
        : `<rect class="${parte.classe}" x="${x}" y="${y}" width="${larguraBarra}" height="${Math.max(h - folga, 0)}"></rect>`;
    });

    // só o maior valor ganha o número escrito em cima
    if (rotularMaior && i === indiceMaior && totais[i] > 0) {
      conteudo += `<text class="valor-texto" x="${x + larguraBarra / 2}" y="${y - 7}" text-anchor="middle">${moedaCurta.format(totais[i])}</text>`;
    }

    if (item.mostrarRotulo !== false) {
      conteudo += `<text class="eixo-texto${item.destaque ? ' forte' : ''}" x="${x + larguraBarra / 2}" y="${altura - 7}" text-anchor="middle">${item.rotulo}</text>`;
    }

    // área invisível maior que a barra, para o mouse achar fácil
    conteudo += `<rect class="alvo" x="${esquerda + i * espaco}" y="${topo}" width="${espaco}" height="${alturaUtil}" data-dica="${escapar(item.dica)}"></rect>`;
  });

  svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`);
  svg.innerHTML = conteudo;
}


/* =========================================================
   TELA 3: GRÁFICOS
   ========================================================= */

const graficoMes = document.getElementById('graficoMes');
graficoMes.addEventListener('input', renderGraficos);

// soma por categoria; devolve só as que têm gasto, da maior para a menor
function totaisPorCategoria(lista) {
  return CATEGORIAS
    .map(c => ({ ...c, valor: somar(lista.filter(g => g.categoria === c)) }))
    .filter(c => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);
}

function renderGraficos() {
  const mes = graficoMes.value || MES_ATUAL;
  const doMesEscolhido = doMes(mes);
  const total = somar(doMesEscolhido);

  // ROSCA POR CATEGORIA
  const categorias = totaisPorCategoria(doMesEscolhido);
  document.getElementById('subCategoria').textContent =
    `${capitalizar(nomeMes(mes))} · ${doMesEscolhido.length} lançamento${doMesEscolhido.length === 1 ? '' : 's'}`;
  desenharRosca(categorias, total);

  // ÚLTIMOS 6 MESES
  const meses = [5, 4, 3, 2, 1, 0].map(n => mesAnterior(mes, n));
  desenharBarras(document.getElementById('graficoMeses'), meses.map(m => {
    const valor = somar(doMes(m));
    return {
      rotulo: mesCurto(m),
      destaque: m === mes,
      partes: [{ valor, classe: m === mes ? 'barra' : 'barra fraca' }],
      dica: `${capitalizar(nomeMes(m))}\n${moeda.format(valor)}`
    };
  }));

  // DIA A DIA
  const dias = diasNoMes(mes);
  const pulo = document.getElementById('graficoDias').clientWidth < 560 ? 5 : 2;
  const itensDias = [];
  for (let d = 1; d <= dias; d++) {
    const data = `${mes}-${String(d).padStart(2, '0')}`;
    const doDia = doMesEscolhido.filter(g => g.data === data);
    const valor = somar(doDia);
    itensDias.push({
      rotulo: d,
      destaque: data === HOJE,
      mostrarRotulo: d === 1 || d % pulo === 0,
      partes: [{ valor, classe: 'barra' }],
      dica: `${formatarData(data)} · ${DIAS_SEMANA[deISO(data).getDay()]}\n${moeda.format(valor)}` +
        (doDia.length ? `\n${doDia.length} lançamento${doDia.length > 1 ? 's' : ''}` : '')
    });
  }
  const passados = diasPassados(mes);
  document.getElementById('subDias').textContent =
    `${capitalizar(nomeMes(mes))} · média de ${moeda.format(total / passados)} por dia`;
  desenharBarras(document.getElementById('graficoDias'), itensDias);
}

function desenharRosca(categorias, total) {
  const svg = document.getElementById('graficoRosca');
  const legenda = document.getElementById('legendaRosca');
  const raio = 74;
  const espessura = 26;
  const circunferencia = 2 * Math.PI * raio;
  const folga = categorias.length > 1 ? 2 : 0;

  let conteudo = `<circle class="rosca-fundo" cx="100" cy="100" r="${raio}" stroke-width="${espessura}"></circle>`;
  let andou = 0;

  categorias.forEach(c => {
    const tamanho = (c.valor / total) * circunferencia;
    conteudo += `<circle class="rosca-fatia" cx="100" cy="100" r="${raio}" stroke="${c.cor}" stroke-width="${espessura}"
      stroke-dasharray="${Math.max(tamanho - folga, 0.5)} ${circunferencia}"
      stroke-dashoffset="${-andou}" transform="rotate(-90 100 100)"
      data-dica="${c.nome}\n${moeda.format(c.valor)} · ${porcentagem(c.valor, total)}"></circle>`;
    andou += tamanho;
  });

  conteudo += `<text class="rosca-total" x="100" y="102" text-anchor="middle">${moedaCurta.format(total)}</text>`;
  conteudo += `<text class="rosca-legenda" x="100" y="124" text-anchor="middle">no mês</text>`;
  svg.innerHTML = conteudo;

  if (categorias.length === 0) {
    legenda.innerHTML = '<li class="vazio">Nenhum gasto neste mês.</li>';
    return;
  }

  legenda.innerHTML = categorias.map(c => `
    <li>
      <i class="ponto" style="background: ${c.cor}"></i>
      <span>${c.nome}</span>
      <strong>${moeda.format(c.valor)}</strong>
      <small>${porcentagem(c.valor, total)}</small>
    </li>`).join('');
}


/* =========================================================
   TELA 4: ESTATÍSTICAS
   ========================================================= */

const estatMes = document.getElementById('estatMes');
estatMes.addEventListener('input', renderEstatisticas);

function renderEstatisticas() {
  const mes = estatMes.value || MES_ATUAL;
  const lista = doMes(mes);
  const total = somar(lista);
  const passados = diasPassados(mes);

  // MAIOR GASTO
  const maior = lista.reduce((m, g) => (!m || g.valor > m.valor ? g : m), null);
  document.getElementById('estMaior').textContent = maior ? moeda.format(maior.valor) : '—';
  document.getElementById('estMaiorInfo').textContent = maior
    ? `${maior.descricao} · ${formatarData(maior.data)} (${porcentagem(maior.valor, total)} do mês)`
    : 'Nenhum gasto neste mês.';

  // VALOR MÉDIO POR GASTO
  document.getElementById('estTicket').textContent = lista.length ? moeda.format(total / lista.length) : '—';
  document.getElementById('estTicketInfo').textContent =
    `${lista.length} lançamento${lista.length === 1 ? '' : 's'} em ${nomeMes(mes)}`;

  // DIAS SEM GASTAR
  const diasComGasto = new Set(lista.map(g => g.data));
  const semGastar = passados - [...diasComGasto].filter(d => Number(d.slice(8)) <= passados).length;
  document.getElementById('estDiasSem').textContent = `${semGastar} de ${passados}`;

  let infoDias = `${porcentagem(semGastar, passados)} dos dias sem nenhum gasto`;
  if (mes === MES_ATUAL) {
    // sequência atual: dias seguidos sem gasto, contando de hoje para trás
    let sequencia = 0;
    const dia = deISO(HOJE);
    while (!gastos.some(g => g.data === paraISO(dia)) && sequencia < 365) {
      sequencia++;
      dia.setDate(dia.getDate() - 1);
    }
    if (sequencia > 0) infoDias = `Você está há ${sequencia} dia${sequencia > 1 ? 's' : ''} sem gastar 🎉`;
  }
  document.getElementById('estDiasSemInfo').textContent = infoDias;

  // FIM DE SEMANA
  const noFimDeSemana = somar(lista.filter(g => [0, 6].includes(deISO(g.data).getDay())));
  document.getElementById('estFimSemana').textContent = porcentagem(noFimDeSemana, total);
  document.getElementById('estFimSemanaInfo').textContent =
    `${moeda.format(noFimDeSemana)} gastos em sábados e domingos`;

  desenharCalendario(mes, lista);
  desenharSemana();
  desenharRegra(lista, total);
  desenharRepetidos();
  desenharMesesExtremos();
}

function desenharCalendario(mes, lista) {
  const calendario = document.getElementById('calendario');
  const dias = diasNoMes(mes);
  const primeiroDia = deISO(`${mes}-01`).getDay();

  const porDia = {};
  lista.forEach(g => { porDia[g.data] = (porDia[g.data] || 0) + g.valor; });
  const maximo = Math.max(0, ...Object.values(porDia));

  let html = DIAS_CURTOS.map(d => `<span class="calendario-semana">${d[0]}</span>`).join('');
  html += '<span class="calendario-vazio"></span>'.repeat(primeiroDia);

  for (let d = 1; d <= dias; d++) {
    const data = `${mes}-${String(d).padStart(2, '0')}`;
    const valor = porDia[data] || 0;
    // nível de 0 (nada) a 4 (o dia mais caro)
    const nivel = valor ? Math.max(1, Math.ceil((valor / maximo) * 4)) : 0;
    const futuro = data > HOJE;
    html += `<span class="calendario-dia nivel-${nivel}${data === HOJE ? ' hoje' : ''}${futuro ? ' futuro' : ''}"
      data-dica="${formatarData(data)} · ${DIAS_SEMANA[deISO(data).getDay()]}\n${valor ? moeda.format(valor) : 'Nenhum gasto'}">${d}</span>`;
  }
  calendario.innerHTML = html;
}

function desenharSemana() {
  const porDia = [0, 0, 0, 0, 0, 0, 0];
  const quantos = [0, 0, 0, 0, 0, 0, 0];
  gastos.forEach(g => {
    if (!g.data) return;
    const dia = deISO(g.data).getDay();
    porDia[dia] += g.valor;
    quantos[dia]++;
  });

  const maior = porDia.indexOf(Math.max(...porDia));
  document.getElementById('subSemana').textContent = gastos.length
    ? `Em todo o histórico, ${DIAS_SEMANA[maior]} é o dia em que mais sai dinheiro`
    : 'Ainda não há gastos para comparar';

  desenharBarras(document.getElementById('graficoSemana'), DIAS_CURTOS.map((rotulo, i) => ({
    rotulo,
    destaque: i === maior,
    partes: [{ valor: porDia[i], classe: i === maior ? 'barra' : 'barra fraca' }],
    dica: `${capitalizar(DIAS_SEMANA[i])}\n${moeda.format(porDia[i])} em ${quantos[i]} lançamento${quantos[i] === 1 ? '' : 's'}`
  })));
}

function desenharRegra(lista, total) {
  const essencial = somar(lista.filter(g => g.categoria.tipo === 'essencial'));
  const desejos = total - essencial;
  const renda = Number(lerLocal('renda', 0));
  const barra = document.getElementById('barraRegra');
  const texto = document.getElementById('regraTexto');

  // com renda informada, compara com a renda; sem renda, só divide o que foi gasto
  const base = renda > 0 ? Math.max(renda, total) : total;
  const sobra = renda > 0 ? Math.max(renda - total, 0) : 0;

  const partes = [
    { nome: 'Essencial', valor: essencial, classe: 'regra-essencial', meta: 50 },
    { nome: 'Desejos', valor: desejos, classe: 'regra-desejos', meta: 30 },
    { nome: 'Sobrou', valor: sobra, classe: 'regra-sobra', meta: 20 }
  ].filter(p => p.valor > 0);

  if (base === 0) {
    barra.innerHTML = '<span class="regra-vazia">Sem gastos neste mês</span>';
    texto.textContent = '';
    return;
  }

  barra.innerHTML = partes.map(p => `
    <div class="${p.classe}" style="flex: ${p.valor}" data-dica="${p.nome}\n${moeda.format(p.valor)} · ${porcentagem(p.valor, base)}">
      <strong>${porcentagem(p.valor, base)}</strong>${p.nome}
    </div>`).join('');

  if (renda > 0) {
    const pctEssencial = (essencial / renda) * 100;
    const pctDesejos = (desejos / renda) * 100;
    const pctSobra = (sobra / renda) * 100;
    const avisos = [];
    if (pctEssencial > 50) avisos.push(`o essencial passou dos 50% (${pctEssencial.toFixed(0)}%)`);
    if (pctDesejos > 30) avisos.push(`os desejos passaram dos 30% (${pctDesejos.toFixed(0)}%)`);
    texto.textContent = avisos.length
      ? `Atenção: ${avisos.join(' e ')}. A referência é 50% essencial, 30% desejos e 20% para o futuro.`
      : pctSobra >= 20
        ? 'Dentro da regra! Você está guardando 20% ou mais da sua renda. 👏'
        : `Dentro dos limites de gasto, mas sobraram só ${pctSobra.toFixed(0)}% da renda. A meta é guardar 20%.`;
  } else {
    texto.textContent = 'Informe sua renda na aba Investimentos para comparar com a regra 50/30/20.';
  }
}

function desenharRepetidos() {
  const grupos = {};
  gastos.forEach(g => {
    const chave = simplificar(g.descricao);
    if (!grupos[chave]) grupos[chave] = { nome: g.descricao, vezes: 0, total: 0, cor: g.categoria.cor };
    grupos[chave].vezes++;
    grupos[chave].total += g.valor;
  });

  const repetidos = Object.values(grupos)
    .filter(g => g.vezes > 1)
    .sort((a, b) => b.vezes - a.vezes || b.total - a.total)
    .slice(0, 5);

  const lista = document.getElementById('listaRepetidos');
  if (repetidos.length === 0) {
    lista.innerHTML = '<li class="vazio">Nenhuma descrição se repetiu ainda.</li>';
    return;
  }

  lista.innerHTML = repetidos.map((g, i) => `
    <li>
      <span class="ranking-posicao">${i + 1}</span>
      <div>
        <span class="gasto-descricao">${escapar(g.nome)}</span>
        <span class="gasto-info">${g.vezes} vezes · média de ${moeda.format(g.total / g.vezes)}</span>
      </div>
      <strong>${moeda.format(g.total)}</strong>
    </li>`).join('');
}

function desenharMesesExtremos() {
  const porMes = {};
  gastos.forEach(g => {
    if (!g.data) return;
    const m = g.data.slice(0, 7);
    porMes[m] = (porMes[m] || 0) + g.valor;
  });
  const meses = Object.entries(porMes).sort((a, b) => b[1] - a[1]);
  const caixa = document.getElementById('mesesExtremos');

  if (meses.length < 2) {
    caixa.innerHTML = '<p class="vazio">Com pelo menos dois meses de gastos, a comparação aparece aqui.</p>';
    return;
  }

  const [caro, valorCaro] = meses[0];
  const [barato, valorBarato] = meses[meses.length - 1];
  const media = meses.reduce((s, m) => s + m[1], 0) / meses.length;

  caixa.innerHTML = `
    <div><span>Mais caro</span><strong>${moeda.format(valorCaro)}</strong><small>${capitalizar(nomeMes(caro))}</small></div>
    <div><span>Mais econômico</span><strong>${moeda.format(valorBarato)}</strong><small>${capitalizar(nomeMes(barato))}</small></div>
    <div><span>Média mensal</span><strong>${moeda.format(media)}</strong><small>${meses.length} meses com gastos</small></div>`;
}


/* =========================================================
   TELA 5: METAS (ficam guardadas neste navegador)
   ========================================================= */

const CHAVE_METAS = `metas:${nome || 'eu'}`;
const CHAVE_NOTAS = `anotacoes:${nome || 'eu'}`;

let metas = lerLocal(CHAVE_METAS, []);
let editandoMetaId = null;
let filtroMetas = 'ativas';

const formMeta = document.getElementById('formMeta');
const botaoSalvarMeta = document.getElementById('botaoSalvarMeta');
const botaoCancelarMeta = document.getElementById('botaoCancelarMeta');

function salvarMetas() {
  gravarLocal(CHAVE_METAS, metas);
}

// quantos meses faltam até o prazo (no mínimo 1)
function mesesAte(prazo) {
  const hoje = deISO(HOJE);
  const fim = deISO(prazo);
  const meses = (fim.getFullYear() - hoje.getFullYear()) * 12 + (fim.getMonth() - hoje.getMonth()) +
    (fim.getDate() >= hoje.getDate() ? 0 : -1);
  return Math.max(meses, 1);
}

// quanto guardar por mês para bater a meta no prazo
function porMesDaMeta(meta) {
  const falta = Math.max(meta.valor - meta.guardado, 0);
  if (!meta.prazo || meta.concluida || falta === 0) return 0;
  return falta / mesesAte(meta.prazo);
}

function situacaoDoPrazo(meta) {
  if (meta.concluida) return 'Concluída 🎉';
  if (!meta.prazo) return 'Sem prazo definido';
  if (meta.prazo < HOJE) return `Prazo vencido em ${formatarData(meta.prazo)}`;
  const meses = mesesAte(meta.prazo);
  return `Até ${formatarData(meta.prazo)} · ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}

formMeta.addEventListener('submit', evento => {
  evento.preventDefault();

  const dados = {
    nome: document.getElementById('metaNome').value.trim(),
    valor: Number(document.getElementById('metaValor').value),
    guardado: Number(document.getElementById('metaGuardado').value) || 0,
    prazo: document.getElementById('metaPrazo').value,
    notas: document.getElementById('metaNotas').value.trim()
  };

  if (editandoMetaId) {
    Object.assign(metas.find(m => m.id === editandoMetaId), dados);
  } else {
    metas.push({ id: Date.now(), criada: HOJE, concluida: false, historico: [], ...dados });
  }

  salvarMetas();
  limparFormMeta();
  renderMetas();
});

function limparFormMeta() {
  editandoMetaId = null;
  formMeta.reset();
  document.getElementById('tituloFormMeta').textContent = 'Nova meta';
  botaoSalvarMeta.textContent = 'Criar meta';
  botaoCancelarMeta.hidden = true;
}

botaoCancelarMeta.addEventListener('click', limparFormMeta);

function editarMeta(id) {
  const meta = metas.find(m => m.id === id);
  editandoMetaId = id;
  document.getElementById('metaNome').value = meta.nome;
  document.getElementById('metaValor').value = meta.valor;
  document.getElementById('metaGuardado').value = meta.guardado;
  document.getElementById('metaPrazo').value = meta.prazo;
  document.getElementById('metaNotas').value = meta.notas;
  document.getElementById('tituloFormMeta').textContent = 'Editar meta';
  botaoSalvarMeta.textContent = 'Salvar alterações';
  botaoCancelarMeta.hidden = false;
  formMeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('metaNome').focus();
}

// botões de cada cartão de meta: guardar, tirar, editar, concluir, apagar
document.getElementById('listaMetas').addEventListener('click', evento => {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const cartao = botao.closest('[data-meta]');
  const meta = metas.find(m => m.id === Number(cartao.dataset.meta));
  const acao = botao.dataset.acao;

  if (acao === 'guardar' || acao === 'retirar') {
    const campo = cartao.querySelector('.meta-quantia');
    const quantia = Number(campo.value);
    if (!quantia || quantia <= 0) return campo.focus();
    const sinal = acao === 'guardar' ? 1 : -1;
    meta.guardado = Math.max(meta.guardado + sinal * quantia, 0);
    meta.historico.unshift({ data: HOJE, valor: sinal * quantia });
    if (meta.guardado >= meta.valor) meta.concluida = true;
  }
  if (acao === 'editar') return editarMeta(meta.id);
  if (acao === 'concluir') meta.concluida = !meta.concluida;
  if (acao === 'apagar') {
    if (!confirm(`Apagar a meta "${meta.nome}"?`)) return;
    metas = metas.filter(m => m !== meta);
  }

  salvarMetas();
  renderMetas();
});

// "Enter" no campo de valor também guarda
document.getElementById('listaMetas').addEventListener('keydown', evento => {
  if (evento.key === 'Enter' && evento.target.classList.contains('meta-quantia')) {
    evento.preventDefault();
    evento.target.closest('[data-meta]').querySelector('[data-acao="guardar"]').click();
  }
});

document.querySelectorAll('.aba-meta').forEach(aba => {
  aba.addEventListener('click', () => {
    filtroMetas = aba.dataset.filtro;
    document.querySelectorAll('.aba-meta').forEach(a => a.classList.toggle('ativa', a === aba));
    renderMetas();
  });
});

// bloco de anotações: salva sozinho enquanto digita
const blocoNotas = document.getElementById('blocoNotas');
const notaSalva = document.getElementById('notaSalva');
blocoNotas.value = lerLocal(CHAVE_NOTAS, '');
let esperaNota;
blocoNotas.addEventListener('input', () => {
  notaSalva.textContent = 'Salvando…';
  clearTimeout(esperaNota);
  esperaNota = setTimeout(() => {
    gravarLocal(CHAVE_NOTAS, blocoNotas.value);
    notaSalva.textContent = `Salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }, 500);
});

function renderMetas() {
  const ativas = metas.filter(m => !m.concluida);
  const concluidas = metas.filter(m => m.concluida);
  const guardado = metas.reduce((s, m) => s + m.guardado, 0);
  const objetivo = metas.reduce((s, m) => s + m.valor, 0);

  document.getElementById('metasAtivas').textContent = ativas.length;
  document.getElementById('metasConcluidas').textContent =
    `${concluidas.length} concluída${concluidas.length === 1 ? '' : 's'}`;
  document.getElementById('metasGuardado').textContent = moeda.format(guardado);
  document.getElementById('metasDe').textContent = `de ${moeda.format(objetivo)} (${porcentagem(guardado, objetivo)})`;
  document.getElementById('metasPorMes').textContent =
    moeda.format(ativas.reduce((s, m) => s + porMesDaMeta(m), 0));

  const lista = document.getElementById('listaMetas');
  const mostrar = filtroMetas === 'ativas' ? ativas : concluidas;

  if (mostrar.length === 0) {
    lista.innerHTML = `<p class="vazio cartao">${filtroMetas === 'ativas'
      ? 'Nenhuma meta em andamento. Crie a primeira no formulário acima!'
      : 'Nenhuma meta concluída ainda. Você chega lá!'}</p>`;
    return;
  }

  lista.innerHTML = mostrar.map(m => {
    const progresso = Math.min((m.guardado / m.valor) * 100, 100);
    const porMes = porMesDaMeta(m);
    const atrasada = !m.concluida && m.prazo && m.prazo < HOJE;
    const ultimos = m.historico.slice(0, 3).map(h =>
      `<li><span>${formatarData(h.data)}</span><span class="${h.valor < 0 ? 'negativo' : 'positivo'}">${h.valor < 0 ? '−' : '+'} ${moeda.format(Math.abs(h.valor))}</span></li>`
    ).join('');

    return `
      <article class="cartao meta${m.concluida ? ' concluida' : ''}" data-meta="${m.id}">
        <div class="meta-topo">
          <div>
            <h3>${escapar(m.nome)}</h3>
            <span class="meta-prazo${atrasada ? ' atrasada' : ''}">${situacaoDoPrazo(m)}</span>
          </div>
          <strong class="meta-pct">${Math.floor(progresso)}%</strong>
        </div>

        <div class="meta-trilho" data-dica="${moeda.format(m.guardado)} de ${moeda.format(m.valor)}"><span style="width: ${progresso}%"></span></div>
        <div class="meta-valores">
          <span><strong>${moeda.format(m.guardado)}</strong> de ${moeda.format(m.valor)}</span>
          <span>${m.concluida ? '' : `faltam ${moeda.format(Math.max(m.valor - m.guardado, 0))}`}</span>
        </div>

        ${porMes ? `<p class="meta-dica">Guardando <strong>${moeda.format(porMes)}</strong> por mês você chega lá no prazo.</p>` : ''}
        ${m.notas ? `<p class="meta-notas">${escapar(m.notas)}</p>` : ''}
        ${ultimos ? `<ul class="meta-historico">${ultimos}</ul>` : ''}

        ${m.concluida ? '' : `
        <div class="meta-guardar">
          <input type="number" class="meta-quantia" min="0.01" step="0.01" placeholder="R$ valor" aria-label="Valor">
          <button type="button" data-acao="guardar">Guardar</button>
          <button type="button" data-acao="retirar" class="secundario">Retirar</button>
        </div>`}

        <div class="meta-acoes">
          <button type="button" data-acao="editar">Editar</button>
          <button type="button" data-acao="concluir">${m.concluida ? 'Reabrir' : 'Marcar como concluída'}</button>
          <button type="button" data-acao="apagar" class="perigo">Apagar</button>
        </div>
      </article>`;
  }).join('');
}

// resumo que aparece na tela inicial
function renderResumoMetas() {
  const lista = document.getElementById('resumoMetas');
  const ativas = metas.filter(m => !m.concluida).slice(0, 4);

  if (ativas.length === 0) {
    lista.innerHTML = '<li class="vazio">Nenhuma meta ainda. <a href="#metas">Crie sua primeira meta</a> — uma viagem, uma reserva, um celular novo…</li>';
    return;
  }

  lista.innerHTML = ativas.map(m => {
    const progresso = Math.min((m.guardado / m.valor) * 100, 100);
    return `
      <li>
        <div class="metas-mini-topo">
          <span>${escapar(m.nome)}</span>
          <small>${moeda.format(m.guardado)} de ${moeda.format(m.valor)}</small>
        </div>
        <div class="meta-trilho"><span style="width: ${progresso}%"></span></div>
      </li>`;
  }).join('');
}


/* =========================================================
   TELA 6: INVESTIMENTOS
   ========================================================= */

const campoRenda = document.getElementById('renda');
const simInicial = document.getElementById('simInicial');
const simAporte = document.getElementById('simAporte');
const simTaxa = document.getElementById('simTaxa');
const simAnos = document.getElementById('simAnos');

// o navegador lembra o que a pessoa digitou da última vez
const salvo = lerLocal('simulador', {});
campoRenda.value = lerLocal('renda', '') || '';
if (salvo.inicial !== undefined) simInicial.value = salvo.inicial;
if (salvo.aporte !== undefined) simAporte.value = salvo.aporte;
if (salvo.taxa !== undefined) simTaxa.value = salvo.taxa;
if (salvo.anos !== undefined) simAnos.value = salvo.anos;

[campoRenda, simInicial, simAporte, simTaxa, simAnos].forEach(campo => {
  campo.addEventListener('input', () => {
    gravarLocal('renda', Number(campoRenda.value) || 0);
    gravarLocal('simulador', {
      inicial: simInicial.value, aporte: simAporte.value, taxa: simTaxa.value, anos: simAnos.value
    });
    renderInvestimentos();
  });
});

// média dos últimos 3 meses fechados; sem histórico, usa a previsão do mês atual
function gastoMedioMensal() {
  const meses = [1, 2, 3].map(n => mesAnterior(MES_ATUAL, n)).filter(m => doMes(m).length > 0);
  if (meses.length > 0) {
    return meses.reduce((s, m) => s + somar(doMes(m)), 0) / meses.length;
  }
  return (somar(doMes(MES_ATUAL)) / diasPassados(MES_ATUAL)) * diasNoMes(MES_ATUAL);
}

document.getElementById('usarSobra').addEventListener('click', () => {
  const sobra = (Number(campoRenda.value) || 0) - gastoMedioMensal();
  if (sobra <= 0) {
    campoRenda.focus();
    return;
  }
  simAporte.value = Math.floor(sobra / 10) * 10;
  simAporte.dispatchEvent(new Event('input'));
});

function renderInvestimentos() {
  const renda = Number(campoRenda.value) || 0;
  const gastoMedio = gastoMedioMensal();
  const sobra = renda - gastoMedio;

  const inicial = Number(simInicial.value) || 0;
  const aporte = Number(simAporte.value) || 0;
  const taxa = Number(simTaxa.value);
  const anos = Number(simAnos.value);

  // SEU ORÇAMENTO
  document.getElementById('gastoMedio').textContent = moeda.format(gastoMedio);
  const campoSobra = document.getElementById('sobra');
  const campoTaxa = document.getElementById('taxaPoupanca');
  const dicaOrcamento = document.getElementById('dicaOrcamento');

  if (renda > 0) {
    campoSobra.textContent = moeda.format(sobra);
    campoSobra.className = sobra < 0 ? 'negativo' : 'positivo';
    campoTaxa.textContent = porcentagem(Math.max(sobra, 0), renda);

    if (sobra < 0) {
      dicaOrcamento.textContent = `Você está gastando ${moeda.format(-sobra)} a mais do que ganha por mês. Veja em Estatísticas onde dá para cortar.`;
    } else if (sobra / renda < 0.2) {
      dicaOrcamento.textContent = `Para chegar nos 20% recomendados, a meta é guardar ${moeda.format(renda * 0.2)} por mês — faltam ${moeda.format(renda * 0.2 - sobra)}.`;
    } else {
      dicaOrcamento.textContent = 'Você já guarda 20% ou mais da renda. Agora é deixar esse dinheiro render!';
    }
  } else {
    campoSobra.textContent = '—';
    campoSobra.className = '';
    campoTaxa.textContent = '—';
    dicaOrcamento.textContent = 'Com a renda preenchida, calculamos quanto sobra para investir.';
  }

  // RESERVA DE EMERGÊNCIA
  const meta = gastoMedio * 6;
  document.getElementById('metaReserva').textContent = moeda.format(meta);
  const tempoReserva = document.getElementById('tempoReserva');

  if (meta === 0) {
    tempoReserva.textContent = 'Registre seus gastos para calcular a sua meta.';
  } else if (inicial >= meta) {
    tempoReserva.textContent = 'Seu valor inicial já cobre a reserva. 🎉';
  } else if (aporte <= 0) {
    tempoReserva.textContent = 'Defina um aporte por mês no simulador para ver em quanto tempo chega lá.';
  } else {
    const taxaMes = Math.pow(1 + taxa / 100, 1 / 12) - 1;
    let saldo = inicial;
    let meses = 0;
    while (saldo < meta && meses < 600) {
      saldo = saldo * (1 + taxaMes) + aporte;
      meses++;
    }
    const emAnos = meses >= 12 ? ` (cerca de ${(meses / 12).toFixed(1).replace('.', ',')} anos)` : '';
    tempoReserva.textContent = `Guardando ${moeda.format(aporte)} por mês a ${String(taxa).replace('.', ',')}% ao ano, você chega lá em ${meses} ${meses === 1 ? 'mês' : 'meses'}${emAnos}.`;
  }

  // SIMULADOR
  const porAno = simularInvestimento(inicial, aporte, taxa, anos);
  const final = porAno[porAno.length - 1];
  document.getElementById('saidaTaxa').textContent = `${String(taxa).replace('.', ',')}%`;
  document.getElementById('saidaAnos').textContent = anos === 1 ? '1 ano' : `${anos} anos`;
  document.getElementById('simInvestido').textContent = moedaInteira.format(final.investido);
  document.getElementById('simJuros').textContent = moedaInteira.format(final.total - final.investido);
  document.getElementById('simTotal').textContent = moedaInteira.format(final.total);

  const pulo = Math.ceil(porAno.length / 10);
  desenharBarras(document.getElementById('graficoInvest'), porAno.map((ano, i) => ({
    rotulo: `${i + 1}a`,
    mostrarRotulo: i === 0 || (i + 1) % pulo === 0,
    partes: [
      { valor: ano.investido, classe: 'barra fraca' },
      { valor: Math.max(ano.total - ano.investido, 0), classe: 'barra' }
    ],
    dica: `Ano ${i + 1}\nTotal: ${moedaInteira.format(ano.total)}\nInvestido: ${moedaInteira.format(ano.investido)}\nRendimento: ${moedaInteira.format(ano.total - ano.investido)}`
  })));

  // COMPARAÇÃO ENTRE OPÇÕES
  document.getElementById('subComparar').textContent =
    `${moeda.format(aporte)} por mês${inicial ? ` + ${moeda.format(inicial)} inicial` : ''}, durante ${anos === 1 ? '1 ano' : `${anos} anos`}`;

  const opcoes = [...OPCOES_INVESTIMENTO, { nome: 'Sua simulação', taxa, sua: true }]
    .map(o => {
      const resultado = simularInvestimento(inicial, aporte, o.taxa, anos);
      return { ...o, total: resultado[resultado.length - 1].total };
    })
    .sort((a, b) => b.total - a.total);
  const maiorTotal = Math.max(...opcoes.map(o => o.total), 1);

  document.getElementById('compararInvest').innerHTML = opcoes.map(o => `
    <li class="${o.sua ? 'sua' : ''}" data-dica="${o.nome} · ${String(o.taxa).replace('.', ',')}% ao ano\n${moedaInteira.format(o.total)}">
      <span class="comparar-nome">${o.nome} <small>${String(o.taxa).replace('.', ',')}% a.a.</small></span>
      <span class="comparar-trilho"><span style="width: ${(o.total / maiorTotal) * 100}%"></span></span>
      <strong>${moedaInteira.format(o.total)}</strong>
    </li>`).join('');

  // CUSTO DE OPORTUNIDADE (Lazer + Outros do mês atual)
  const desejos = somar(doMes(MES_ATUAL).filter(g => g.categoria.tipo === 'desejo'));
  const emDezAnos = simularInvestimento(0, desejos, taxa, 10);
  document.getElementById('custoOportunidade').textContent = moedaInteira.format(emDezAnos[9].total);
  document.getElementById('custoOportunidadeInfo').textContent = desejos > 0
    ? `Neste mês foram ${moeda.format(desejos)} em Lazer e Outros. Investindo esse valor todo mês por 10 anos a ${String(taxa).replace('.', ',')}% ao ano, ele viraria isso. Não é para cortar tudo — é para escolher com consciência.`
    : 'Nenhum gasto com Lazer ou Outros neste mês. Seu bolso agradece!';
}


/* ---------- ASSISTENTE DE IA ---------- */

// por enquanto o botão só avisa; aqui entra a chamada ao backend quando a IA estiver pronta
document.getElementById('botaoIA').addEventListener('click', () => {
  const resposta = document.getElementById('respostaIA');
  resposta.textContent = 'Em breve: a IA vai analisar seus gastos por aqui.';
  resposta.hidden = false;
});

/* ---------- COMEÇO ---------- */

mostrarTela();
carregarGastos();
