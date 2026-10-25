(function () {
  window.$ = function (s, r) { return (r || document).querySelector(s); };
  window.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  window.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  window.api = function (url, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: {} };
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    return fetch(url, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.erro || 'erro'); e.status = r.status; e.data = d; throw e; }
        return d;
      });
    });
  };

  // sombra no menu ao rolar
  var nav = $('.nav');
  if (nav) {
    var f = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    f(); window.addEventListener('scroll', f, { passive: true });
  }

  // "Login" vira "Painel" quando já está logado
  var link = $('#nav-login');
  if (link) {
    api('/api/me').then(function (d) {
      if (d.logado) { link.textContent = 'Painel'; link.setAttribute('href', '/painel'); }
    }).catch(function () {});
  }
})();
