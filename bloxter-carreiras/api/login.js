const bcrypt = require('bcryptjs');
const { getSql, ensureSchema } = require('../lib/db');
const { setSessao } = require('../lib/auth');
const { body, json, ip, limite, rota } = require('../lib/http');

// Hash de mentira, só para o tempo de resposta ser parecido quando o e-mail não existe.
const FALSO = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.kX5xX3x3m8eQ0n4a2m9mWmZk0m2K';

module.exports = rota(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });
  if (!limite('login:' + ip(req), 8, 10 * 60 * 1000)) return json(res, 429, { erro: 'muitas_tentativas' });

  const b = body(req);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 160);
  const senha = String(b.senha || '').slice(0, 200);
  if (!email || !senha) return json(res, 400, { erro: 'dados' });

  await ensureSchema();
  const s = getSql();
  const rows = await s`SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1`;
  const u = rows[0];
  const ok = await bcrypt.compare(senha, u ? u.password_hash : FALSO);
  if (!u || !ok) return json(res, 401, { erro: 'credenciais' });

  setSessao(res, u.id);
  json(res, 200, { ok: true });
});
