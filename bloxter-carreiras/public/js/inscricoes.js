(function () {
  var TOTAL = 6;
  var step = 0;
  var imagem = '';
  var enviando = false;

  var secoes = $$('.passo-form');
  var progresso = $('#progresso');

  var PASSO_DO_CAMPO = {
    termos: 0,
    nome: 1, sobrenome: 1, whatsapp: 1, email: 1, discord: 1, nascimento: 1, area: 1,
    motivo: 2, experiencia: 2, experiencia_detalhe: 2, atuou: 2, atuou_quais: 2,
    equipe: 3, comunica: 3,
    disponibilidade: 4, estuda: 4, ano: 4,
    dispositivo: 5,
    observacao: 6, imagem: 6
  };

  var ROTULO_TURNO = { manha: 'Turno da Manhã', tarde: 'Turno da Tarde', noite: 'Turno da Noite' };
  var ROTULO_SN = { sim: 'Sim', nao: 'Não', mais_ou_menos: 'Mais ou menos' };

  /* ---------- utilidades ---------- */
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function radio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function campo(nome) {
    if (nome === 'termos') return $('#c-termos');
    return document.querySelector('.campo[data-f="' + nome + '"]');
  }
  function erro(nome, msg) {
    var c = campo(nome);
    if (!c) return;
    c.classList.add('erro');
    var m = c.querySelector('.msg');
    if (m) m.textContent = msg;
  }
  function limpar(nome) {
    var c = campo(nome);
    if (c) c.classList.remove('erro');
  }
  function limparTudo() {
    $$('.campo.erro').forEach(function (c) { c.classList.remove('erro'); });
    $('#erro-geral').textContent = '';
  }
  function dataBr(s) {
    var p = String(s || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  }
  function dataValida(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + 'T00:00:00Z');
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return false;
    return Number(s.slice(0, 4)) >= 1900 && d.getTime() <= Date.now();
  }

  /* ---------- navegação ---------- */
  function ir(n) {
    step = n;
    secoes.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== n; });
    progresso.hidden = n === 0;
    if (n > 0) {
      $('#p-txt').textContent = 'Sessão ' + n + ' de ' + TOTAL;
      $('#p-barra').style.width = Math.round((n / TOTAL) * 100) + '%';
      var area = radio('area');
      $('#p-area').textContent = area || '';
    }
    if (n === 2) atualizarArea();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function atualizarArea() {
    var a = radio('area') || 'sua área';
    $$('.area-nome').forEach(function (el) { el.textContent = a; });
  }

  /* ---------- validação por sessão ---------- */
  function validarPasso(n) {
    var ok = true;
    function falha(nome, msg) { erro(nome, msg); ok = false; }

    if (n === 0) {
      if (!$('#termos').checked) falha('termos', 'Aceite os termos para continuar.');
    }
    if (n === 1) {
      if (val('nome').length < 2) falha('nome', 'Informe seu nome.');
      if (val('sobrenome').length < 2) falha('sobrenome', 'Informe seu sobrenome.');
      var zap = val('whatsapp').replace(/\D/g, '');
      if (zap.length < 10 || zap.length > 13) falha('whatsapp', 'Informe um WhatsApp válido com DDD.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) falha('email', 'Informe um e-mail válido.');
      if (val('discord').length < 2) falha('discord', 'Informe seu Discord.');
      if (!dataValida(val('nascimento'))) falha('nascimento', 'Informe uma data de nascimento válida.');
      if (!radio('area')) falha('area', 'Escolha uma área.');
    }
    if (n === 2) {
      if (val('motivo').length < 10) falha('motivo', 'Conte um pouco mais (mínimo 10 caracteres).');
      if (!radio('experiencia')) falha('experiencia', 'Escolha uma opção.');
      if (!radio('atuou')) falha('atuou', 'Escolha uma opção.');
      else if (radio('atuou') === 'sim' && val('atuou_quais').length < 2) falha('atuou_quais', 'Diga quais empresas.');
    }
    if (n === 3) {
      if (!radio('equipe')) falha('equipe', 'Escolha uma opção.');
      if (!radio('comunica')) falha('comunica', 'Escolha uma opção.');
    }
    if (n === 4) {
      var disp = coletarDisponibilidade();
      var marcados = Object.keys(disp.ativos);
      if (!marcados.length) falha('disponibilidade', 'Marque pelo menos um turno.');
      else if (disp.incompleto) falha('disponibilidade', 'Informe o horário de cada turno marcado.');
      if (!radio('estuda')) falha('estuda', 'Escolha uma opção.');
      else if (radio('estuda') === 'sim' && !val('ano')) falha('ano', 'Informe em qual ano você está.');
    }
    if (n === 5) {
      if (!radio('dispositivo')) falha('dispositivo', 'Escolha um dispositivo.');
    }
    return ok;
  }

  function primeiroErro() {
    var c = document.querySelector('.passo-form:not([hidden]) .campo.erro');
    if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- coleta ---------- */
  function coletarDisponibilidade() {
    var ativos = {};
    var incompleto = false;
    $$('.turno').forEach(function (t) {
      var chk = t.querySelector('input[type=checkbox]');
      if (!chk.checked) return;
      var de = t.querySelector('[data-de]').value;
      var ate = t.querySelector('[data-ate]').value;
      if (!de || !ate) incompleto = true;
      ativos[t.getAttribute('data-turno')] = { ativo: true, de: de, ate: ate };
    });
    return { ativos: ativos, incompleto: incompleto };
  }

  function coletar() {
    var estuda = radio('estuda');
    var atuou = radio('atuou');
    return {
      termos: $('#termos').checked,
      site: val('site'),
      nome: val('nome'),
      sobrenome: val('sobrenome'),
      whatsapp: val('whatsapp'),
      email: val('email'),
      discord: val('discord'),
      nascimento: val('nascimento'),
      area: radio('area'),
      motivo: val('motivo'),
      experiencia: radio('experiencia'),
      experiencia_detalhe: radio('experiencia') === 'sim' ? val('experiencia_detalhe') : '',
      atuou: atuou,
      atuou_quais: atuou === 'sim' ? val('atuou_quais') : '',
      equipe: radio('equipe'),
      comunica: radio('comunica'),
      disponibilidade: coletarDisponibilidade().ativos,
      estuda: estuda,
      ano: estuda === 'sim' ? val('ano') : '',
      dispositivo: radio('dispositivo'),
      observacao: val('observacao'),
      imagem: imagem
    };
  }

  /* ---------- resumo ---------- */
  function linha(rot, valor) {
    return '<div class="resp"><dt>' + esc(rot) + '</dt><dd>' + valor + '</dd></div>';
  }
  function textoOuVazio(v) { return v ? esc(v) : '<span style="color:var(--fg2)">Não informado</span>'; }

  function montarResumo(d) {
    var a = d.area;
    var h = '';
    h += '<div class="sec-tit">Sessão 1 · Seus dados</div>';
    h += linha('Nome', esc(d.nome + ' ' + d.sobrenome));
    h += linha('WhatsApp', esc(d.whatsapp));
    h += linha('E-mail', esc(d.email));
    h += linha('Discord', esc(d.discord));
    h += linha('Data de nascimento', esc(dataBr(d.nascimento)));
    h += linha('Área que quer atuar', esc(a));

    h += '<div class="sec-tit">Sessão 2 · Sobre você e a área</div>';
    h += linha('Por que você acha que deve entrar na área de ' + a + '?', esc(d.motivo));
    h += linha('Você tem experiência com a área de ' + a + '?', esc(ROTULO_SN[d.experiencia]) + (d.experiencia_detalhe ? '<br>' + esc(d.experiencia_detalhe) : ''));
    h += linha('Você atuou em alguma empresa nessa área ou outra semelhante?', esc(ROTULO_SN[d.atuou]) + (d.atuou_quais ? '<br>' + esc(d.atuou_quais) : ''));

    h += '<div class="sec-tit">Sessão 3 · Equipe</div>';
    h += linha('Facilidade em trabalhar com equipe', esc(ROTULO_SN[d.equipe]));
    h += linha('Gosta de se comunicar', esc(ROTULO_SN[d.comunica]));

    h += '<div class="sec-tit">Sessão 4 · Disponibilidade</div>';
    var turnos = Object.keys(d.disponibilidade).map(function (t) {
      return esc(ROTULO_TURNO[t]) + ': ' + esc(d.disponibilidade[t].de) + ' às ' + esc(d.disponibilidade[t].ate);
    }).join('<br>');
    h += linha('Disponibilidade', turnos);
    h += linha('Você estuda?', esc(ROTULO_SN[d.estuda]) + (d.ano ? '<br>' + esc(d.ano) : ''));

    h += '<div class="sec-tit">Sessão 5 · Dispositivo</div>';
    h += linha('Dispositivo', esc(d.dispositivo));

    h += '<div class="sec-tit">Sessão 6 · Detalhes</div>';
    h += linha('Observação', textoOuVazio(d.observacao));
    h += linha('Imagem', d.imagem ? '<img src="' + d.imagem + '" alt="Imagem anexada" />' : textoOuVazio(''));
    return h;
  }

  /* ---------- imagem ---------- */
  function comprimir(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () {
        URL.revokeObjectURL(url);
        var lado = 1280;
        var q = 0.82;
        for (var tentativa = 0; tentativa < 6; tentativa++) {
          var esc1 = Math.min(1, lado / Math.max(im.width, im.height));
          var w = Math.max(1, Math.round(im.width * esc1));
          var h = Math.max(1, Math.round(im.height * esc1));
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          var cx = cv.getContext('2d');
          cx.fillStyle = '#fff';
          cx.fillRect(0, 0, w, h);
          cx.drawImage(im, 0, 0, w, h);
          var out = cv.toDataURL('image/jpeg', q);
          if (out.length <= 1100000) return resolve(out);
          q = Math.max(0.5, q - 0.1);
          lado = Math.round(lado * 0.8);
        }
        reject(new Error('grande'));
      };
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('invalida')); };
      im.src = url;
    });
  }

  function removerImagem() {
    imagem = '';
    $('#img').value = '';
    $('#previa').hidden = true;
    $('#arquivo-txt').textContent = 'Escolher uma imagem (JPG, PNG ou WebP)';
    limpar('imagem');
  }

  /* ---------- eventos ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-next]');
    if (t) {
      limparTudo();
      if (validarPasso(step)) ir(step + 1); else primeiroErro();
      return;
    }
    if (ev.target.closest('[data-prev]')) { limparTudo(); ir(Math.max(0, step - 1)); }
  });

  $('#form').addEventListener('submit', function (ev) { ev.preventDefault(); });
  $('#form').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && ev.target.type !== 'checkbox') ev.preventDefault();
  });

  // limpar erro ao mexer
  $('#form').addEventListener('input', function (ev) {
    var c = ev.target.closest('.campo');
    if (c) c.classList.remove('erro');
  });
  $('#form').addEventListener('change', function (ev) {
    var c = ev.target.closest('.campo');
    if (c) c.classList.remove('erro');
    var n = ev.target.name;
    if (n === 'experiencia') $('#g-exp').hidden = radio('experiencia') !== 'sim';
    if (n === 'atuou') $('#g-atuou').hidden = radio('atuou') !== 'sim';
    if (n === 'estuda') $('#g-ano').hidden = radio('estuda') !== 'sim';
    if (n === 'area') atualizarArea();
    var turno = ev.target.closest('.turno');
    if (turno && ev.target.type === 'checkbox') turno.classList.toggle('on', ev.target.checked);
  });

  // máscara simples do WhatsApp
  $('#whatsapp').addEventListener('input', function (ev) {
    var d = ev.target.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    ev.target.value = out;
  });

  $('#img').addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0];
    limpar('imagem');
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { removerImagem(); erro('imagem', 'Use uma imagem JPG, PNG ou WebP.'); return; }
    if (f.size > 15 * 1024 * 1024) { removerImagem(); erro('imagem', 'A imagem é muito grande (máximo 15 MB).'); return; }
    $('#arquivo-txt').textContent = 'Processando imagem...';
    comprimir(f).then(function (data) {
      imagem = data;
      $('#previa-img').src = data;
      $('#previa').hidden = false;
      $('#arquivo-txt').textContent = f.name;
    }).catch(function () {
      removerImagem();
      erro('imagem', 'Não foi possível usar essa imagem. Tente outra.');
    });
  });
  $('#img-x').addEventListener('click', removerImagem);

  // Enviar -> valida tudo -> abre a confirmação
  $('#enviar').addEventListener('click', function () {
    limparTudo();
    for (var n = 0; n <= 5; n++) {
      if (!validarPasso(n)) { ir(n); setTimeout(primeiroErro, 80); return; }
    }
    $('#resumo').innerHTML = montarResumo(coletar());
    abrirModal(true);
  });

  function abrirModal(abrir) {
    $('#confirma').hidden = !abrir;
    document.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) $('#conf-enviar').focus();
  }
  $('#conf-voltar').addEventListener('click', function () { abrirModal(false); });
  $('#confirma').addEventListener('click', function (ev) { if (ev.target === ev.currentTarget && !enviando) abrirModal(false); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !$('#confirma').hidden && !enviando) abrirModal(false); });

  $('#conf-enviar').addEventListener('click', function () {
    if (enviando) return;
    enviando = true;
    var btn = $('#conf-enviar');
    btn.disabled = true; btn.textContent = 'Enviando...';
    api('/api/inscrever', { method: 'POST', body: coletar() })
      .then(function () {
        abrirModal(false);
        $('#form').hidden = true;
        progresso.hidden = true;
        $('#sucesso').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (e) {
        abrirModal(false);
        var campos = e.data && e.data.campos;
        if (e.status === 400 && campos) {
          var menor = 99;
          Object.keys(campos).forEach(function (k) {
            erro(k, campos[k]);
            if (PASSO_DO_CAMPO[k] != null) menor = Math.min(menor, PASSO_DO_CAMPO[k]);
          });
          ir(menor === 99 ? 6 : menor);
          setTimeout(primeiroErro, 80);
          $('#erro-geral').textContent = 'Corrija os campos marcados e envie novamente.';
        } else if (e.status === 429) {
          ir(6);
          $('#erro-geral').textContent = 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.';
        } else {
          ir(6);
          $('#erro-geral').textContent = 'Não foi possível enviar agora. Suas respostas continuam aqui, tente novamente.';
        }
      })
      .finally(function () {
        enviando = false;
        btn.disabled = false; btn.textContent = 'Sim, enviar';
      });
  });

  ir(0);
})();
