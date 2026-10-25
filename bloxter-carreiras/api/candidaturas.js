const { getSql, ensureSchema } = require('../lib/db');
const { isAdmin, setAdmin, clearAdmin, senhaConfere } = require('../lib/auth');
const { body, json, ip, limite, rota } = require('../lib/http');

// POST ?acao=entrar  { senha }   -> libera a página por 6 horas
// POST ?acao=sair                -> encerra
// GET                            -> blocos + lista (precisa estar liberado)
// GET  ?id=N                     -> uma candidatura completa (com imagem)
module.exports = rota(async (req, res) => {
  const acao = String((req.query && req.query.acao) || '');

  if (req.method === 'POST' && acao === 'entrar') {
    if (!limite('cand:' + ip(req), 6, 10 * 60 * 1000)) return json(res, 429, { erro: 'muitas_tentativas' });
    const b = body(req);
    if (!senhaConfere(String(b.senha || '').slice(0, 100))) return json(res, 401, { erro: 'senha' });
    setAdmin(res);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && acao === 'sair') {
    clearAdmin(res);
    return json(res, 200, { ok: true });
  }

  if (req.method !== 'GET') return json(res, 405, { erro: 'metodo' });
  if (!isAdmin(req)) return json(res, 401, { erro: 'nao_autorizado' });

  await ensureSchema();
  const s = getSql();

  const id = Number(req.query && req.query.id);
  if (id) {
    const rows = await s`SELECT id, created_at, nome, sobrenome, whatsapp, email, discord,
        to_char(nascimento, 'YYYY-MM-DD') AS nascimento, area, motivo, experiencia, experiencia_detalhe,
        atuou, atuou_quais, equipe, comunica, disponibilidade, estuda, ano, dispositivo, observacao, imagem
      FROM applications WHERE id = ${id} LIMIT 1`;
    if (!rows[0]) return json(res, 404, { erro: 'nao_encontrada' });
    return json(res, 200, { item: rows[0] });
  }

  const [tot, hoje, semana, porArea, itens] = await Promise.all([
    s`SELECT count(*)::int AS n FROM applications`,
    s`SELECT count(*)::int AS n FROM applications
        WHERE created_at >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')`,
    s`SELECT count(*)::int AS n FROM applications WHERE created_at >= now() - interval '7 days'`,
    s`SELECT area, count(*)::int AS n FROM applications GROUP BY area ORDER BY n DESC`,
    s`SELECT id, created_at, nome, sobrenome, area, whatsapp, email, discord, (imagem <> '') AS tem_imagem
        FROM applications ORDER BY id DESC LIMIT 1000`,
  ]);

  json(res, 200, {
    total: tot[0].n,
    hoje: hoje[0].n,
    semana: semana[0].n,
    topArea: porArea[0] ? { area: porArea[0].area, n: porArea[0].n } : null,
    porArea,
    itens,
  });
});
