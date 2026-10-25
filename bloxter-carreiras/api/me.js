const { getSql, ensureSchema } = require('../lib/db');
const { getUserId } = require('../lib/auth');
const { json, rota } = require('../lib/http');

module.exports = rota(async (req, res) => {
  let uid = null;
  try { uid = getUserId(req); } catch { uid = null; }
  if (!uid) return json(res, 200, { logado: false });
  await ensureSchema();
  const rows = await getSql()`SELECT email, nome FROM users WHERE id = ${uid} LIMIT 1`;
  if (!rows[0]) return json(res, 200, { logado: false });
  json(res, 200, { logado: true, email: rows[0].email, nome: rows[0].nome });
});
