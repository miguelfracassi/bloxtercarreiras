const { clearSessao } = require('../lib/auth');
const { json, rota } = require('../lib/http');

module.exports = rota(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });
  clearSessao(res);
  json(res, 200, { ok: true });
});
