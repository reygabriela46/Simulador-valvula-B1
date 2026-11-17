/* =====================================================================
   componente.js — Simulador de UN componente
   ---------------------------------------------------------------------
   Lo usan todas las páginas de la carpeta "componentes". Cada página
   solo dice cuál es su componente con  <body data-comp="...">.
   ===================================================================== */
(function () {
  'use strict';
  var B1 = globalThis.B1;

  var id = document.body.dataset.comp;
  var lista = B1.componentes.filter(function (k) { return k.id === 'vmaestra' || k.id === 'esparragos'; });
  var pos = lista.map(function (k) { return k.id; }).indexOf(id);
  var comp = lista[pos];
  if (!comp) {
    document.body.innerHTML = '<p style="padding:24px">No existe el componente "' + id + '". Revise el atributo data-comp de esta página.</p>';
    return;
  }

  var guardado = B1.cargarEstado();
  var cond = Object.assign({}, B1.base, guardado.cond);
  var esc = Object.assign({ defectoClad: false, fugaAnular: false, retroflujo: false }, guardado.esc);
  var elegidos = guardado.elegidos;            // materiales elegidos en todos los componentes
  var firmas = [];                             // para no redibujar animaciones iguales
  var reloj = null;

  function inventario() { return comp.piezas.map(function (p) { return p.capas.map(function (k) { return k.mat; }); }); }
  if (!elegidos[id] || elegidos[id].length !== comp.piezas.length) elegidos[id] = inventario();
  function mios() { return elegidos[id]; }

  function $(x) { return document.getElementById(x); }
  function todos(q) { return Array.prototype.slice.call(document.querySelectorAll(q)); }
  function h(s) {
    return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; });
  }
  function sello(estado, lleno) {
    return '<span class="sello st-' + estado + (lleno ? ' lleno' : '') + '">' + B1.textoEstado[estado] + '</span>';
  }

  var exps = {};
  comp.piezas.forEach(function (p) { p.capas.forEach(function (k) { exps[k.exp] = true; }); });
  var veElPozo = exps.produccion || exps.cemento || exps.anular || exps.respaldo || exps.meg;

  /* ---------------- Estructura fija ---------------- */
  function campo(k, etiqueta, ayuda, unidad, min, max, paso, maxNum) {
    return '<div class="campo"><label for="r-' + k + '">' + etiqueta + (unidad ? ' <small>' + unidad + '</small>' : '') + '</label>' +
      '<div class="par"><input id="r-' + k + '" type="range" min="' + min + '" max="' + max + '" step="' + paso + '" data-k="' + k + '">' +
      '<input type="number" min="' + min + '" max="' + (maxNum || max) + '" step="' + paso + '" data-k="' + k + '" aria-label="' + h(etiqueta) + '"></div>' +
      '<p class="ayuda">' + ayuda + '</p></div>';
  }
  function corto(k, etiqueta, unidad, min, max, paso) {
    return '<div class="campo corto"><label for="n-' + k + '">' + etiqueta + (unidad ? ' <small>' + unidad + '</small>' : '') + '</label>' +
      '<input id="n-' + k + '" type="number" min="' + min + '" max="' + max + '" step="' + paso + '" data-k="' + k + '"></div>';
  }

  function armar() {
    var ant = lista[pos - 1], sig = lista[pos + 1];
    var fallas = '';
    if (exps.respaldo) fallas += '<label><input type="checkbox" data-esc="defectoClad"> Se daña el revestimiento <small>el acero de atrás queda al descubierto</small></label>';
    if (exps.anular)   fallas += '<label><input type="checkbox" data-esc="fugaAnular"> El packer deja pasar gas <small>el gas llega al anular</small></label>';
    if (exps.meg)      fallas += '<label><input type="checkbox" data-esc="retroflujo"> El gas se devuelve por la línea de MEG <small>falla la válvula de retención</small></label>';

    var tarjetas = comp.piezas.map(function (p, i) {
      return '<article class="tarjeta" id="p' + i + '">' +
        '<header><h3>' + h(p.nombre) + '</h3><span class="t-sello"></span></header>' +
        '<div class="t-anim"></div>' +
        '<p class="t-titular"></p><div class="t-como"></div>' +
        '<div class="t-mats"></div>' +
        '<details class="t-tec"><summary>Detalle técnico y normas</summary><div></div></details>' +
        '</article>';
    }).join('');

    document.body.innerHTML =
      '<header class="cabecera">' +
        '<div><a class="volver" href="../index.html">Sistema completo</a>' +
        '<h1><span class="num">' + h(comp.num) + '</span>' + h(comp.nombre) + '</h1>' +
        '<p>' + h(comp.corriente) + '. ' + comp.piezas.length + (comp.piezas.length === 1 ? ' pieza' : ' piezas') + '.</p></div>' +
        '<div class="paso">' +
          (ant ? '<a href="' + ant.id + '.html">Anterior: ' + h(ant.nombre) + '</a>' : '') +
          (sig ? '<a href="' + sig.id + '.html">Siguiente: ' + h(sig.nombre) + '</a>' : '') +
        '</div>' +
      '</header>' +
      '<nav id="tira" class="tira" aria-label="Componentes del sistema"></nav>' +
      '<main class="tablero-comp">' +
        '<section class="panel condiciones" aria-label="Condiciones"><h2>Cambie las condiciones</h2>' +
          (veElPozo ? '' : '<p class="nota aviso">Esta parte solo toca el agua de mar. Las condiciones del pozo no la afectan.</p>') +
          '<div class="campo campo-tiempo"><label for="r-anio">Años en servicio</label>' +
            '<output id="o-anio" class="grande">Año 0</output>' +
            '<input id="r-anio" type="range" min="0" max="25" step="1" data-k="anio">' +
            '<div class="fila"><button id="b-play" type="button" class="boton">Ver pasar los 25 años</button><span id="o-agua" class="chip"></span></div></div>' +
          '<div class="rapidos" id="rapidos"></div>' +
          campo('pH2S', 'H₂S', 'Gas que agrieta los metales y endurece los cauchos.', 'bar', 0, 10, 0.01, 50) +
          campo('pCO2', 'CO₂', 'Con agua forma un ácido que se come el acero.', 'bar', 0, 15, 0.01, 50) +
          campo('pH', 'Acidez del agua (pH)', 'Más bajo es más ácido. El agua condensada tiene 3,9.', '', 2.5, 7, 0.1) +
          campo('T', 'Temperatura máxima', 'El calor acelera el daño y quema los cauchos.', '°C', 20, 250, 1) +
          '<details class="mas"><summary>Agua de formación y otros datos</summary>' +
            corto('clFormacion', 'Sal del agua de formación', 'mg/l', 0, 250000, 500) +
            corto('anioIrrupcion', 'Año en que llega el agua salada', '', 0, 25, 1) +
            corto('sobreespesor', 'Milímetros de acero de sobra', 'mm', 0, 12, 0.5) +
            corto('tLecho', 'Temperatura del fondo del mar', '°C', 0, 30, 1) +
          '</details>' +
          (fallas ? '<fieldset class="escenarios"><legend>¿Y si falla una barrera?</legend>' + fallas + '</fieldset>' : '') +
          '<button id="b-reset" type="button" class="boton suave ancho">Volver a la base de diseño</button>' +
        '</section>' +
        '<div class="columna">' +
          '<section class="panel veredicto" aria-live="polite">' +
            '<p id="frase" class="frase"></p><div id="chips" class="chips"></div>' +
            '<div class="fila"><button id="b-rec" type="button" class="boton">Usar los materiales recomendados</button>' +
            '<button id="b-inv" type="button" class="boton suave">Volver a los del inventario</button><span id="o-cambios" class="pie"></span></div>' +
          '</section>' +
          '<section class="panel equipo"><h2>Así es el equipo</h2><div id="equipo"></div>' +
            '<p class="pie">Dibujo en corte. El borde de cada pieza tiene el color de su estado. Toque una pieza o su nombre para ir a su tarjeta.</p></section>' +
          '<ul class="leyenda-pt" aria-label="Qué significa cada punto de los dibujos">' +
            '<li><i class="pt-h2s"></i>H₂S</li><li><i class="pt-co2"></i>CO₂</li><li><i class="pt-agua"></i>Agua</li>' +
            '<li><i class="pt-sal"></i>Sal (desde el año ' + '<span id="o-irr"></span>)</li><li><i class="pt-meg"></i>MEG</li>' +
            '<li class="sep">La barra bajo cada material muestra su estado.</li></ul>' +
          '<div class="tarjetas">' + tarjetas + '</div>' +
          '<section class="panel"><h2>Cómo le va a cada pieza en los 25 años</h2>' +
            '<p class="pie">Una fila por pieza y una columna por año. Toque una celda para ir a ese año.</p>' +
            '<div class="scroll"><table id="vida" class="vida"></table></div></section>' +
        '</div>' +
      '</main>' +
      '<footer class="notas"><p>Herramienta de cribado para clase. Los límites de las normas están cargados como referencia de trabajo y los costos son orientativos: ' +
      'hay que confirmarlos antes de usarlos en el informe. Se editan en <code>js/datos.js</code>.</p></footer>';

    $('rapidos').innerHTML = B1.escenarios.map(function (e) {
      return '<button type="button" class="boton suave" data-rapido="' + e.id + '">' + h(e.nombre) + '</button>';
    }).join('');
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

  function conectar() {
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
    $('rapidos').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-rapido]');
      if (!b) return;
      var e = B1.escenarios.filter(function (x) { return x.id === b.dataset.rapido; })[0];
      var anio = cond.anio;
      cond = Object.assign({}, B1.base, e.cambia || {}, { anio: anio });
      ponerValores(); pintar();
    });
    $('b-reset').addEventListener('click', function () {
      parar();
      cond = Object.assign({}, B1.base);
      esc = { defectoClad: false, fugaAnular: false, retroflujo: false };
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
    $('b-rec').addEventListener('click', function () { elegidos[id] = B1.recomendadosComp(comp, cond, esc); pintar(); });
    $('b-inv').addEventListener('click', function () { elegidos[id] = inventario(); pintar(); });
    $('vida').addEventListener('click', function (ev) {
      var td = ev.target.closest('td[data-y]');
      if (!td) return;
      parar(); cond.anio = +td.dataset.y; ponerValores(); pintar();
    });
    // tocar una pieza del dibujo lleva a su tarjeta
    $('equipo').addEventListener('click', function (ev) {
      var g = ev.target.closest('[data-p]');
      if (!g) return;
      var t = $('p' + g.getAttribute('data-p'));
      if (!t) return;
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      t.classList.remove('destello'); void t.offsetWidth; t.classList.add('destello');
    });
    // elegir un material en una tarjeta
    document.querySelector('.tarjetas').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-mat]');
      if (!b) return;
      mios()[+b.dataset.i][+b.dataset.j] = b.dataset.mat;
      pintar();
    });
  }

  /* ---------------- Pintado ---------------- */
  function pintarTira() {
    $('tira').innerHTML = lista.map(function (k) {
      var e = B1.evaluarComponente(k, cond, esc, cond.anio, elegidos[k.id]).estado;
      return '<a class="st-' + e + (k.id === id ? ' aqui' : '') + '" href="' + k.id + '.html" title="' + h(k.nombre + ': ' + B1.textoEstado[e]) + '"' +
             (k.id === id ? ' aria-current="page"' : '') + '><span class="punto"></span><b>' + h(k.num) + '</b> ' + h(k.nombre) + '</a>';
    }).join('');
  }

  function pintarVeredicto(r, a) {
    var n = { ok: 0, cond: 0, no: 0, na: 0 };
    r.piezas.forEach(function (p) { n[p.estado] += 1; });
    var total = r.piezas.length, frase;
    if (n.no) frase = '<b class="st-no">' + (n.no === 1 ? 'Falla 1' : 'Fallan ' + n.no) + ' de ' + total + (total === 1 ? ' pieza' : ' piezas') + '</b> con estas condiciones' + (n.cond ? ' y ' + n.cond + (n.cond === 1 ? ' está' : ' están') + ' en riesgo.' : '.');
    else if (n.cond) frase = '<b class="st-cond">' + 'Hay ' + n.cond + ' de ' + total + (total === 1 ? ' pieza' : ' piezas') + ' en riesgo.</b> Ninguna falla todavía.';
    else if (n.ok) frase = '<b class="st-ok">Todas las piezas que tocan el gas resisten.</b>';
    else frase = 'Ninguna pieza toca el gas en esta condición.';
    $('frase').innerHTML = frase;

    var d = B1.describir(a);
    $('chips').innerHTML =
      '<span class="chip">' + d.gas + ' · H₂S ' + B1.num(a.pH2S) + ' kPa</span>' +
      '<span class="chip">CO₂ ' + B1.num(a.pCO2) + ' kPa</span>' +
      '<span class="chip' + (a.Cl > 0 ? ' formacion' : '') + '">' + d.agua + (a.Cl > 0 ? ' · ' + B1.num(a.Cl) + ' mg/l' : '') + '</span>' +
      '<span class="chip">' + d.acido + ' · pH ' + B1.num(a.pH, 1) + '</span>' +
      '<span class="chip">' + d.calor + ' · ' + B1.num(a.T) + ' °C</span>';

    var cambios = 0;
    comp.piezas.forEach(function (p, i) { p.capas.forEach(function (k, j) { if (mios()[i][j] !== k.mat) cambios += 1; }); });
    $('o-cambios').textContent = cambios ? cambios + (cambios === 1 ? ' material cambiado' : ' materiales cambiados') + ' respecto al inventario.' : 'Está viendo los materiales del inventario.';
    $('b-inv').disabled = !cambios;

    $('o-anio').textContent = 'Año ' + cond.anio + ' de ' + cond.vida;
    $('o-agua').textContent = a.Cl > 0 ? 'Agua salada' : 'Agua condensada';
    $('o-agua').className = 'chip' + (a.Cl > 0 ? ' formacion' : '');
    $('o-irr').textContent = cond.anioIrrupcion;
  }

  function pintarTarjeta(rp, i, a) {
    var t = $('p' + i), p = rp.pieza;
    t.className = 'tarjeta st-' + rp.estado;
    t.querySelector('.t-sello').innerHTML = sello(rp.estado, true);

    var firma = B1.firmaPieza(rp, a, esc);
    if (firmas[i] !== firma) {
      firmas[i] = firma;
      t.querySelector('.t-anim').innerHTML = B1.dibujarPieza(rp, a, esc, pos * 100 + i);
    }

    t.querySelector('.t-titular').textContent = B1.titular(rp);

    // cómo falla y por qué
    var como = '';
    rp.capas.forEach(function (k) {
      var malas = k.lineas.filter(function (l) { return l.estado === 'no' || l.estado === 'cond'; });
      var usar = malas.length ? malas : [k.lineas[0]];
      usar.forEach(function (l) {
        como += '<p class="st-' + l.estado + '"><b>' + h(k.mat.corto) + (k.rol ? ' (' + h(k.rol) + ')' : '') + '.</b> ' + h(l.como) + '</p>';
      });
    });
    t.querySelector('.t-como').innerHTML = como;

    // materiales: candidatos y recomendado
    var mats = '';
    rp.capas.forEach(function (k, j) {
      var rec = B1.recomendar(p.capas[j], cond, esc);
      mats += '<div class="grupo-mat"><div class="g-tit">' + (k.rol ? h(k.rol.charAt(0).toUpperCase() + k.rol.slice(1)) : 'Material') + '</div>';
      if (!rec) {
        mats += '<p class="g-msj"><b>' + h(k.mat.corto) + '</b>. ' + (k.ve ? 'No hay otros candidatos cargados para esta pieza.' : 'Como no toca el gas, no hace falta cambiarlo.') + '</p></div>';
        return;
      }
      mats += '<div class="opciones">';
      rec.lista.forEach(function (c) {
        if (c.clave === 'PENDIENTE') return;
        mats += '<button type="button" class="opcion st-' + c.peor + (c.clave === k.clave ? ' elegida' : '') + '" data-mat="' + c.clave + '" data-i="' + i + '" data-j="' + j + '"' +
                ' aria-pressed="' + (c.clave === k.clave) + '" title="' + h(c.mat.nombre + ' · ' + c.mat.producto + ' · en 25 años: ' + B1.textoEstado[c.peor].toLowerCase()) + '">' +
                '<span class="punto"></span>' + h(c.mat.corto) +
                (c.clave === rec.mejor ? '<em class="rec">recomendado</em>' : '') + (c.inventario ? '<em>inventario</em>' : '') + '</button>';
      });
      mats += '</div><p class="g-msj">' + h(rec.mensaje) + '</p></div>';
    });
    t.querySelector('.t-mats').innerHTML = mats;

    // detalle técnico
    var tec = '<p><b>Según el inventario:</b> ' + h(p.material) + '. ' + h(p.norma) + '.</p>';
    rp.capas.forEach(function (k) {
      tec += '<p><b>' + h(k.mat.nombre) + '</b><br>Se compra con: ' + h(k.mat.producto) + '.<br>Límite de servicio: ' + h(k.mat.ref) + '.<br>Dónde está: ' + h(k.donde) + '.</p><ul>';
      k.lineas.forEach(function (l) { if (l.tec) tec += '<li class="st-' + l.estado + '"><b>' + h(l.mec) + '.</b> ' + h(l.tec) + '</li>'; });
      tec += '</ul>';
    });
    if (p.nota) tec += '<p class="nota">' + h(p.nota) + '</p>';
    t.querySelector('.t-tec > div').innerHTML = tec;
  }

  function pintarVida() {
    var out = '<thead><tr><th class="nombre">Pieza</th>';
    for (var y = 0; y <= cond.vida; y++) {
      out += '<th class="' + (y === cond.anio ? 'hoy ' : '') + (y === cond.anioIrrupcion ? 'irr' : '') + '"' +
             (y === cond.anioIrrupcion ? ' title="Llega el agua salada de formación"' : '') + '>' + y + '</th>';
    }
    out += '</tr></thead><tbody>';
    comp.piezas.forEach(function (p, i) {
      out += '<tr><th class="nombre" scope="row">' + h(p.nombre) + '</th>';
      B1.vidaPieza(p, cond, esc, mios()[i]).forEach(function (e, y) {
        out += '<td data-y="' + y + '" class="st-' + e + (y === cond.anio ? ' hoy' : '') + (y === cond.anioIrrupcion ? ' irr' : '') +
               '" title="Año ' + y + ': ' + B1.textoEstado[e] + '"><span></span></td>';
      });
      out += '</tr>';
    });
    $('vida').innerHTML = out + '</tbody>';
  }

  /* El dibujo del equipo se arma una vez; aquí solo se le cambia el color */
  function pintarEquipo(r, a) {
    var svg = document.querySelector('#equipo svg');
    if (!svg) return;
    svg.setAttribute('class', 'equipo-svg' + (a.Cl > 0 ? ' con-sal' : '') + (a.pH2S <= 0 ? ' sin-h2s' : ''));
    todos('#equipo [data-p]').forEach(function (g) {
      var rp = r.piezas[+g.getAttribute('data-p')];
      if (!rp) return;
      var base = g.getAttribute('class').split(' ')[0];
      g.setAttribute('class', base + ' st-' + rp.estado);
      if (!g.querySelector('title')) g.insertAdjacentHTML('afterbegin', '<title></title>');
      g.querySelector('title').textContent = rp.pieza.nombre + ': ' + B1.titular(rp);
    });
  }

  function pintar() {
    B1.guardarEstado(cond, esc, elegidos);
    var a = B1.ambiente(cond, cond.anio);
    var r = B1.evaluarComponente(comp, cond, esc, cond.anio, mios());
    pintarTira();
    pintarVeredicto(r, a);
    pintarEquipo(r, a);
    r.piezas.forEach(function (rp, i) { pintarTarjeta(rp, i, a); });
    pintarVida();
  }

  armar();
  $('equipo').innerHTML = B1.dibujarEquipo(id);
  conectar();
  ponerValores();
  pintar();
})();
