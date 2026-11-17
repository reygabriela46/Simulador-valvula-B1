/* =====================================================================
   equipos.js — Dibujo de cada equipo tal como es en la realidad
   ---------------------------------------------------------------------
   Un dibujo en corte por componente (lienzo de 720 x 400).
   Cada pieza del inventario se marca con su número de pieza:
     P(i, formas)        -> formas de la pieza i (toman el color de su estado)
     T(i, x, y, lx, ly, texto, lado) -> rótulo de la pieza i con su línea guía
   El movimiento (gas, MEG, partes móviles) está en css/equipos.css.
   ===================================================================== */
var B1 = globalThis.B1 || (globalThis.B1 = {});

(function () {
  /* ---------- piezas de construcción ---------- */
  function R(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function S(x, y, w, h, fill, extra) { return R(x, y, w, h, fill, 'class="s" ' + (extra || '')); }      // con borde de estado
  function C(cx, cy, r, fill, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function PA(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function P(i, formas) { return '<g class="eq" data-p="' + i + '">' + formas + '</g>'; }
  function T(i, x, y, lx, ly, txt, lado) {
    var fin = lado === 'izq';
    return '<g class="eq-tag" data-p="' + i + '"><path class="eq-guia" d="M' + x + ',' + y + ' L' + lx + ',' + ly + '"/>' +
      '<circle class="eq-pt" cx="' + x + '" cy="' + y + '" r="4.5"/>' +
      '<text x="' + (lx + (fin ? -6 : 6)) + '" y="' + (ly + 4.5) + '" text-anchor="' + (fin ? 'end' : 'start') + '">' + txt + '</text></g>';
  }
  function N(x, y, txt, lado) { return '<text class="eq-nota" x="' + x + '" y="' + y + '" text-anchor="' + (lado === 'izq' ? 'end' : lado === 'cen' ? 'middle' : 'start') + '">' + txt + '</text>'; }
  /* partículas que recorren un camino */
  function flujo(d, n, dur, clase) {
    var o = '';
    for (var i = 0; i < n; i++) {
      var cls = clase || (i % 4 === 3 ? 'eq-sal' : i % 3 === 1 ? 'eq-co2' : 'eq-h2s');
      o += '<circle r="' + (cls === 'eq-sal' ? 3 : 4.2) + '" class="eq-part ' + cls + '"><animateMotion dur="' + dur + 's" begin="-' + (i * dur / n).toFixed(2) + 's" repeatCount="indefinite" path="' + d + '"/></circle>';
    }
    return o;
  }
  function espejo(cx, formas) { return formas + '<g transform="translate(' + (2 * cx) + ',0) scale(-1,1)">' + formas + '</g>'; }
  function olas(y, x0, x1) {
    var d = 'M' + x0 + ',' + y;
    for (var x = x0; x < x1; x += 40) d += ' q10,-7 20,0 t20,0';
    return '<path class="eq-ola" d="' + d + '"/>';
  }

  var MV = 'url(#eqMv)', MH = 'url(#eqMh)', CV = 'url(#eqCv)', CH = 'url(#eqCh)', YV = 'url(#eqYv)', YH = 'url(#eqYh)', DV = 'url(#eqDv)', DH = 'url(#eqDh)';
  var ROCA = 'url(#eqRoca)', CEM = 'url(#eqCem)', SUELO = 'url(#eqSuelo)', HULE = '#23272b', PEEK = '#cdb98f';

  function grad(id, vertical, c) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="' + (vertical ? 1 : 0) + '">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".3" stop-color="' + c[1] + '"/><stop offset=".65" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[3] + '"/></linearGradient>';
  }
  var M = ['#56636c', '#c6d0d6', '#7d8a93', '#454f57'], Cc = ['#8496a2', '#f1f5f7', '#aebcc6', '#6c7c87'], Y = ['#a87c00', '#ffdb55', '#dfa80f', '#8c6800'], D = ['#262b30', '#6d777f', '#3a4249', '#1d2125'];
  var DEFS = '<defs>' + grad('eqMv', false, M) + grad('eqMh', true, M) + grad('eqCv', false, Cc) + grad('eqCh', true, Cc) +
    grad('eqYv', false, Y) + grad('eqYh', true, Y) + grad('eqDv', false, D) + grad('eqDh', true, D) +
    '<pattern id="eqRoca" width="26" height="22" patternUnits="userSpaceOnUse"><rect width="26" height="22" class="eq-roca"/><circle cx="5" cy="6" r="2" class="eq-grano"/><circle cx="17" cy="14" r="2.6" class="eq-grano"/><circle cx="22" cy="4" r="1.3" class="eq-grano"/><circle cx="9" cy="18" r="1.4" class="eq-grano"/></pattern>' +
    '<pattern id="eqSuelo" width="30" height="14" patternUnits="userSpaceOnUse"><rect width="30" height="14" class="eq-suelo"/><circle cx="6" cy="4" r="1.2" class="eq-grano"/><circle cx="21" cy="10" r="1.4" class="eq-grano"/></pattern>' +
    '<pattern id="eqCem" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#b7b1a2"/><circle cx="3" cy="4" r="1.3" fill="#8b8576"/><circle cx="10" cy="10" r="1.6" fill="#99937f"/><circle cx="11" cy="3" r=".9" fill="#7f796b"/></pattern>' +
    '</defs>';

  function lienzo(contenido) {
    return '<svg class="equipo-svg" viewBox="0 0 720 400" role="group" aria-label="Dibujo del equipo. Toque una pieza para ver su tarjeta.">' + DEFS + contenido + '</svg>';
  }
  var AGUA = function (y0, y1) { return R(0, y0, 720, y1 - y0, '', 'class="eq-agua"'); };

  var E = {};

  /* ============ 1 · Formación productora ============ */
  E.formacion = function () {
    var o = R(0, 0, 720, 400, ROCA);
    o += P(1, espejo(360, S(268, 0, 26, 400, CEM)));
    o += P(0, espejo(360, S(294, 0, 14, 400, CV)));
    o += R(308, 0, 104, 400, '', 'class="eq-gasfondo"');
    var tun = '';
    [80, 190, 300].forEach(function (y) { tun += PA('M308,' + (y - 9) + ' L308,' + (y + 9) + ' L180,' + y + ' Z', '', 'class="eq-gasfondo s"'); });
    o += P(2, espejo(360, tun));
    [80, 190, 300].forEach(function (y, k) {
      o += flujo('M170,' + y + ' H340 Q352,' + y + ' 352,' + (y - 20) + ' V-10', 3, 4 + k, null);
      o += flujo('M550,' + y + ' H380 Q368,' + y + ' 368,' + (y - 20) + ' V-10', 3, 4.5 + k, null);
    });
    o += T(0, 419, 40, 560, 40, 'Casing del pozo') + T(1, 439, 130, 560, 130, 'Anillo de cemento') + T(2, 500, 300, 560, 340, 'Perforaciones (túneles)');
    o += N(150, 40, 'Roca del yacimiento', 'izq') + N(150, 58, 'El gas entra por los túneles', 'izq') + N(360, 392, 'Interior del pozo', 'cen');
    return lienzo(o);
  };

  /* ============ 2 · Casing ============ */
  E.casing = function () {
    var o = R(0, 0, 720, 400, ROCA) + AGUA(0, 46) + olas(18, 0, 720) + R(0, 44, 720, 5, '', 'class="eq-suelo"');
    var cx = 360, w = 7;
    function sarta(hw, y1, fill) { return espejo(cx, S(cx - hw - w, 46, w, y1 - 46, fill)); }
    function cemento(hwIn, hwOut, y0, y1) { return espejo(cx, R(cx - hwOut, y0, hwOut - hwIn - w, y1 - y0, CEM)); }
    o += cemento(120, 150, 46, 120) + P(0, sarta(150, 120, MV));
    o += cemento(92, 120, 46, 180) + P(1, sarta(120, 180, MV));
    o += cemento(66, 92, 46, 250) + P(2, sarta(92, 250, MV));
    o += R(cx - 66, 46, 132, 284, '', 'class="eq-anular"');
    o += P(4, sarta(66, 330, MV));
    o += P(14, espejo(cx, S(cx - 62, 312, 13, 86, CEM)));
    o += R(cx - 42, 300, 84, 96, '', 'class="eq-anular"') + R(cx - 42, 356, 84, 40, '', 'class="eq-gasfondo"');
    o += P(7, espejo(cx, S(cx - 49, 300, w, 50, MV)));
    o += P(9, espejo(cx, S(cx - 51, 350, 11, 8, DV)));
    o += P(8, espejo(cx, S(cx - 49, 358, w, 34, CV)));
    o += P(10, espejo(cx, PA('M' + (cx - 66) + ',300 h17 v14 l-17,-6 Z', DV, 'class="s"')));
    o += P(12, PA('M' + (cx - 49) + ',392 h98 l-12,8 h-74 Z', CV, 'class="s"'));
    o += espejo(cx, R(cx - 42, 344, 30, 12, HULE)) + R(cx - 12, 46, 24, 310, MV, 'opacity=".55"');
    o += flujo('M360,398 V-10', 4, 5, null);
    o += T(0, 207, 80, 150, 80, 'Conductor de 36 in', 'izq') + T(1, 237, 140, 150, 140, 'Superficie, 20 in', 'izq') + T(2, 265, 200, 150, 200, 'Intermedio, 13⅜ in', 'izq') + T(4, 291, 270, 150, 270, 'Producción, 9⅝ in', 'izq');
    o += T(10, 420, 304, 560, 290, 'Colgador de liner') + T(7, 406, 325, 560, 316, 'Liner sobre el packer') + T(9, 406, 354, 560, 342, 'Junta acero ↔ Monel') + T(8, 406, 372, 560, 368, 'Liner bajo el packer') + T(14, 418, 386, 560, 394, 'Cemento del liner');
    o += T(12, 330, 396, 150, 380, 'Zapata y collares', 'izq') + N(560, 30, 'Fondo del mar') + N(560, 100, 'Entre tubos hay cemento') + N(150, 340, 'Packer y tubing', 'izq');
    return lienzo(o);
  };

  /* ============ 3 · Tubing ============ */
  E.tubing = function () {
    var cx = 360, o = R(0, 0, 720, 400, '', 'class="eq-anular"');
    o += espejo(cx, R(250, 0, 14, 400, MV, 'opacity=".5"') + R(236, 0, 14, 400, CEM, 'opacity=".5"'));
    o += R(cx - 16, 0, 32, 400, '', 'class="eq-gasfondo"');
    o += P(0, espejo(cx, S(cx - 22, 40, 6, 322, CV) + S(cx - 26, 118, 10, 14, CV) + S(cx - 26, 250, 10, 14, CV)));
    o += P(7, espejo(cx, PA('M264,8 h78 v36 h-22 l-12,10 h-44 Z', MV, 'class="s"') + R(338, 8, 6, 36, CV)));
    o += P(3, espejo(cx, S(cx - 31, 150, 15, 46, CV) + R(cx - 31, 162, 15, 4, '#1d2125') + R(cx - 31, 172, 15, 4, '#1d2125') + R(cx - 31, 182, 15, 4, '#1d2125')));
    o += P(1, espejo(cx, PA('M' + (cx - 29) + ',214 h13 v8 l5,4 v6 l-5,4 v6 h-13 Z', CV, 'class="s"')));
    o += P(4, espejo(cx, S(cx - 30, 276, 14, 40, CV)) + S(cx + 30, 282, 18, 28, DV, 'rx="4"'));
    o += P(5, PA('M' + (cx + 40) + ',0 V282', 'none', 'class="eq-cable s"'));
    o += P(6, S(cx - 30, 92, 76, 9, MH, 'rx="3"') + S(cx - 30, 232, 76, 9, MH, 'rx="3"'));
    o += P(2, espejo(cx, PA('M' + (cx - 22) + ',362 h6 v22 l-14,14 h-6 l14,-18 Z', CV, 'class="s"')));
    o += flujo('M360,400 V-10', 5, 4, null);
    o += T(7, 290, 26, 150, 26, 'Colgador de tubing', 'izq') + T(0, 340, 80, 150, 80, 'Tubing de 4½ in', 'izq') + T(3, 330, 172, 150, 172, 'Camisa deslizable', 'izq') + T(1, 332, 226, 150, 240, 'Niple de asiento', 'izq') + T(2, 336, 380, 150, 372, 'Guía de wireline', 'izq');
    o += T(5, 400, 50, 560, 50, 'Cable del sensor') + T(6, 404, 96, 560, 110, 'Abrazaderas') + T(4, 399, 296, 560, 296, 'Mandril del sensor');
    o += N(560, 200, 'Anular: fluido de empaque') + N(560, 380, 'El gas sube por dentro');
    return lienzo(o);
  };

  /* ============ VS · Válvula de seguridad del tubing ============ */
  E.sssv = function () {
    var cx = 360, o = R(0, 0, 720, 400, '', 'class="eq-anular"');
    o += R(cx - 36, 0, 72, 400, '', 'class="eq-gasfondo"');
    o += P(0, espejo(cx, PA('M' + (cx - 44) + ',0 h8 v40 h-34 v300 h34 v60 h-8 v-40 h-40 v-340 h40 Z', CV, 'class="s"') + S(cx - 36, 70, 7, 150, CV)));
    o += '<path class="eq-resorte" d="M' + (cx - 66) + ',96 ' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return 'l34,7 l-34,7'; }).join(' ') + '"/>' +
         '<path class="eq-resorte" d="M' + (cx + 66) + ',96 ' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return 'l-34,7 l34,7'; }).join(' ') + '"/>';
    o += P(1, espejo(cx, S(cx - 38, 60, 9, 10, HULE) + S(cx - 38, 220, 9, 10, PEEK)) + S(cx - 36, 262, 72, 5, PEEK));
    o += P(0, '<g class="eq-flapper">' + S(cx - 36, 250, 72, 12, CH, 'rx="3"') + '</g>' + C(cx + 38, 256, 6, '#30373d', 'class="s"'));
    o += P(2, PA('M' + (cx + 96) + ',0 V84 h-18', 'none', 'class="eq-cable s"') + S(cx + 60, 74, 18, 20, MV, 'rx="2"'));
    o += flujo('M360,400 V-10', 5, 4.5, null);
    o += T(0, 432, 180, 560, 180, 'Cuerpo y tubo de flujo') + T(0, 380, 256, 560, 262, 'Flapper: la tapa que cierra') + T(2, 456, 40, 560, 40, 'Línea de control hidráulico');
    o += T(1, 326, 65, 250, 65, 'Sellos', 'izq') + N(250, 150, 'Resorte: la cierra si se', 'izq') + N(250, 168, 'pierde la presión de control', 'izq') + N(250, 330, 'Se cierra sola en', 'izq') + N(250, 348, 'una emergencia', 'izq');
    return lienzo(o);
  };

  /* ============ 4 · Packer ============ */
  E.packer = function () {
    var cx = 360, o = R(0, 0, 720, 290, '', 'class="eq-anular"') + R(0, 290, 720, 110, '', 'class="eq-gasfondo"');
    o += R(0, 0, 216, 400, ROCA) + R(504, 0, 216, 400, ROCA) + espejo(cx, R(216, 0, 16, 400, CEM) + R(232, 0, 14, 400, MV));
    o += R(cx - 22, 0, 44, 400, '', 'class="eq-gasfondo"');
    o += P(0, espejo(cx, S(cx - 30, 10, 8, 384, MV)));
    o += P(6, espejo(cx, PA('M' + (cx - 58) + ',6 h28 v30 h-20 Z', CV, 'class="s"')));
    o += P(1, espejo(cx, S(cx - 62, 40, 32, 54, CV)));
    o += P(7, espejo(cx, C(cx - 31, 52, 4.5, HULE, 'class="s"') + C(cx - 31, 80, 4.5, HULE, 'class="s"')));
    o += P(4, espejo(cx, PA('M246,100 l8,6 l-8,6 l8,6 l-8,6 l8,6 l-8,6 l8,6 l-8,6 v0 h40 l-14,-48 Z', DV, 'class="s"')));
    o += P(5, espejo(cx, PA('M272,100 h58 v48 h-44 Z', MV, 'class="s"') + PA('M246,296 l8,6 l-8,6 l8,6 l-8,6 l8,6 l-8,6 h84 v-36 Z', MV, 'class="s"')));
    o += P(3, espejo(cx, S(248, 154, 82, 8, PEEK) + S(248, 282, 82, 8, PEEK)));
    o += P(2, '<g class="eq-goma">' + espejo(cx, S(246, 164, 84, 36, HULE, 'rx="10"') + S(246, 204, 84, 36, HULE, 'rx="10"') + S(246, 244, 84, 36, HULE, 'rx="10"')) + '</g>');
    o += flujo('M360,400 V-10', 5, 4.5, null);
    o += T(6, 318, 20, 170, 20, 'Ensamble de sellos y ancla', 'izq') + T(1, 300, 66, 170, 66, 'Cuerpo', 'izq') + T(4, 262, 124, 170, 124, 'Cuñas: muerden el casing', 'izq') + T(3, 262, 158, 170, 170, 'Anillos antiextrusión', 'izq') + T(2, 262, 222, 170, 222, 'Gomas de sello', 'izq');
    o += T(7, 391, 52, 550, 52, 'O-rings') + T(0, 386, 200, 550, 200, 'Mandril') + T(5, 440, 314, 550, 314, 'Cuñas y conos');
    o += N(550, 110, 'Arriba: anular sin gas') + N(550, 370, 'Abajo: gas del pozo');
    return lienzo(o);
  };

  /* ============ 5 · Cabezal de pozo ============ */
  E.cabezal = function () {
    var cx = 260, o = AGUA(0, 300) + R(0, 300, 720, 100, SUELO);
    o += espejo(cx, R(cx - 104, 300, 12, 100, MV) + R(cx - 92, 300, 30, 100, CEM));
    o += R(cx - 30, 110, 60, 290, '', 'class="eq-gasfondo"');
    o += P(0, espejo(cx, PA('M' + (cx - 30) + ',110 h-44 v34 h-22 v156 h66 Z', MV, 'class="s"') + R(cx - 34, 110, 5, 190, CV)) + R(cx + 30, 205, 66, 30, '', 'class="eq-gasfondo"'));
    o += espejo(cx, R(cx - 62, 300, 8, 100, MV) + R(cx - 44, 240, 8, 160, MV) + PA('M' + (cx - 54) + ',236 h24 v14 Z', DV));
    // válvula lateral
    o += R(356, 205, 240, 30, '', 'class="eq-gasfondo"') + R(356, 198, 60, 7, MH) + R(356, 235, 60, 7, MH);
    o += P(0, PA('M416,180 h30 v25 h-30 Z M416,235 h30 v25 h-30 Z M506,180 h30 v25 h-30 Z M506,235 h30 v25 h-30 Z M446,252 h60 v14 h-60 Z', MV, 'class="s"'));
    o += P(1, PA('M440,180 h72 v-14 h-14 v-36 h-44 v36 h-14 Z', MV, 'class="s"'));
    o += P(2, S(472, 70, 8, 128, CV));
    o += P(5, S(462, 136, 28, 14, '#e6e8e3', 'rx="2"'));
    o += P(4, S(446, 198, 16, 44, CV) + S(490, 198, 16, 44, CV));
    o += P(3, '<g class="eq-compuerta">' + S(462, 190, 28, 60, DV, 'rx="2"') + '</g>');
    o += R(452, 56, 48, 16, YH, 'rx="4"') + R(536, 198, 60, 7, MH) + R(536, 235, 60, 7, MH) + R(596, 186, 14, 68, MV);
    o += flujo('M260,400 V224 Q260,220 270,220 H440', 5, 5, null);
    o += T(0, 180, 200, 150, 170, 'Cuerpo del cabezal', 'izq') + T(1, 500, 150, 590, 120, 'Bonete') + T(2, 476, 90, 590, 86, 'Vástago') + T(5, 488, 143, 590, 150, 'Empaque del vástago');
    o += T(3, 476, 244, 560, 300, 'Compuerta') + T(4, 454, 238, 410, 300, 'Asientos', 'izq') + N(14, 330, 'Fondo del mar') + N(14, 60, 'Sostiene y sella') + N(14, 78, 'todos los tubos del pozo');
    return lienzo(o);
  };

  /* ============ 6 · Árbol submarino ============ */
  E.arbol = function () {
    var o = AGUA(0, 340) + R(0, 340, 720, 60, SUELO);
    o += R(150, 60, 14, 280, YV) + R(556, 60, 14, 280, YV) + R(130, 322, 460, 18, YH, 'rx="3"') + R(150, 60, 420, 10, YH, 'rx="3"');
    o += R(320, 322, 80, 78, MV) + R(344, 110, 32, 290, '', 'class="eq-gasfondo"') + R(376, 186, 220, 28, '', 'class="eq-gasfondo"');
    o += P(0, PA('M290,120 h54 v202 h-54 Z M376,120 h54 v66 h-54 Z M376,214 h54 v108 h-54 Z', MV, 'class="s"') + PA('M430,168 h18 v18 h-18 Z M430,214 h18 v18 h-18 Z M488,168 h36 v18 h-36 Z M488,214 h36 v18 h-36 Z', MV, 'class="s"'));
    o += R(300, 96, 120, 24, YH, 'rx="4"') + R(524, 180, 76, 6, MH) + R(524, 214, 76, 6, MH) + R(600, 172, 14, 56, MV);
    o += P(1, S(196, 166, 88, 36, YH, 'rx="6"') + S(196, 240, 88, 36, YH, 'rx="6"') + S(450, 92, 36, 70, YV, 'rx="6"'));
    o += P(2, S(280, 180, 70, 8, CH) + S(280, 254, 70, 8, CH) + S(464, 160, 8, 34, CV));
    o += P(5, S(284, 174, 10, 20, PEEK) + S(284, 248, 10, 20, PEEK) + S(458, 162, 20, 8, PEEK));
    o += P(4, S(340, 166, 40, 6, CH) + S(340, 196, 40, 6, CH) + S(340, 240, 40, 6, CH) + S(340, 270, 40, 6, CH) + S(448, 182, 6, 36, CV) + S(482, 182, 6, 36, CV));
    o += P(3, S(346, 174, 12, 20, DV) + '<g class="eq-compuerta lado">' + S(346, 248, 28, 20, DV) + '</g>' + S(456, 192, 24, 10, DV));
    o += P(6, S(206, 104, 56, 30, DV, 'rx="4"') + PA('M234,134 V166 M246,134 V230 h-10 V240 M262,118 H450', 'none', 'class="eq-cable s"'));
    o += flujo('M360,400 V208 Q360,200 370,200 H610', 6, 5, null);
    o += T(6, 220, 110, 146, 90, 'Conector de control', 'izq') + T(1, 210, 184, 146, 170, 'Actuadores y bonetes', 'izq') + T(2, 300, 258, 146, 240, 'Vástagos', 'izq') + T(5, 289, 262, 146, 300, 'Sellos de vástago', 'izq');
    o += T(0, 410, 290, 600, 300, 'Bloque del árbol') + T(3, 360, 258, 600, 270, 'Compuertas') + T(4, 485, 200, 600, 130, 'Asientos') + N(620, 200, 'Al jumper →') + N(600, 40, 'Pintado de amarillo para', 'izq') + N(600, 56, 'que lo vea el robot submarino', 'izq');
    return lienzo(o);
  };

  /* ============ 7 · Válvula maestra: cuerpo y bonete ============ */
  E.vmaestra = function () {
    var o = AGUA(0, 400);
    o += R(40, 222, 640, 56, MH) + R(40, 232, 640, 36, '', 'class="eq-gasfondo"');
    o += P(0, PA('M250,160 h220 v180 h-220 Z', MV, 'class="s"') + S(214, 190, 22, 120, MV) + S(484, 190, 22, 120, MV) + S(236, 206, 14, 88, MV) + S(470, 206, 14, 88, MV));
    o += R(190, 190, 22, 120, MV) + R(508, 190, 22, 120, MV);
    [198, 290].forEach(function (y) { o += R(182, y, 56, 10, DH, 'rx="2"') + R(482, y, 56, 10, DH, 'rx="2"'); });
    // ventana en corte: se ve el overlay y el gas
    o += R(276, 226, 168, 48, '#eef3f6', 'class="s"') + R(276, 232, 168, 36, '', 'class="eq-gasfondo"');
    o += P(1, S(262, 144, 196, 18, MH, 'rx="2"') + PA('M300,144 v-54 q60,-26 120,0 v54 Z', MV, 'class="s"'));
    [276, 316, 396, 436].forEach(function (x) { o += R(x, 134, 10, 34, DV, 'rx="2"'); });
    o += R(352, 40, 16, 60, CV) + R(318, 14, 84, 34, YH, 'rx="8"') + '<g class="eq-compuerta">' + R(338, 216, 44, 70, DV, 'rx="3" opacity=".85"') + '</g>';
    o += flujo('M40,250 H680', 6, 4, null);
    o += T(0, 290, 320, 180, 360, 'Cuerpo', 'izq') + T(1, 400, 110, 540, 90, 'Bonete') + N(540, 30, 'Actuador') + N(540, 360, 'Franja clara: overlay de Alloy 625') + N(540, 378, 'Es lo único que toca el gas');
    o += '<path class="eq-guia" d="M440,229 L536,356"/>';
    return lienzo(o);
  };

  /* ============ 8 · Espárragos y tuercas ============ */
  E.esparragos = function () {
    var o = R(0, 0, 720, 400, '', 'class="eq-cielo"') + AGUA(330, 400) + olas(332, 0, 720) + olas(350, -20, 720);
    // vista de frente
    o += C(190, 190, 120, MV) + C(190, 190, 62, '#6d7880') + C(190, 190, 42, '', 'class="eq-gasfondo"');
    var tuercas = '', puntas = '';
    for (var k = 0; k < 12; k++) {
      var a = k * Math.PI / 6, x = 190 + 92 * Math.cos(a), y = 190 + 92 * Math.sin(a), hex = '';
      for (var j = 0; j < 6; j++) hex += (j ? ' L' : 'M') + (x + 15 * Math.cos(j * Math.PI / 3)).toFixed(1) + ',' + (y + 15 * Math.sin(j * Math.PI / 3)).toFixed(1);
      tuercas += PA(hex + ' Z', CV, 'class="s"');
      puntas += C(x.toFixed(1), y.toFixed(1), 7, CH, 'class="s"');
    }
    o += P(1, tuercas) + P(0, puntas);
    // vista de lado
    o += R(380, 168, 300, 44, MH) + R(380, 176, 300, 28, '', 'class="eq-gasfondo"');
    o += R(486, 70, 34, 240, MV) + R(528, 70, 34, 240, MV) + R(520, 70, 8, 240, DV) + R(470, 150, 16, 80, MV) + R(562, 150, 16, 80, MV);
    var varillas = '', tu = '';
    [92, 128, 252, 288].forEach(function (y) {
      varillas += S(446, y - 5, 156, 10, CH);
      for (var x = 448; x < 600; x += 6) varillas += '<path d="M' + x + ',' + (y - 5) + ' l3,10" stroke="#5f6f7a" stroke-width="1"/>';
      tu += S(462, y - 11, 24, 22, CV, 'rx="2"') + S(562, y - 11, 24, 22, CV, 'rx="2"');
    });
    o += P(0, varillas) + P(1, tu);
    for (var g = 0; g < 7; g++) o += '<circle class="eq-gota" cx="' + (420 + g * 40) + '" cy="330" r="3" style="--r:-' + (g * 0.37).toFixed(2) + 's"/>';
    o += T(0, 600, 92, 640, 60, 'Espárragos') + T(1, 574, 288, 640, 300, 'Tuercas') + N(190, 340, 'Brida vista de frente', 'cen') + N(524, 50, 'Brida vista de lado', 'cen') + N(20, 388, 'Zona de salpicadura: agua de mar y aire');
    return lienzo(o);
  };

  /* ============ 9 · Trim de la válvula maestra ============ */
  E.trim = function () {
    var o = R(0, 0, 720, 400, '', 'class="eq-seco"');
    o += PA('M60,196 H296 V110 H322 V60 H398 V110 H424 V196 H660 V284 H424 V350 H296 V284 H60 Z', '', 'class="eq-fantasma"');
    o += R(60, 214, 600, 52, '', 'class="eq-gasfondo"') + R(322, 110, 76, 240, '', 'class="eq-hueco"');
    o += P(1, S(296, 204, 24, 72, CV) + S(400, 204, 24, 72, CV));
    o += P(2, S(320, 204, 6, 72, '#3c4650') + S(394, 204, 6, 72, '#3c4650'));
    o += '<g class="eq-compuerta lento">' + P(0, S(353, -30, 14, 190, CV)) +
         P(3, PA('M326,158 h68 v176 h-68 Z M360,214 a26,26 0 1 0 0.1,0 Z', DV, 'class="s" fill-rule="evenodd"')) + '</g>';
    o += flujo('M60,240 H660', 6, 4, null);
    o += T(0, 367, 90, 500, 70, 'Vástago: sube y baja la compuerta') + T(3, 384, 320, 500, 340, 'Compuerta con su agujero de paso') + T(2, 397, 208, 500, 150, 'Caras de sellado (Stellite 6)') + T(1, 308, 270, 200, 330, 'Asientos', 'izq');
    o += N(200, 100, 'Vista por dentro de la válvula', 'izq') + N(200, 118, 'El cuerpo se ve transparente', 'izq');
    return lienzo(o);
  };

  /* ============ 10 · Jumper / manifold ============ */
  E.jumper = function () {
    var o = AGUA(0, 330) + R(0, 330, 720, 70, SUELO);
    o += R(50, 210, 100, 120, YV, 'rx="4"') + R(40, 320, 120, 12, YH) + R(550, 240, 150, 90, YV, 'rx="4"') + R(540, 320, 170, 12, YH);
    var d = 'M100,196 V100 Q100,84 116,84 H224 Q240,84 240,100 V250 Q240,266 256,266 H464 Q480,266 480,250 V112 Q480,96 496,96 H604 Q620,96 620,112 V226';
    o += P(0, '<path d="' + d + '" class="eq-tubo s"/><path d="' + d + '" class="eq-brillo"/>');
    o += P(1, S(80, 184, 40, 30, DV, 'rx="3"') + S(76, 196, 48, 6, MH) + S(600, 214, 40, 30, DV, 'rx="3"') + S(596, 226, 48, 6, MH));
    o += P(2, S(88, 210, 24, 4, CH) + S(608, 240, 24, 4, CH));
    o += flujo(d, 7, 7, null);
    // lupa con el corte de la pared
    o += '<path class="eq-guia" d="M360,266 L360,216"/>';
    o += P(0, C(360, 162, 54, MV, 'class="s"') + C(360, 162, 41, '#eef3f6') + C(360, 162, 33, '', 'class="eq-gasfondo"'));
    o += N(360, 30, 'Corte de la tubería:', 'cen') + N(360, 48, 'acero X65 por fuera, capa de', 'cen') + N(360, 66, 'Alloy 625 por dentro y gas en el centro', 'cen');
    o += T(0, 240, 180, 180, 160, 'Tubería del jumper', 'izq') + T(1, 122, 190, 200, 228, 'Conectores') + T(2, 632, 242, 600, 290, 'Sellos metálicos', 'izq') + N(100, 360, 'Árbol', 'cen') + N(625, 360, 'Manifold', 'cen');
    return lienzo(o);
  };

  /* ============ 11 · Flowline ============ */
  E.flowline = function () {
    var o = AGUA(0, 292) + R(0, 292, 720, 108, SUELO);
    o += R(0, 196, 220, 100, '#2b3136') + R(0, 196, 220, 14, '#3d454c') + R(86, 190, 46, 112, '#aeb6ba', 'rx="4"');
    o += P(0, S(220, 204, 210, 84, MH) + S(430, 214, 150, 64, CH));
    o += R(580, 220, 140, 52, '', 'class="eq-gasfondo"') + PA('M580,214 q-10,32 0,64', 'none', 'stroke="#6c7c87" stroke-width="2"');
    o += flujo('M440,246 H730', 6, 3.5, null);
    o += C(590, 96, 70, '#2b3136') + P(0, C(590, 96, 58, MV, 'class="s"') + C(590, 96, 44, '#eef3f6', 'class="s"')) + C(590, 96, 36, '', 'class="eq-gasfondo"');
    o += T(0, 320, 216, 300, 150, 'Tubería de acero X65', 'izq') + T(0, 500, 222, 470, 172, 'Revestimiento interno de Alloy 625', 'izq');
    o += N(110, 180, 'Ánodo de sacrificio', 'cen') + N(60, 330, 'Recubrimiento exterior') + N(590, 20, 'Corte de la tubería', 'cen') + N(700, 330, 'A tierra →', 'izq') + N(20, 30, 'Tendida sobre el fondo del mar');
    return lienzo(o);
  };

  /* ============ MEG · Sistema de inyección ============ */
  E.meg = function () {
    var o = AGUA(0, 400), cx = 180, cy = 200, k, a;
    o += P(2, C(cx, cy, 150, '#2f3a41', 'class="s"')) + C(cx, cy, 134, '#aab3b8');
    var hilos = '';
    for (k = 0; k < 44; k++) { a = k * 2 * Math.PI / 44; hilos += C((cx + 124 * Math.cos(a)).toFixed(1), (cy + 124 * Math.sin(a)).toFixed(1), 7.5, MV, k % 4 === 0 ? 'class="s"' : ''); }
    o += P(3, hilos) + C(cx, cy, 112, '#59646b');
    var tubos = '';
    for (k = 0; k < 5; k++) { a = -Math.PI / 2 + k * 2 * Math.PI / 5; var x = (cx + 68 * Math.cos(a)).toFixed(1), y = (cy + 68 * Math.sin(a)).toFixed(1); tubos += C(x, y, 30, CV, 'class="s"') + C(x, y, 21, '', 'class="eq-megfondo"'); }
    o += P(1, tubos) + C(cx, cy, 24, MV) + C(cx, cy, 16, '#6aa3c9');
    // llegada al árbol
    o += R(400, 300, 320, 50, MH) + R(400, 310, 320, 30, '', 'class="eq-gasfondo"');
    var linea = 'M330,140 H430 M480,140 H580 V310';
    o += '<path d="' + linea + '" class="eq-tubito"/>';
    o += P(4, S(420, 112, 66, 56, DV, 'rx="5"') + R(430, 124, 46, 6, YH) + R(430, 148, 46, 6, YH));
    o += P(0, S(560, 170, 40, 34, CV, 'rx="4"') + R(556, 182, 48, 8, MH));
    o += P(5, PA('M562,236 h36 v40 h-36 Z', MV, 'class="s"') + C(580, 258, 9, '#eef3f6') + PA('M568,244 h24 l-8,8 h-8 Z', '#2b3136'));
    o += flujo('M400,325 H720', 5, 4, null) + flujo('M486,140 H580 V320 H720', 5, 5, 'eq-megp') + flujo('M340,140 H424', 2, 2, 'eq-megp');
    o += T(2, 76, 92, 60, 40, 'Cubierta de polietileno') + T(3, 300, 180, 330, 80, 'Armadura de alambres') + T(1, 180, 132, 330, 50, 'Tubos del umbilical (llevan el MEG)');
    o += T(4, 453, 114, 500, 80, 'Terminación del umbilical') + T(0, 560, 187, 540, 196, 'Conector al árbol', 'izq') + T(5, 562, 256, 540, 250, 'Válvula de retención', 'izq');
    o += N(180, 380, 'Umbilical cortado: así es por dentro', 'cen') + N(710, 376, 'Gas del pozo + MEG →', 'izq') + N(534, 270, 'Deja entrar el MEG,', 'izq') + N(534, 286, 'no deja salir el gas', 'izq');
    return lienzo(o);
  };

  /* ============ 12 · Válvula de llegada ============ */
  E.llegada = function () {
    var o = R(0, 0, 720, 320, '', 'class="eq-cielo"') + R(0, 290, 120, 30, '', 'class="eq-agua"') + R(0, 320, 720, 80, SUELO) + PA('M0,320 q60,-34 130,0 Z', SUELO);
    // planta al fondo
    o += '<g class="eq-planta">' + R(610, 150, 26, 170) + R(646, 100, 20, 220) + R(676, 190, 44, 130, '', 'rx="20"') + R(600, 300, 120, 20) + PA('M656,100 v-26 M650,74 h12', 'none', 'stroke-width="3"') + '</g>';
    var tubo = 'M40,420 V270 Q40,240 70,240 H720';
    o += '<path d="' + tubo + '" class="eq-tubo"/><path d="' + tubo + '" class="eq-brillo"/>';
    o += R(150, 256, 12, 64, MV) + R(470, 256, 12, 64, MV) + R(140, 316, 32, 6, DH) + R(460, 316, 32, 6, DH);
    // válvula de bola en corte
    o += P(0, S(236, 186, 22, 108, MV) + S(422, 186, 22, 108, MV) + S(258, 210, 22, 60, MV) + S(400, 210, 22, 60, MV) + C(340, 240, 68, MV, 'class="s"') + PA('M318,176 h44 v-30 h-44 Z', MV, 'class="s"'));
    o += R(212, 186, 22, 108, MV) + R(446, 186, 22, 108, MV);
    [196, 274].forEach(function (y) { o += R(204, y, 60, 10, DH, 'rx="2"') + R(416, y, 60, 10, DH, 'rx="2"'); });
    o += C(340, 240, 52, '#eef3f6') + R(258, 224, 164, 32, '', 'class="eq-gasfondo"');
    o += P(1, S(282, 212, 12, 56, CV, 'rx="3"') + S(386, 212, 12, 56, CV, 'rx="3"') + '<g class="eq-bola">' + PA('M340,198 a42,42 0 1 0 0.1,0 Z M298,226 h84 v28 h-84 Z', CV, 'class="s" fill-rule="evenodd"') + '</g>' + S(334, 150, 12, 50, CV));
    o += R(304, 84, 72, 66, YV, 'rx="8"') + R(296, 104, 88, 10, YH, 'rx="3"') + R(320, 70, 40, 16, DH, 'rx="3"');
    // junta de aislamiento eléctrico
    o += R(520, 192, 20, 96, MV) + R(550, 192, 20, 96, MV);
    o += P(2, S(540, 186, 10, 108, '#c98a2b') + S(514, 198, 62, 9, '#c98a2b', 'rx="2"') + S(514, 273, 62, 9, '#c98a2b', 'rx="2"'));
    o += P(3, S(538, 218, 14, 6, HULE) + S(538, 256, 14, 6, HULE));
    o += R(508, 196, 8, 13, DV) + R(574, 196, 8, 13, DV) + R(508, 271, 8, 13, DV) + R(574, 271, 8, 13, DV);
    o += '<path class="eq-limite" d="M545,40 V180 M545,300 V392"/>' + '<path class="eq-chispa" d="M604,138 l-10,16 h10 l-8,16"/>';
    o += flujo(tubo, 8, 7, null);
    o += T(0, 290, 286, 250, 356, 'Cuerpo y extremos', 'izq') + T(1, 372, 216, 404, 150, 'Trim: bola, asientos y vástago') + T(2, 545, 190, 560, 70, 'Junta aislante eléctrica') + T(3, 545, 259, 590, 356, 'Sellos de la junta');
    o += N(292, 120, 'Actuador', 'izq') + N(538, 30, '← Sistema B1', 'izq') + N(552, 30, 'Planta B2 →') + N(16, 216, 'Llega del mar') + N(250, 376, 'NPS 8, clase 2500 · API 6D', 'izq') + N(616, 150, 'Corta la corriente') + N(616, 166, 'de los ánodos');
    return lienzo(o);
  };

  /* Devuelve el dibujo del componente, o cadena vacía si no hay */
  B1.dibujarEquipo = function (id) { return E[id] ? E[id]() : ''; };
})();
