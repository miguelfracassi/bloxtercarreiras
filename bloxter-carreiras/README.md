# Bloxter Carreiras

Site de recrutamento da Bloxter. Fundo branco, Poppins, botões arredondados (mesmo estilo do site principal).

## Páginas

| URL | O que é |
| --- | --- |
| `/` | Página inicial com texto de impacto, áreas e como funciona |
| `/inscricoes` | Termos + formulário em 6 sessões + revisão + envio |
| `/login` | Só login (e-mail e senha). **Não existe cadastro.** |
| `/painel` | Tela simples depois do login |
| `/candidaturas` | **Página secreta** (sem link em nenhum lugar, `noindex`). Pede a senha e mostra os blocos e a lista |

## Colocar no ar (Vercel + Neon)

1. Suba esta pasta para o GitHub e importe na Vercel.
2. Na Vercel: **Storage → Create → Neon** e conecte ao projeto (cria `DATABASE_URL`).
3. Em **Settings → Environment Variables** crie:
   - `JWT_SECRET`: qualquer texto aleatório com 16+ caracteres
   - `LOGIN_EMAIL` e `LOGIN_SENHA`: a conta que poderá fazer login
   - `CANDIDATURAS_SENHA`: senha da página `/candidaturas` (se não criar, usa `2015`)
4. Faça o deploy. As tabelas são criadas sozinhas na primeira requisição.
5. Teste em `/api/health` (mostra se o banco e as variáveis estão ok, sem expor senhas).

### Mais contas de login

```
DATABASE_URL="..." node scripts/criar-usuario.js email@exemplo.com "senha-forte" "Nome"
```

(rode `npm install` antes). Se o e-mail já existir, a senha é trocada.

## Página /candidaturas

- Só quem sabe o link e a senha entra. A sessão dura 6 horas.
- 4 blocos: **1** total de inscrições, **2** hoje, **3** últimos 7 dias, **4** área mais procurada.
- Abaixo: lista com filtro por área e busca. Clicar abre todas as respostas (e a imagem, se houver).
- O link não aparece no site e **não está no robots.txt** (de propósito, para não revelar a rota).

## Estrutura

```
api/            funções da Vercel (login, logout, me, inscrever, candidaturas, health)
lib/            banco (Neon), sessão (JWT em cookie HttpOnly), validação
public/         páginas estáticas, CSS e JS
scripts/        criar-usuario.js
test/run.js     testes da validação  (npm test)
```
