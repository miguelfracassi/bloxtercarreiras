function body(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch { return {}; } }
  return b;
}

function json(res, status, data) {
  res.status(status).json(data);
}

function ip(req) {
  const f = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return f || (req.socket && req.socket.remoteAddress) || 'x';
}

// Limite simples por instância (freia tentativas em massa; não substitui um WAF).
const baldes = new Map();
function limite(chave, max, janelaMs) {
  const agora = Date.now();
  const b = (baldes.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (b.length >= max) { baldes.set(chave, b); return false; }
  b.push(agora);
  baldes.set(chave, b);
  if (baldes.size > 5000) baldes.clear();
  return true;
}

// Envolve um handler: erros viram JSON limpo (sem vazar detalhes).
function rota(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      const msg = String((e && e.message) || e);
      console.error('[api]', req.url, msg);
      if (/DATABASE_URL|JWT_SECRET/.test(msg)) return json(res, 500, { erro: 'config', detalhe: msg });
      json(res, 500, { erro: 'interno' });
    }
  };
}

module.exports = { body, json, ip, limite, rota };
