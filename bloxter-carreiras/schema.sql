-- Referência. As tabelas são criadas sozinhas na primeira requisição.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
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
);
CREATE INDEX IF NOT EXISTS applications_created_idx ON applications (created_at DESC, id DESC);
