/* =====================================================================
   animacion.js — Dibujo animado de una pieza
   ---------------------------------------------------------------------
   Dibuja un corte de la pared de la pieza:
     izquierda -> lo que la toca (gas del pozo, MEG, agua de mar...)
     centro    -> las capas de material, una al lado de otra
     derecha   -> lo que hay al otro lado (agua de mar, roca o nada)
   El daño se dibuja según el modo de falla que devuelve el modelo.
   El movimiento está en css/animacion.css.
   ===================================================================== */
var B1 = globalThis.B1 || (globalThis.B1 = {});

(function () {
  var COLOR = { acero: '#74828c', cra: '#a9b8c3', recargue: '#566069', cemento: '#b9b3a4', pendiente: '#9aa5ab', polimero: '#2b2f33' };
  var X0 = 150, X1 = 270, ALTO = 120;           // la pared va de X0 a X1

  /* números "al azar" repetibles, para que el dibujo no salte en cada cambio */
  function azar(semilla) {
    var s = semilla * 9301 + 49297;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }
  function cubeta(kPa) { return kPa <= 0 ? 0 : kPa < 10 ? 1 : kPa < 100 ? 3 : 6; }
  function esInserto(k) { return /sello|caras/.test(k.rol); }
  function colorDe(m) { return m.color || COLOR[m.familia]; }

  function repartir(rp) {
    var paredes = rp.capas.filter(function (k) { return !esInserto(k); });
    var insertos = rp.capas.filter(esInserto);
    if (!paredes.length) { paredes = insertos; insertos = []; }
    return { paredes: paredes, insertos: insertos };
  }

  /* Firma: si no cambia, no hace falta volver a dibujar */
  B1.firmaPieza = function (rp, a, esc) {
    return JSON.stringify([rp.capas.map(function (k) { return [k.clave, k.estado, k.modo, Math.round(k.frac * 20), k.medio, k.lado]; }),
      cubeta(a.pH2S), cubeta(a.pCO2), a.Cl > 0, esc.defectoClad]);
  };

  /* ---------- medios ---------- */
  function medioIzq(medio, a, resiste, r) {
    var o = '';
    if (medio === 'gas') {
      o += '<rect class="m-gas" x="0" y="0" width="' + X0 + '" height="' + ALTO + '"/>';
      var clase = resiste ? 'rebota' : 'entra';
      function tanda(n, cls, radio) {
        for (var i = 0; i < n; i++) {
          o += '<circle class="pt ' + cls + ' ' + clase + '" cx="' + (8 + r() * 30).toFixed(0) + '" cy="' + (10 + r() * 100).toFixed(0) + '" r="' + radio +
               '" style="--d:' + (2.2 + r() * 2.4).toFixed(2) + 's;--r:-' + (r() * 4).toFixed(2) + 's"/>';
        }
      }
      tanda(cubeta(a.pH2S), 'h2s', 5);
      tanda(cubeta(a.pCO2), 'co2', 4.5);
      tanda(3, 'agua', 3.5);
      if (a.Cl > 0) tanda(5, 'sal', 2.6);
      o += '<text class="rot-medio" x="6" y="13">Gas del pozo</text>';
    } else if (medio === 'meg') {
      o += '<rect class="m-meg" x="0" y="0" width="' + X0 + '" height="' + ALTO + '"/>';
      for (var i = 0; i < 6; i++) {
        o += '<circle class="pt meg baja" cx="' + (15 + r() * 120).toFixed(0) + '" cy="-6" r="4" style="--d:' + (3 + r() * 2).toFixed(2) + 's;--r:-' + (r() * 5).toFixed(2) + 's"/>';
      }
      o += '<text class="rot-medio" x="6" y="13">MEG limpio</text>';
    } else if (medio === 'mar') {
      o += mar(0, X0) + '<text class="rot-medio" x="6" y="13">Agua de mar</text>';
    } else if (medio === 'anular') {
      o += '<rect class="m-anular" x="0" y="0" width="' + X0 + '" height="' + ALTO + '"/><text class="rot-medio" x="6" y="13">Anular: sin gas</text>';
    } else {
      o += '<rect class="m-fuera" x="0" y="0" width="' + X0 + '" height="' + ALTO + '"/><text class="rot-medio" x="6" y="13">Sin contacto con el gas</text>';
    }
    return o;
  }
  function mar(x, w) {
    var o = '<rect class="m-mar" x="' + x + '" y="0" width="' + w + '" height="' + ALTO + '"/>';
    for (var y = 22; y < ALTO; y += 26) {
      o += '<path class="ola" d="M' + x + ',' + y + ' q' + (w / 8) + ',-7 ' + (w / 4) + ',0 t' + (w / 4) + ',0 t' + (w / 4) + ',0 t' + (w / 4) + ',0"/>';
    }
    return o;
  }

  /* ---------- daño dentro de una capa (x0, ancho w) ---------- */
  function danio(k, x0, w, r, uid) {
    if (!k.ve || !k.modo || k.estado === 'ok' || k.estado === 'na') return '';
    var st = 'var(--' + k.estado + ')';
    var o = '', i;
    var fondo = k.lado === 'der' ? 'm-mar' : (k.medio === 'meg' ? 'm-meg' : k.medio === 'mar' ? 'm-mar' : 'm-gas');
    var abierta = k.capa.exp !== 'respaldo';      // el respaldo solo se daña detrás del poro del revestimiento

    if (k.modo === 'grieta') {
      var largo = k.estado === 'no' ? w : w * 0.4, pasos = 6, d = 'M' + x0 + ',60';
      for (i = 1; i <= pasos; i++) d += ' L' + (x0 + largo * i / pasos).toFixed(1) + ',' + (60 + (i % 2 ? -9 : 7) * (0.6 + r() * 0.6)).toFixed(1);
      o += '<path class="grieta" pathLength="1" stroke="' + st + '" d="' + d + '"/>';
      if (k.estado === 'no') o += '<path class="grieta dos" pathLength="1" stroke="' + st + '" d="M' + (x0 + w * 0.45) + ',58 l' + (w * 0.2) + ',-22 l' + (w * 0.15) + ',6"/>';
    } else if (k.modo === 'adelgaza') {
      var f = Math.max(0.08, Math.min(1, k.frac));
      if (abierta) {
        var borde = x0 + f * w, p = 'M' + x0 + ',0 L' + borde.toFixed(1) + ',0';
        for (i = 1; i <= 8; i++) p += ' L' + (borde + (i % 2 ? -5 : 3) * (f < 1 ? 1 : 0)).toFixed(1) + ',' + (i * 15);
        p += ' L' + x0 + ',' + ALTO + ' Z';
        o += '<path class="' + fondo + ' comido" d="' + p + '"/>';
      } else {
        o += '<circle class="' + fondo + ' comido" cx="' + x0 + '" cy="60" r="' + (8 + f * (w - 8)).toFixed(1) + '"/>';
      }
      if (f >= 1) o += '<g class="fuga"><path d="M' + (x0 + w - 4) + ',60 h34 m-9,-7 l9,7 l-9,7"/><text x="' + (x0 + w + 6) + '" y="46">Fuga</text></g>';
    } else if (k.modo === 'pica') {
      var n = k.estado === 'no' ? 5 : 3;
      for (i = 0; i < n; i++) o += '<circle class="' + fondo + ' late" cx="' + x0 + '" cy="' + (16 + i * (88 / (n - 1 || 1))).toFixed(0) + '" r="' + (5 + r() * 5).toFixed(1) + '" style="--r:-' + (r() * 2).toFixed(2) + 's"/>';
    } else if (k.modo === 'endurece' || k.modo === 'ablanda') {
      for (i = 0; i < 7; i++) {
        var cx = x0 + 6 + r() * (w - 12), cy = 10 + r() * 100;
        o += '<path class="grieta corta" pathLength="1" stroke="#e9dccb" style="--r:-' + (r() * 3).toFixed(2) + 's" d="M' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' l' + (r() * 14 - 7).toFixed(1) + ',' + (6 + r() * 8).toFixed(1) + ' l' + (r() * 12 - 6).toFixed(1) + ',' + (4 + r() * 8).toFixed(1) + '"/>';
      }
    } else if (k.modo === 'deshace') {
      var hondo = (k.estado === 'no' ? 0.9 : 0.45) * w;
      for (i = 0; i < 14; i++) o += '<circle class="' + fondo + ' late" cx="' + (x0 + r() * hondo).toFixed(1) + '" cy="' + (6 + r() * 108).toFixed(0) + '" r="' + (3 + r() * 5).toFixed(1) + '" style="--r:-' + (r() * 3).toFixed(2) + 's"/>';
      for (i = 0; i < 4; i++) o += '<rect class="migaja" x="' + (x0 - 6 - r() * 10).toFixed(0) + '" y="' + (20 + r() * 60).toFixed(0) + '" width="4" height="4" style="--r:-' + (r() * 3).toFixed(2) + 's"/>';
    } else if (k.modo === 'oxida') {
      for (i = 0; i < 6; i++) o += '<circle class="oxido late" cx="' + (x0 + r() * 10).toFixed(1) + '" cy="' + (10 + r() * 100).toFixed(0) + '" r="' + (5 + r() * 6).toFixed(1) + '" style="--r:-' + (r() * 3).toFixed(2) + 's"/>';
    }
    if (!o) return '';
    var giro = k.lado === 'der' ? ' transform="translate(' + (2 * x0 + w) + ',0) scale(-1,1)"' : '';
    return '<g clip-path="url(#' + uid + ')"' + giro + '>' + o.replace(/<g class="fuga">[\s\S]*?<\/g>/, '') + '</g>' + (o.match(/<g class="fuga">[\s\S]*?<\/g>/) || [''])[0];
  }

  /* ---------- dibujo completo ---------- */
  B1.dibujarPieza = function (rp, a, esc, semilla) {
    var r = azar(semilla + 3);
    var rep = repartir(rp), paredes = rep.paredes, insertos = rep.insertos;
    var primera = paredes[0];
    var medio = primera.medio === 'cubierto' ? 'fuera' : primera.medio;
    var resiste = primera.estado === 'ok';
    var hayMar = rp.capas.some(function (k) { return k.capa.mar; });
    var enRoca = primera.capa.exp === 'cemento';
    var w = (X1 - X0) / paredes.length;
    var uid = 'c' + semilla;

    var o = '<svg class="anim" viewBox="0 0 360 150" role="img" aria-label="' + B1.titular(rp) + '">';
    o += medioIzq(medio, a, resiste, r);

    // lado derecho
    if (hayMar) o += mar(X1, 360 - X1) + '<text class="rot-medio" x="' + (X1 + 6) + '" y="13">Agua de mar</text>';
    else if (enRoca) o += '<rect class="m-roca" x="' + X1 + '" y="0" width="' + (360 - X1) + '" height="' + ALTO + '"/><text class="rot-medio" x="' + (X1 + 6) + '" y="13">Roca</text>';
    else o += '<rect class="m-seco" x="' + X1 + '" y="0" width="' + (360 - X1) + '" height="' + ALTO + '"/>';

    // capas de material
    paredes.forEach(function (k, j) {
      var x = X0 + j * w, id = uid + '_' + j;
      o += '<clipPath id="' + id + '"><rect x="' + x + '" y="0" width="' + w + '" height="' + ALTO + '"/></clipPath>';
      o += '<rect class="capa-mat' + (k.estado === 'na' ? ' apagada' : '') + '" x="' + x + '" y="0" width="' + w + '" height="' + ALTO + '" fill="' + colorDe(k.mat) + '"/>';
      if (k.mat.familia === 'cemento') for (var i = 0; i < 26; i++) o += '<circle class="grano" cx="' + (x + r() * w).toFixed(0) + '" cy="' + (r() * ALTO).toFixed(0) + '" r="1.6"/>';
      // poro en el revestimiento cuando el acero de atrás queda al descubierto
      var sig = paredes[j + 1];
      if (sig && sig.capa.exp === 'respaldo' && sig.ve) {
        o += '<rect class="m-gas" x="' + x + '" y="54" width="' + w + '" height="12"/>' +
             '<circle class="pt h2s chorro" cx="' + x + '" cy="60" r="3.5" style="--w:' + w + 'px"/>';
      }
      o += danio(k, x, w, r, id);
      o += '<rect x="' + x + '" y="' + (ALTO + 3) + '" width="' + (w - 2) + '" height="5" rx="2" fill="var(--' + k.estado + ')"/>';
      o += '<text class="rot-capa" x="' + (x + w / 2) + '" y="' + (ALTO + 22) + '"' + (paredes.length > 2 ? ' style="font-size:9.5px"' : '') + '>' + k.mat.corto + '</text>';
    });
    o += '<rect class="marco" x="' + X0 + '" y="0" width="' + (X1 - X0) + '" height="' + ALTO + '"/>';

    // insertos: sellos y caras duras, sobre la superficie mojada
    insertos.forEach(function (k, i) {
      var y = 22 + i * 46, x = X0 - 13;
      o += '<g class="inserto"><rect x="' + x + '" y="' + y + '" width="26" height="30" rx="5" fill="' + colorDe(k.mat) + '" stroke="var(--' + k.estado + ')" stroke-width="3"/>';
      if (k.ve && k.estado !== 'ok' && k.estado !== 'na') {
        o += '<path class="grieta corta" pathLength="1" stroke="#e9dccb" d="M' + (x + 5) + ',' + (y + 6) + ' l7,8 l-4,6 l8,6"/>' +
             '<path class="grieta corta" pathLength="1" stroke="#e9dccb" style="--r:-1.2s" d="M' + (x + 20) + ',' + (y + 5) + ' l-5,9 l5,7"/>';
      }
      o += '<text class="rot-inserto" x="' + (x - 5) + '" y="' + (y + 19) + '">' + k.mat.corto + '</text></g>';
    });

    return o + '</svg>';
  };
})();
