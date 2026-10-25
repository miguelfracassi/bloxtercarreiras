const assert = require('node:assert');
const { validar } = require('../lib/validar');

const base = () => ({
  termos: true, nome: 'Ana', sobrenome: 'Silva', whatsapp: '(11) 91234-5678', email: 'ANA@x.com', discord: 'ana#0001',
  nascimento: '2005-04-10', area: 'Bug Hunter', motivo: 'Gosto de encontrar falhas.',
  experiencia: 'nao', atuou: 'nao', equipe: 'sim', comunica: 'mais_ou_menos',
  disponibilidade: { manha: { ativo: true, de: '08:00', ate: '12:00' }, tarde: { ativo: false } },
  estuda: 'sim', ano: '3º ano', dispositivo: 'Celular',
});

let r = validar(base());
assert.ok(r.ok, JSON.stringify(r.erros));
assert.strictEqual(r.dados.whatsapp, '11912345678');
assert.strictEqual(r.dados.email, 'ana@x.com');
assert.deepStrictEqual(Object.keys(r.dados.disponibilidade), ['manha']);

let b = base(); b.termos = false; assert.ok(validar(b).erros.termos);
b = base(); b.area = 'Outra'; assert.ok(validar(b).erros.area);
b = base(); b.nascimento = '2999-01-01'; assert.ok(validar(b).erros.nascimento);
b = base(); b.nascimento = '2005-02-31'; assert.ok(validar(b).erros.nascimento);
b = base(); b.atuou = 'sim'; assert.ok(validar(b).erros.atuou_quais);
b = base(); b.estuda = 'sim'; b.ano = ''; assert.ok(validar(b).erros.ano);
b = base(); b.estuda = 'nao'; b.ano = 'x'; assert.strictEqual(validar(b).dados.ano, '');
b = base(); b.disponibilidade = {}; assert.ok(validar(b).erros.disponibilidade);
b = base(); b.disponibilidade = { noite: { ativo: true, de: '25:00', ate: '10:00' } }; assert.ok(validar(b).erros.disponibilidade);
b = base(); b.imagem = 'data:text/html;base64,AAAA'; assert.ok(validar(b).erros.imagem);
b = base(); b.imagem = 'data:image/jpeg;base64,/9j/AAAA'; assert.ok(validar(b).ok);
b = base(); b.whatsapp = '123'; assert.ok(validar(b).erros.whatsapp);
assert.ok(!validar(null).ok);
console.log('validação: tudo certo');
