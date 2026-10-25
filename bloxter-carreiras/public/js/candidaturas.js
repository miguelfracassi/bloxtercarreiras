(function () {
  var AREAS = ['Marketing Design', 'Suporte', 'Bug Hunter', 'Suporte Discord', 'Verificador de Boas Práticas'];
  var ROTULO_SN = { sim: 'Sim', nao: 'Não', mais_ou_menos: 'Mais ou menos' };
  var ROTULO_TURNO = { manha: 'Turno da Manhã', tarde: 'Turno da Tarde', noite: 'Turno da Noite' };

  var itens = [];
  var filtroArea = '';
  var termo = '';

  var porta = $('#porta'), painel = $('#painel'), sair = $('#sair');

  function mostrar(logado) {
    porta.hidden = logado;
    painel.hidden = !logado;
    sair.hidden = !logado;
    if (!logado) $('#senha').focus();
  }

  function dataHora(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  }
  function dataBr(s) {
    var p = String(s || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  }

  /* ---------- carregar ---------- */
  function carregar() {
    return api('/api/candidaturas').then(function (d) {
      mostrar(true);
      $('#b1').textContent = d.total;
      $('#b2').textContent = d.hoje;
      $('#b3').textContent = d.semana;
      $('#b4').innerHTML = d.topArea
        ? esc(d.topArea.area) + '<div style="font-size:13px;font-weight:400;opacity:.65;margin-top:6px;letter-spacing:0">' + d.topArea.n + ' inscrição' + (d.topArea.n === 1 ? '' : 'ões') + '</div>'
        : '—';
      itens = d.itens || [];
      var contagem = {};
      (d.porArea || []).forEach(function (a) { contagem[a.area] = a.n; });
      montarChips(contagem, d.total);
      desenhar();
      $('#atualizado').textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    });
  }

  function montarChips(contagem, total) {
    var h = '<button type="button" class="chip' + (filtroArea === '' ? ' on' : '') + '" data-area="">Todas (' + total + ')</button>';
    AREAS.forEach(function (a) {
      h += '<button type="button" class="chip' + (filtroArea === a ? ' on' : '') + '" data-area="' + esc(a) + '">' + esc(a) + ' (' + (contagem[a] || 0) + ')</button>';
    });
    $('#chips').innerHTML = h;
  }

  function desenhar() {
    var t = termo.toLowerCase();
    var lista = itens.filter(function (i) {
      if (filtroArea && i.area !== filtroArea) return false;
      if (!t) return true;
      return (i.nome + ' ' + i.sobrenome + ' ' + i.email + ' ' + i.discord + ' ' + i.whatsapp).toLowerCase().indexOf(t) > -1;
    });
    if (!lista.length) {
      $('#lista').innerHTML = '<div class="vazio">' + (itens.length ? 'Nenhuma candidatura com esse filtro.' : 'Nenhuma candidatura ainda.') + '</div>';
      return;
    }
    $('#lista').innerHTML = lista.map(function (i) {
      return '<button type="button" class="linha-c" data-id="' + Number(i.id) + '">' +
        '<span><b>' + esc(i.nome + ' ' + i.sobrenome) + '</b><small>' + esc(i.email) + '</small></span>' +
        '<span class="hide-m"><small>WhatsApp</small><br>' + esc(i.whatsapp) + '</span>' +
        '<span class="hide-m"><small>' + esc(dataHora(i.created_at)) + '</small></span>' +
        '<span class="pill">' + esc(i.area) + '</span></button>';
    }).join('');
  }

  /* ---------- detalhe ---------- */
  function linha(rot, v) { return '<div class="resp"><dt>' + esc(rot) + '</dt><dd>' + v + '</dd></div>'; }
  function vazio(v) { return v ? esc(v) : '<span style="color:var(--fg2)">Não informado</span>'; }

  function abrirDetalhe(id) {
    api('/api/candidaturas?id=' + encodeURIComponent(id)).then(function (r) {
      var c = r.item;
      $('#d-tit').textContent = c.nome + ' ' + c.sobrenome;
      $('#d-sub').textContent = c.area + ' · enviada em ' + dataHora(c.created_at);
      var disp = c.disponibilidade || {};
      var turnos = Object.keys(disp).map(function (t) {
        return esc(ROTULO_TURNO[t] || t) + ': ' + esc(disp[t].de) + ' às ' + esc(disp[t].ate);
      }).join('<br>');
      var h = '';
      h += '<div class="sec-tit">Sessão 1 · Dados</div>';
      h += linha('WhatsApp', '<a href="https://wa.me/' + encodeURIComponent((String(c.whatsapp).length <= 11 ? '55' : '') + c.whatsapp) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">' + esc(c.whatsapp) + '</a>');
      h += linha('E-mail', esc(c.email));
      h += linha('Discord', esc(c.discord));
      h += linha('Data de nascimento', esc(dataBr(c.nascimento)));
      h += linha('Área', esc(c.area));
      h += '<div class="sec-tit">Sessão 2 · Sobre a área</div>';
      h += linha('Por que deve entrar na área de ' + c.area + '?', esc(c.motivo));
      h += linha('Experiência com a área', esc(ROTULO_SN[c.experiencia] || c.experiencia) + (c.experiencia_detalhe ? '<br>' + esc(c.experiencia_detalhe) : ''));
      h += linha('Atuou em empresa nessa área ou semelhante', esc(ROTULO_SN[c.atuou] || c.atuou) + (c.atuou_quais ? '<br>' + esc(c.atuou_quais) : ''));
      h += '<div class="sec-tit">Sessão 3 · Equipe</div>';
      h += linha('Facilidade com equipe', esc(ROTULO_SN[c.equipe] || c.equipe));
      h += linha('Gosta de se comunicar', esc(ROTULO_SN[c.comunica] || c.comunica));
      h += '<div class="sec-tit">Sessão 4 · Disponibilidade</div>';
      h += linha('Turnos', turnos || vazio(''));
      h += linha('Estuda', esc(ROTULO_SN[c.estuda] || c.estuda) + (c.ano ? '<br>' + esc(c.ano) : ''));
      h += '<div class="sec-tit">Sessão 5 · Dispositivo</div>';
      h += linha('Dispositivo', esc(c.dispositivo));
      h += '<div class="sec-tit">Sessão 6 · Detalhes</div>';
      h += linha('Observação', vazio(c.observacao));
      var okImg = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(c.imagem || '');
      h += linha('Imagem', okImg ? '<img src="' + c.imagem + '" alt="Imagem enviada" />' : vazio(''));
      $('#d-corpo').innerHTML = h;
      $('#detalhe').hidden = false;
      document.body.style.overflow = 'hidden';
      $('#d-fechar').focus();
    }).catch(function (e) {
      if (e.status === 401) mostrar(false);
    });
  }
  function fecharDetalhe() { $('#detalhe').hidden = true; document.body.style.overflow = ''; }

  /* ---------- eventos ---------- */
  $('#f-senha').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var erro = $('#erro'), btn = $('#entrar');
    erro.textContent = '';
    var senha = $('#senha').value;
    if (!senha) { erro.textContent = 'Digite a senha.'; return; }
    btn.disabled = true; btn.textContent = 'Entrando...';
    api('/api/candidaturas?acao=entrar', { method: 'POST', body: { senha: senha } })
      .then(function () { $('#senha').value = ''; return carregar(); })
      .catch(function (e) {
        erro.textContent = e.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.'
          : e.status === 401 ? 'Senha incorreta.' : 'Não foi possível entrar agora.';
      })
      .finally(function () { btn.disabled = false; btn.textContent = 'Entrar'; });
  });

  sair.addEventListener('click', function () {
    api('/api/candidaturas?acao=sair', { method: 'POST' }).finally(function () { itens = []; mostrar(false); });
  });
  $('#recarregar').addEventListener('click', function () { carregar().catch(function (e) { if (e.status === 401) mostrar(false); }); });

  $('#chips').addEventListener('click', function (ev) {
    var b = ev.target.closest('.chip');
    if (!b) return;
    filtroArea = b.getAttribute('data-area') || '';
    $$('.chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    desenhar();
  });
  $('#busca').addEventListener('input', function (ev) { termo = ev.target.value.trim(); desenhar(); });
  $('#lista').addEventListener('click', function (ev) {
    var b = ev.target.closest('.linha-c');
    if (b) abrirDetalhe(b.getAttribute('data-id'));
  });
  $('#d-fechar').addEventListener('click', fecharDetalhe);
  $('#detalhe').addEventListener('click', function (ev) { if (ev.target === ev.currentTarget) fecharDetalhe(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !$('#detalhe').hidden) fecharDetalhe(); });

  // já está liberado (cookie válido)? entra direto; senão pede a senha
  carregar().catch(function () { mostrar(false); });
})();
