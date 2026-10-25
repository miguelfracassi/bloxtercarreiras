// Uso: DATABASE_URL="..." node scripts/criar-usuario.js email@exemplo.com "senha-forte" [Nome]
// Cria (ou troca a senha de) uma conta de login. O site não tem cadastro.
const bcrypt = require('bcryptjs');
const { getSql, ensureSchema } = require('../lib/db');

(async () => {
  const [email, senha, nome] = process.argv.slice(2);
  if (!email || !senha) {
    console.log('Uso: node scripts/criar-usuario.js email senha [nome]');
    process.exit(1);
  }
  await ensureSchema();
  const hash = await bcrypt.hash(senha, 10);
  const e = email.trim().toLowerCase();
  await getSql()`INSERT INTO users (email, nome, password_hash) VALUES (${e}, ${nome || e.split('@')[0]}, ${hash})
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`;
  console.log('Conta pronta:', e);
})().catch((err) => { console.error(err.message); process.exit(1); });
