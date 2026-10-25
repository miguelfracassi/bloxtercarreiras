const AREAS = [
  'Marketing Design',
  'Suporte',
  'Bug Hunter',
  'Suporte Discord',
  'Verificador de Boas Práticas',
];
const TURNOS = ['manha', 'tarde', 'noite'];
const DISPOSITIVOS = ['Celular', 'Computador', 'Notebook', 'Celular e Notebook', 'Computador e Celular'];
const SIM_NAO = ['sim', 'nao'];
const TRI = ['sim', 'mais_ou_menos', 'nao'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMG_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const IMG_MAX = 1400000; // caracteres do data URL (~1 MB de imagem)

function txt(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function dataValida(s) {
  if (!DATA_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return false;
  const ano = Number(s.slice(0, 4));
  return ano >= 1900 && d.getTime() <= Date.now();
}

// Recebe o corpo cru e devolve { ok, erros, dados } com tudo limpo.
function validar(b) {
  const e = {};
  const d = {};
  b = b && typeof b === 'object' ? b : {};

  if (b.termos !== true) e.termos = 'Aceite os termos para continuar.';

  d.nome = txt(b.nome, 60);
  if (d.nome.length < 2) e.nome = 'Informe seu nome.';
  d.sobrenome = txt(b.sobrenome, 80);
  if (d.sobrenome.length < 2) e.sobrenome = 'Informe seu sobrenome.';

  d.whatsapp = String(b.whatsapp || '').replace(/\D/g, '');
  if (d.whatsapp.length < 10 || d.whatsapp.length > 13) e.whatsapp = 'Informe um WhatsApp válido com DDD.';

  d.email = txt(b.email, 160).toLowerCase();
  if (!EMAIL_RE.test(d.email)) e.email = 'Informe um e-mail válido.';

  d.discord = txt(b.discord, 60);
  if (d.discord.length < 2) e.discord = 'Informe seu Discord.';

  d.nascimento = txt(b.nascimento, 10);
  if (!dataValida(d.nascimento)) e.nascimento = 'Informe uma data de nascimento válida.';

  d.area = txt(b.area, 60);
  if (!AREAS.includes(d.area)) e.area = 'Escolha uma área.';

  d.motivo = txt(b.motivo, 2000);
  if (d.motivo.length < 10) e.motivo = 'Conte um pouco mais (mínimo 10 caracteres).';

  d.experiencia = txt(b.experiencia, 3);
  if (!SIM_NAO.includes(d.experiencia)) e.experiencia = 'Responda se tem experiência.';
  d.experiencia_detalhe = txt(b.experiencia_detalhe, 2000);

  d.atuou = txt(b.atuou, 3);
  if (!SIM_NAO.includes(d.atuou)) e.atuou = 'Responda se já atuou em alguma empresa.';
  d.atuou_quais = txt(b.atuou_quais, 1000);
  if (d.atuou === 'sim' && d.atuou_quais.length < 2) e.atuou_quais = 'Diga quais empresas.';
  if (d.atuou !== 'sim') d.atuou_quais = '';

  d.equipe = txt(b.equipe, 14);
  if (!TRI.includes(d.equipe)) e.equipe = 'Responda sobre trabalhar em equipe.';
  d.comunica = txt(b.comunica, 14);
  if (!TRI.includes(d.comunica)) e.comunica = 'Responda sobre se comunicar.';

  const disp = {};
  const bd = b.disponibilidade && typeof b.disponibilidade === 'object' ? b.disponibilidade : {};
  for (const t of TURNOS) {
    const x = bd[t];
    if (x && x.ativo === true) {
      const de = txt(x.de, 5);
      const ate = txt(x.ate, 5);
      if (!HORA_RE.test(de) || !HORA_RE.test(ate)) {
        e.disponibilidade = 'Informe o horário de cada turno marcado.';
      } else {
        disp[t] = { de, ate };
      }
    }
  }
  if (!e.disponibilidade && Object.keys(disp).length === 0) e.disponibilidade = 'Marque pelo menos um turno.';
  d.disponibilidade = disp;

  d.estuda = txt(b.estuda, 3);
  if (!SIM_NAO.includes(d.estuda)) e.estuda = 'Responda se você estuda.';
  d.ano = txt(b.ano, 60);
  if (d.estuda === 'sim' && d.ano.length < 1) e.ano = 'Informe em qual ano você está.';
  if (d.estuda !== 'sim') d.ano = '';

  d.dispositivo = txt(b.dispositivo, 40);
  if (!DISPOSITIVOS.includes(d.dispositivo)) e.dispositivo = 'Escolha um dispositivo.';

  d.observacao = txt(b.observacao, 2000);

  d.imagem = '';
  if (typeof b.imagem === 'string' && b.imagem) {
    if (b.imagem.length > IMG_MAX || !IMG_RE.test(b.imagem)) e.imagem = 'Imagem inválida ou muito grande.';
    else d.imagem = b.imagem;
  }

  return { ok: Object.keys(e).length === 0, erros: e, dados: d };
}

module.exports = { validar, AREAS, TURNOS, DISPOSITIVOS };
