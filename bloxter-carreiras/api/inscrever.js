const { getSql, ensureSchema } = require('../lib/db');
const { validar } = require('../lib/validar');
const { body, json, ip, limite, rota } = require('../lib/http');

module.exports = rota(async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });
  if (!limite('inscrever:' + ip(req), 5, 60 * 60 * 1000)) return json(res, 429, { erro: 'muitas_tentativas' });

  const b = body(req);
  // Campo-armadilha: pessoas não veem, robôs preenchem. Finge sucesso e não salva.
  if (b && typeof b.site === 'string' && b.site.trim()) return json(res, 200, { ok: true });

  const v = validar(b);
  if (!v.ok) return json(res, 400, { erro: 'validacao', campos: v.erros });

  const d = v.dados;
  await ensureSchema();
  const s = getSql();
  await s`INSERT INTO applications (
      nome, sobrenome, whatsapp, email, discord, nascimento, area,
      motivo, experiencia, experiencia_detalhe, atuou, atuou_quais,
      equipe, comunica, disponibilidade, estuda, ano, dispositivo, observacao, imagem
    ) VALUES (
      ${d.nome}, ${d.sobrenome}, ${d.whatsapp}, ${d.email}, ${d.discord}, ${d.nascimento}, ${d.area},
      ${d.motivo}, ${d.experiencia}, ${d.experiencia_detalhe}, ${d.atuou}, ${d.atuou_quais},
      ${d.equipe}, ${d.comunica}, ${JSON.stringify(d.disponibilidade)}::jsonb, ${d.estuda}, ${d.ano},
      ${d.dispositivo}, ${d.observacao}, ${d.imagem}
    )`;
  json(res, 200, { ok: true });
});
