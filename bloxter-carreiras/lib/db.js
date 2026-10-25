const { neon } = require('@neondatabase/serverless');

let sql;
function getSql() {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não configurada');
    sql = neon(url);
  }
  return sql;
}

let schemaPromise = null;

async function createAll() {
  const s = getSql();
  await s`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await s`CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nome TEXT NOT NULL,
    sobrenome TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    discord TEXT NOT NULL,
    nascimento DATE NOT NULL,
    area TEXT NOT NULL,
    motivo TEXT NOT NULL,
    experiencia TEXT NOT NULL,
    experiencia_detalhe TEXT NOT NULL DEFAULT '',
    atuou TEXT NOT NULL,
    atuou_quais TEXT NOT NULL DEFAULT '',
    equipe TEXT NOT NULL,
    comunica TEXT NOT NULL,
    disponibilidade JSONB NOT NULL DEFAULT '{}'::jsonb,
    estuda TEXT NOT NULL,
    ano TEXT NOT NULL DEFAULT '',
    dispositivo TEXT NOT NULL,
    observacao TEXT NOT NULL DEFAULT '',
    imagem TEXT NOT NULL DEFAULT ''
  )`;
  await s`CREATE INDEX IF NOT EXISTS applications_created_idx ON applications (created_at DESC, id DESC)`;

  // Conta de login criada pelas variáveis de ambiente (não existe cadastro no site).
  const email = String(process.env.LOGIN_EMAIL || '').trim().toLowerCase();
  const senha = String(process.env.LOGIN_SENHA || '');
  if (email && senha) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(senha, 10);
    await s`INSERT INTO users (email, nome, password_hash) VALUES (${email}, ${email.split('@')[0]}, ${hash})
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`;
  }
}

// Várias requisições podem chegar juntas na primeira vez; usamos uma promessa única
// por instância e tentamos de novo se o Postgres reclamar de conflito.
function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      let last;
      for (let i = 0; i < 4; i++) {
        try { await createAll(); return; } catch (e) {
          last = e;
          if (/DATABASE_URL/.test(String(e && e.message))) throw e;
          await new Promise((r) => setTimeout(r, 200 * (i + 1)));
        }
      }
      throw last;
    })().catch((e) => { schemaPromise = null; throw e; });
  }
  return schemaPromise;
}

module.exports = { getSql, ensureSchema };
