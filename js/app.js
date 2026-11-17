/* =====================================================================
   app.js — Página del sistema completo
   Muestra el esquema con el estado de cada parte y un resumen sencillo.
   El detalle y las animaciones están en la página de cada componente.
   ===================================================================== */
(function () {
  'use strict';
  var B1 = globalThis.B1;

  var guardado = B1.cargarEstado();
  var cond = Object.assign({}, B1.base, guardado.cond);
  var esc = Object.assign({ defectoClad: false, fugaAnular: false, retroflujo: false }, guardado.esc);
  var elegidos = guardado.elegidos;       // materiales cambiados en las páginas de componente
  var sel = 'tubing';
  var reloj = null;

  function $(id) { return document.getElementById(id); }
  function todos(q) { return Array.prototype.slice.call(document.querySelectorAll(q)); }
  function h(s) {
    return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; });
  }
  function sello(estado, lleno) {
    return '<span class="sello st-' + estado + (lleno ? ' lleno' : '') + '">' + B1.textoEstado[estado] + '</span>';
  }

  /* ---------------- Controles ---------------- */
  function ponerValores() {
    todos('[data-k]').forEach(function (el) { el.value = cond[el.dataset.k]; });
    todos('[data-esc]').forEach(function (el) { el.checked = esc[el.dataset.esc]; });
  }
  function parar() {
    if (reloj) { clearInterval(reloj); reloj = null; }
    $('b-play').textContent = 'Ver pasar los 25 años';
  }

  todos('[data-k]').forEach(function (el) {
    el.addEventListener('input', function () {
      var v = parseFloat(el.value);
      if (isNaN(v)) return;
      if (el.min !== '' && v < +el.min) v = +el.min;
      if (el.max !== '' && v > +el.max) v = +el.max;
      cond[el.dataset.k] = v;
      todos('[data-k="' + el.dataset.k + '"]').forEach(function (otro) { if (otro !== el) otro.value = v; });
      pintar();
    });
  });
  todos('[data-esc]').forEach(function (el) {
    el.addEventListener('change', function () { esc[el.dataset.esc] = el.checked; pintar(); });
  });
  todos('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () { Object.assign(cond, B1.presets[b.dataset.preset]); ponerValores(); pintar(); });
  });

  $('rapidos').innerHTML = B1.escenarios.map(function (e) {
    return '<button type="button" class="boton suave" data-rapido="' + e.id + '">' + h(e.nombre) + '</button>';
  }).join('');
  $('rapidos').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rapido]');
    if (!b) return;
    var e = B1.escenarios.filter(function (x) { return x.id === b.dataset.rapido; })[0];
    cond = Object.assign({}, B1.base, e.cambia || {}, { anio: cond.anio });
    ponerValores(); pintar();
  });

  $('b-reset').addEventListener('click', function () {
    parar();
    cond = Object.assign({}, B1.base);
    esc = { defectoClad: false, fugaAnular: false, retroflujo: false };
    elegidos = {};                         // también vuelve a los materiales del inventario
    ponerValores(); pintar();
  });
  $('b-play').addEventListener('click', function () {
    if (reloj) { parar(); return; }
    if (cond.anio >= cond.vida) cond.anio = 0;
    $('b-play').textContent = 'Pausar';
    reloj = setInterval(function () {
      cond.anio += 1;
      ponerValores(); pintar();
      if (cond.anio >= cond.vida) parar();
    }, 800);
    ponerValores(); pintar();
  });

  /* ---------------- Esquema: zonas de clic y flujo animado ---------------- */
  var SVG = 'http://www.w3.org/2000/svg';
  todos('#svg .comp').forEach(function (g) {
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    var marca = g.querySelector('.marca'), caja = marca.getBBox();
    var zona = document.createElementNS(SVG, 'rect');
    zona.setAttribute('x', caja.x - 4); zona.setAttribute('y', caja.y - 4);
    zona.setAttribute('width', caja.width + 8); zona.setAttribute('height', caja.height + 8);
    zona.setAttribute('fill', 'transparent');
    marca.insertBefore(zona, marca.firstChild);

    g.addEventListener('click', function () { sel = g.dataset.comp; pintar(); });
    g.addEventListener('dblclick', function () { location.href = 'componentes/' + g.dataset.comp + '.html'; });
    g.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); sel = g.dataset.comp; pintar(); }
    });
    // línea punteada que se mueve por dentro de cada tubo
    todos('#svg [data-comp="' + g.dataset.comp + '"] .tubo').forEach(function (tubo) {
      var f = document.createElementNS(SVG, 'path');
      f.setAttribute('d', tubo.getAttribute('d'));
      f.setAttribute('class', 'flujo' + (tubo.classList.contains('meg') ? ' meg' : ''));
      g.appendChild(f);
    });
  });
  (function () {                           // el gas sube por el tubing
    var f = document.createElementNS(SVG, 'path');
    f.setAttribute('d', 'M260,560 V150');
    f.setAttribute('class', 'flujo lento');
    $('svg').appendChild(f);
  })();

  $('resumen').addEventListener('click', function (ev) {
    if (ev.target.closest('a')) return;
    var tr = ev.target.closest('tr[data-comp]');
    if (tr) { sel = tr.dataset.comp; pintar(); }
  });

  /* ---------------- Pintado ---------------- */
  function pintarAmbiente(a) {
    var d = B1.describir(a), hay = a.Cl > 0;
    $('ambiente').innerHTML =
      '<div><dt>Gas</dt><dd>' + d.gas + '</dd></div>' +
      '<div' + (hay ? ' class="alerta"' : '') + '><dt>Agua</dt><dd>' + (hay ? 'Salada, ' + B1.num(a.Cl) + ' mg/l' : 'Condensada, sin sal') + '</dd></div>' +
      '<div><dt>Acidez</dt><dd>' + d.acido + '</dd></div>' +
      '<div><dt>Temperatura</dt><dd>' + d.calor + ', ' + B1.num(a.T) + ' °C</dd></div>' +
      '<div><dt>Acero sin proteger pierde</dt><dd>' + B1.num(B1.tasaCO2(a.T, a.pCO2), 1) + ' mm por año</dd></div>';

    $('o-anio').textContent = 'Año ' + cond.anio + ' de ' + cond.vida;
    $('o-agua').textContent = hay ? 'Agua salada' : 'Agua condensada';
    $('o-agua').className = 'chip' + (hay ? ' formacion' : '');
    $('t-agua').textContent = hay ? 'Agua salada de formación, ' + B1.num(a.Cl) + ' mg/l de cloruros' : 'Agua condensada, pH ' + B1.num(a.pH, 1);
  }

  function pintarEsquema(res) {
    todos('#svg .comp').forEach(function (g) {
      var r = res[g.dataset.comp];
      g.setAttribute('class', 'comp st-' + r.estado + (g.dataset.comp === sel ? ' sel' : ''));
      g.setAttribute('aria-label', r.comp.nombre + ': ' + B1.textoEstado[r.estado]);
      g.setAttribute('aria-pressed', g.dataset.comp === sel ? 'true' : 'false');
    });
  }

  function cuenta(r) {
    var n = { ok: 0, cond: 0, no: 0, na: 0 };
    r.piezas.forEach(function (p) { n[p.estado] += 1; });
    return n;
  }
  function frase(n, total) {
    var pz = ' de ' + total + (total === 1 ? ' pieza' : ' piezas');
    if (n.no) return (n.no === 1 ? 'Falla 1' : 'Fallan ' + n.no) + pz + (n.cond ? '; ' + n.cond + ' en riesgo' : '');
    if (n.cond) return n.cond + pz + ' en riesgo';
    if (n.ok) return 'Todo resiste';
    return 'No toca el gas';
  }

  function pintarDetalle(r) {
    var n = cuenta(r);
    var out = '<div class="det-cab"><h3>' + h(r.comp.num + ' · ' + r.comp.nombre) + '</h3>' +
      '<p class="sub">' + h(r.comp.corriente) + ' · año ' + cond.anio + '</p>' + sello(r.estado, true) +
      '<p class="frase">' + frase(n, r.piezas.length) + '.</p>' +
      '<a class="boton enlace" href="componentes/' + r.comp.id + '.html">Abrir su simulador y ver la animación</a></div><ul class="lista-piezas">';
    r.piezas.slice().sort(function (x, y) { return B1.peso[y.estado] - B1.peso[x.estado]; }).forEach(function (p) {
      out += '<li class="st-' + p.estado + '"><b>' + h(p.pieza.nombre) + '</b><span>' + h(B1.titular(p)) + '</span>' +
             '<small>' + h(p.capas.map(function (k) { return k.mat.corto; }).join(' + ')) + '</small></li>';
    });
    $('detalle').innerHTML = out + '</ul>';
  }

  function pintarResumen(res) {
    var out = '<thead><tr><th>Parte</th><th>Estado</th><th>Qué pasa</th><th>Empeora en</th><th></th></tr></thead><tbody>';
    B1.componentes.forEach(function (k) {
      var r = res[k.id], n = cuenta(r);
      var cambio = B1.anioCambio(k, cond, esc, elegidos[k.id]);
      var peor = r.piezas.slice().sort(function (x, y) { return B1.peso[y.estado] - B1.peso[x.estado]; })[0];
      out += '<tr data-comp="' + k.id + '"' + (k.id === sel ? ' class="sel"' : '') + '>' +
        '<td><b>' + h(k.num) + '</b> · ' + h(k.nombre) + '</td><td>' + sello(r.estado, true) + '</td>' +
        '<td>' + frase(n, r.piezas.length) + (r.estado === 'no' || r.estado === 'cond' ? '. ' + h(peor.pieza.nombre) + ': ' + h(B1.titular(peor).toLowerCase()) : '') + '</td>' +
        '<td>' + (cambio ? 'Año ' + cambio.anio : 'No empeora') + '</td>' +
        '<td><a href="componentes/' + k.id + '.html">Abrir</a></td></tr>';
    });
    $('resumen').innerHTML = out + '</tbody>';
  }

  function pintar() {
    B1.guardarEstado(cond, esc, elegidos);
    var res = {};
    B1.componentes.forEach(function (k) { res[k.id] = B1.evaluarComponente(k, cond, esc, cond.anio, elegidos[k.id]); });
    pintarAmbiente(B1.ambiente(cond, cond.anio));
    pintarEsquema(res);
    pintarDetalle(res[sel]);
    pintarResumen(res);
  }

  ponerValores();
  pintar();
})();
