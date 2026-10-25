// Diagnóstico: abra /api/health no navegador. Nunca mostra senhas.
const scrub = (e) =>
  String((e && e.message) || e).replace(/postgres(ql)?:\/\/\S+/gi, '[url]').slice(0, 300);

module.exports = async (req, res) => {
  const out = {
    ok: true,
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: (process.env.JWT_SECRET || '').length >= 16,
      LOGIN_EMAIL: !!process.env.LOGIN_EMAIL,
      LOGIN_SENHA: !!process.env.LOGIN_SENHA,
    },
    db: {},
  };
  if (!out.env.DATABASE_URL || !out.env.JWT_SECRET) out.ok = false;
  if (out.env.DATABASE_URL) {
    try {
      const { getSql, ensureSchema } = require('../lib/db');
      await getSql()`SELECT 1`;
      await ensureSchema();
      const r = await getSql()`SELECT (SELECT count(*)::int FROM applications) AS inscricoes, (SELECT count(*)::int FROM users) AS contas`;
      out.db = { conexao: 'ok', ...r[0] };
    } catch (e) {
      out.ok = false;
      out.db.erro = scrub(e);
    }
  }
  res.status(200).json(out);
};
