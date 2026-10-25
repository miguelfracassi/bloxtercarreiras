const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const SESSAO = 'cr_sessao';
const ADMIN = 'cr_admin';
const SESSAO_IDADE = 60 * 60 * 24 * 14; // 14 dias
const ADMIN_IDADE = 60 * 60 * 6; // 6 horas

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET não configurada (mínimo 16 caracteres)');
  return s;
}

function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function flags() {
  return `Path=/; HttpOnly; SameSite=Strict; ${process.env.NODE_ENV === 'development' ? '' : 'Secure; '}`;
}

function setCookie(res, nome, valor, idade) {
  res.setHeader('Set-Cookie', `${nome}=${valor}; ${flags()}Max-Age=${idade}`);
}

function verificar(req, nome, campo) {
  const token = cookies(req)[nome];
  if (!token) return null;
  try { return jwt.verify(token, secret())[campo] || null; } catch { return null; }
}

const getUserId = (req) => verificar(req, SESSAO, 'uid');
const isAdmin = (req) => verificar(req, ADMIN, 'admin') === true;

function setSessao(res, uid) {
  setCookie(res, SESSAO, jwt.sign({ uid }, secret(), { expiresIn: SESSAO_IDADE }), SESSAO_IDADE);
}
const clearSessao = (res) => setCookie(res, SESSAO, '', 0);

function setAdmin(res) {
  setCookie(res, ADMIN, jwt.sign({ admin: true }, secret(), { expiresIn: ADMIN_IDADE }), ADMIN_IDADE);
}
const clearAdmin = (res) => setCookie(res, ADMIN, '', 0);

function senhaCandidaturas() {
  return String(process.env.CANDIDATURAS_SENHA || '2015');
}

// Compara sem vazar o tamanho/tempo da senha.
function senhaConfere(informada) {
  const a = crypto.createHash('sha256').update(String(informada || '')).digest();
  const b = crypto.createHash('sha256').update(senhaCandidaturas()).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = { getUserId, isAdmin, setSessao, clearSessao, setAdmin, clearAdmin, senhaConfere };
