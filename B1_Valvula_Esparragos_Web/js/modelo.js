/* =====================================================================
   modelo.js — Reglas de evaluación y selección de material
   ---------------------------------------------------------------------
   No dibuja nada. Recibe condiciones y devuelve, para cada material:
     - su estado
     - CÓMO falla y POR QUÉ, en lenguaje sencillo
     - el detalle técnico con la norma
   Estados:
     'ok'   -> Resiste
     'cond' -> En riesgo (se está gastando o falta un ensayo que lo confirme)
     'no'   -> Falla
     'na'   -> No toca el gas en esta condición
   Modos de falla (los usa la animación):
     'grieta' | 'adelgaza' | 'pica' | 'endurece' | 'deshace' | 'oxida' | null
   ===================================================================== */
var B1 = globalThis.B1 || (globalThis.B1 = {});

B1.textoEstado = { ok: 'Resiste', cond: 'En riesgo', no: 'Falla', na: 'No toca el gas' };
var PESO = { na: 0, ok: 1, cond: 2, no: 3 };
B1.peso = PESO;

B1.peor = function (estados) {
  var p = 'na';
  estados.forEach(function (e) { if (PESO[e] > PESO[p]) p = e; });
  return p;
};
B1.num = function (v, dec) {
  return Number(v).toLocaleString('es-CO', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
};

/* ---------- Ambiente del pozo en un año dado ------------------------- */
B1.ambiente = function (c, anio) {
  var conFormacion = anio >= c.anioIrrupcion;
  return {
    pH2S: c.pH2S * 100, pCO2: c.pCO2 * 100,    // kPa
    pH: c.pH, T: c.T,
    Cl: conFormacion ? c.clFormacion : 0,      // mg/l
    agua: conFormacion ? 'de formación' : 'condensada',
    anio: anio
  };
};

/* ---------- Región de severidad SSC (ISO 15156-2, figura 1) ----------
   Fronteras aproximadas con rectas (ver README).                       */
B1.regionSSC = function (pH2S, pH) {
  if (pH2S < 0.3) return 0;
  var lg = Math.log10(pH2S);
  var f23 = Math.min(5.5, Math.max(3.5, 3.5 + lg));
  var f12 = Math.min(6.5, 4.5 + lg);
  if (pH < f23) return 3;
  if (pH < f12) return 2;
  return 1;
};

/* ---------- Corrosión por CO2 en acero desnudo, mm/año ---------------
   de Waard, Lotz y Milliams (1991), con factor de película a alta T.   */
B1.tasaCO2 = function (T, pCO2kPa) {
  if (pCO2kPa <= 0) return 0;
  var K = T + 273.15, p = pCO2kPa / 100;
  var v = Math.pow(10, 5.8 - 1710 / K + 0.67 * Math.log10(p));
  var f = Math.min(1, Math.pow(10, 2400 / K - 0.6 * Math.log10(p) - 6.7));
  return v * f;
};

/* Descripción sencilla del ambiente, para los rótulos */
B1.describir = function (a) {
  var r = B1.regionSSC(a.pH2S, a.pH);
  return {
    gas: a.pH2S < 0.3 ? (a.pCO2 > 0 ? 'Gas dulce: solo CO₂' : 'Gas sin ácidos') :
         r === 3 ? 'Gas muy agrio' : r === 2 ? 'Gas agrio' : 'Gas poco agrio',
    agua: a.Cl > 0 ? 'Agua salada de formación' : 'Agua condensada, sin sal',
    acido: a.pH < 4 ? 'Agua muy ácida' : a.pH < 5.5 ? 'Agua ácida' : 'Agua poco ácida',
    calor: a.T >= 150 ? 'Muy caliente' : a.T >= 100 ? 'Caliente' : 'Tibio'
  };
};

/* ---------- ¿Qué toca cada capa? ------------------------------------- */
B1.exposicion = function (capa, c, esc, anio) {
  var a = B1.ambiente(c, anio);
  switch (capa.exp) {
    case 'produccion': return { ve: true, medio: 'gas', a: a, donde: 'La moja el gas del pozo' };
    case 'cemento':    return { ve: true, medio: 'gas', a: a, donde: 'En contacto con los fluidos de la formación' };
    case 'anular':
      if (esc.fugaAnular) return { ve: true, medio: 'gas', a: a, donde: 'Anular con fuga de gas' };
      return { ve: false, medio: 'anular', donde: 'En el anular, sobre el packer', porque: 'Está en el espacio anular, por encima del packer. Mientras el packer selle, el gas del pozo no llega hasta aquí.' };
    case 'respaldo':
      if (esc.defectoClad) return { ve: true, medio: 'gas', a: a, donde: 'Acero al descubierto por un defecto del revestimiento' };
      return { ve: false, medio: 'cubierto', donde: 'Debajo del revestimiento', porque: 'Está tapado por el revestimiento. Mientras este no tenga poros ni grietas, el gas no lo toca.' };
    case 'meg':
      if (esc.retroflujo) return { ve: true, medio: 'gas', a: a, donde: 'Línea de MEG con gas agrio devuelto' };
      return { ve: true, medio: 'meg', donde: 'La moja el MEG',
               a: { pH2S: 0, pCO2: 0, pH: 7, T: c.tLecho, Cl: 0, agua: 'MEG', anio: anio, soloMEG: true } };
    case 'externo': return { ve: true, medio: 'mar', externo: true, donde: 'Agua de mar o zona de salpicadura' };
    default:        return { ve: false, medio: 'fuera', donde: 'Fuera del camino del gas', porque: capa.porque || 'No toca el gas.' };
  }
};

/* ---------- Reglas por familia --------------------------------------- */
function L(mec, estado, modo, como, tec, extra) {
  var o = { mec: mec, estado: estado, modo: modo, como: como, tec: tec || '' };
  if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
  return o;
}

function textoLimites(m) {
  if (!m.limites) return '';
  if (m.limites.length === 1 && m.limites[0].T === Infinity && m.limites[0].pH2S === Infinity) return 'Sin límite de temperatura, H₂S, cloruros ni pH.';
  return m.limites.map(function (f) {
    var t = (f.T === Infinity ? 'cualquier T' : '≤ ' + f.T + ' °C') + ' con H₂S ≤ ' + (f.pH2S === Infinity ? 'sin límite' : B1.num(f.pH2S, f.pH2S < 100 ? 1 : 0) + ' kPa');
    if (f.Cl !== Infinity) t += ', Cl ≤ ' + B1.num(f.Cl) + ' mg/l';
    if (f.pH > 0) t += ', pH ≥ ' + B1.num(f.pH, 1);
    return t;
  }).join('; ') + '.';
}
B1.textoLimites = textoLimites;

/* ¿Qué variable saca al material de sus límites? */
function causaCRA(m, a) {
  var fT = m.limites.filter(function (f) { return a.T <= f.T; });
  if (!fT.length) return 'está demasiado caliente: ' + B1.num(a.T) + ' °C, y esta aleación solo está aceptada hasta ' + Math.max.apply(null, m.limites.map(function (f) { return f.T; })) + ' °C';
  var fH = fT.filter(function (f) { return a.pH2S <= f.pH2S; });
  if (!fH.length) return 'hay demasiado H₂S: ' + B1.num(a.pH2S) + ' kPa, y a esta temperatura solo admite ' + B1.num(Math.max.apply(null, fT.map(function (f) { return f.pH2S; })), 0) + ' kPa';
  var fC = fH.filter(function (f) { return a.Cl <= f.Cl; });
  if (!fC.length) return 'el agua tiene demasiada sal: ' + B1.num(a.Cl) + ' mg/l de cloruros, y solo admite ' + B1.num(Math.max.apply(null, fH.map(function (f) { return f.Cl; }))) + ' mg/l';
  return 'el agua es demasiado ácida: pH ' + B1.num(a.pH, 1) + ', y necesita al menos pH ' + B1.num(Math.min.apply(null, fC.map(function (f) { return f.pH; })), 1);
}

function evalCRA(m, a) {
  var out = [];
  var norma = m.ref + '. Límite cargado: ' + textoLimites(m) + ' ' + (m.req || '');
  if (a.pH2S <= 0) {
    out.push(L('Agrietamiento por H₂S', 'ok', null,
      a.soloMEG ? 'El MEG limpio no lleva gases ácidos: no hay nada que lo ataque.' : 'Sin H₂S no hay riesgo de agrietamiento.', norma));
  } else {
    var pasa = m.limites.some(function (f) { return a.T <= f.T && a.pH2S <= f.pH2S && a.Cl <= f.Cl && a.pH >= f.pH; });
    if (pasa) {
      out.push(L('Agrietamiento por H₂S', 'ok', null, 'Aguanta el H₂S a esta temperatura sin agrietarse.', norma));
    } else {
      out.push(L('Agrietamiento por H₂S', 'no', 'grieta',
        'Se agrieta. El H₂S debilita la capa que protege a esta aleación y, con la tensión de trabajo, se abren grietas que avanzan sin dar aviso. ' +
        'Aquí pasa porque ' + causaCRA(m, a) + '.', norma));
    }
    if (m.avisoAgrio) out.push(L('Desgaste en gas agrio', 'cond', 'adelgaza',
      'Puede irse adelgazando. El cobre del Monel reacciona con el H₂S húmedo y forma sulfuros que se desprenden. No hay un dato que diga cuánto pierde por año.',
      'ISO 15156-3 solo cubre agrietamiento, no pérdida de masa. Falta un ensayo de corrosión en estas condiciones.', { frac: 0.18 }));
  }
  if (m.tPractica && a.T > m.tPractica && a.pCO2 > 0) {
    out.push(L('Corrosión por CO₂', 'no', 'adelgaza',
      'Se adelgaza. Por encima de ' + m.tPractica + ' °C el CO₂ rompe la capa de óxido de cromo que protege a este acero y lo corroe.',
      'Límite práctico de uso del 13Cr en CO₂ (no es un límite de ISO 15156).', { frac: 0.6 }));
  }
  if (m.picable && a.Cl >= 1000 && a.T > 60 && !a.soloMEG) {
    out.push(L('Picaduras por sal', 'cond', 'pica',
      'Puede picarse. La sal del agua de formación (' + B1.num(a.Cl) + ' mg/l de cloruros) rompe la capa protectora en puntos pequeños y abre huecos, sobre todo en rendijas.',
      'Riesgo de picadura y corrosión en rendijas en inoxidables con PREN < 40. Validar con ensayo.'));
  }
  return out;
}

function evalAcero(m, a, c) {
  var out = [];
  var region = B1.regionSSC(a.pH2S, a.pH);

  if (region === 0) {
    out.push(L('Agrietamiento por H₂S', 'ok', null, 'Hay tan poco H₂S que no agrieta el acero.', m.ref + '. pH₂S menor que 0,3 kPa: fuera de servicio amargo.'));
  } else if (m.ssc === 'duro') {
    out.push(L('Agrietamiento por H₂S', 'no', 'grieta',
      'Se parte de golpe. Es un acero muy duro, y el H₂S mete hidrógeno dentro de los aceros duros y los vuelve quebradizos. Puede romperse en días.',
      m.ref + '. Supera 22 HRC en región ' + region + '. ISO 15156-1 (tabla 1) permite excluir las cuñas: confirmar si aplica.'));
  } else if (m.ssc === 'tmin') {
    out.push(L('Agrietamiento por H₂S', 'no', 'grieta',
      'Se agrieta cuando el pozo se enfría. Este grado solo aguanta el H₂S en caliente; en un cierre la temperatura baja y el hidrógeno lo vuelve quebradizo.',
      m.ref + '. Aceptado solo por encima de ' + m.tMin + ' °C.'));
  } else if (m.sinDureza) {
    out.push(L('Agrietamiento por H₂S', 'cond', 'grieta',
      'Puede agrietarse. La ficha no dice qué dureza tiene; si supera 22 HRC, el H₂S lo vuelve quebradizo.',
      m.ref + '. Región ' + region + ': exigir máx. 22 HRC y temple y revenido certificados.'));
  } else {
    out.push(L('Agrietamiento por H₂S', 'ok', null,
      'No se agrieta, siempre que se compre blando (máx. 22 HRC).',
      m.ref + '. Región ' + region + ': dureza máx. 22 HRC y tratamiento térmico certificados.' + (m.hic ? ' Producto laminado: pedir ensayo HIC (NACE TM0284).' : '')));
  }

  var libre = B1.tasaCO2(a.T, a.pCO2);
  var tasa = m.inhibidor ? 0.95 * Math.min(libre, 0.1) + 0.05 * libre : libre;
  if (tasa > 0) {
    var perdida = tasa * a.anio;
    var anioFalla = c.sobreespesor / tasa;
    var duraTodo = tasa * c.vida <= c.sobreespesor;
    var estado = perdida > c.sobreespesor ? 'no' : (duraTodo ? 'ok' : 'cond');
    var cuando = anioFalla < 1 ? 'en menos de un año' : 'hacia el año ' + Math.ceil(anioFalla);
    var como;
    if (estado === 'ok') {
      como = 'Se gasta muy despacio: unos ' + B1.num(tasa, 2) + ' mm por año. Los ' + B1.num(c.sobreespesor, 1) + ' mm de sobra alcanzan para los ' + c.vida + ' años.';
    } else {
      como = (estado === 'no' ? 'Ya se perforó. ' : 'Se está adelgazando. ') +
        'El CO₂ disuelto en el agua forma un ácido que se come el acero: unos ' + B1.num(tasa, 1) + ' mm por año' +
        (m.inhibidor ? ', incluso con inhibidor' : '') + '. Con ' + B1.num(c.sobreespesor, 1) + ' mm de sobra, la pared se acaba ' + cuando + '.' +
        (a.Cl > 0 ? ' El agua salada lo empeora en puntos.' : '');
    }
    out.push(L('Corrosión por CO₂', estado, estado === 'ok' ? null : 'adelgaza', como,
      'Modelo de de Waard, Lotz y Milliams (1991)' + (m.inhibidor ? ' con inhibidor al 95 % de disponibilidad' : ', sin inhibidor') +
      '. Acumulado al año ' + a.anio + ': ' + B1.num(perdida, 1) + ' mm.' +
      (a.pH2S > 0 && a.pCO2 / a.pH2S < 20 ? ' Con tanto H₂S la película de sulfuro cambia la velocidad real: el número es una cota.' : ''),
      { frac: Math.min(1, perdida / c.sobreespesor), anioFalla: anioFalla }));
  }
  return out;
}

function evalRecargue(m, a) {
  if (a.pH2S <= 0 && a.Cl <= 0) return [L('Compatibilidad', 'ok', null, 'Sin H₂S ni sal no hay nada que lo ataque.', m.ref)];
  return [L('Capa dura sin respaldo de norma', 'cond', 'pica',
    'No se sabe cuánto aguanta. Es una capa muy dura para que la válvula selle, pero la norma no dice hasta qué nivel de H₂S resiste. Si se ataca, se pica o se desprende y la válvula deja de sellar.',
    m.ref + '. Sin límites ambientales tabulados: se acepta por ensayo o experiencia documentada del fabricante.')];
}

function evalPolimero(m, a) {
  var out = [];
  var norma = m.ref + '. Uso continuo hasta ' + m.tOk + ' °C; máximo ' + m.tMax + ' °C (valores guía de fabricantes).';
  if (m.rigido && a.T > m.tOk) out.push(L('Calor', a.T > m.tMax ? 'no' : 'cond', 'ablanda',
    (a.T > m.tMax ? 'Se ablanda y se aplasta. ' : 'Está cerca de su límite. ') + 'A ' + B1.num(a.T) + ' °C la resina de este laminado pierde rigidez (su máximo es ' + m.tMax +
    ' °C). Con el apriete de los pernos la junta cede, fuga y puede dejar de aislar eléctricamente.', norma));
  else if (a.T > m.tMax) out.push(L('Calor', 'no', 'endurece',
    'Se quema. A ' + B1.num(a.T) + ' °C el material se endurece, se agrieta y deja de sellar. Su máximo es ' + m.tMax + ' °C.', norma));
  else if (a.T > m.tOk) out.push(L('Calor', 'cond', 'endurece',
    'Envejece rápido. ' + B1.num(a.T) + ' °C está cerca de su límite (' + m.tMax + ' °C): se va endureciendo y puede no durar los 25 años.', norma));
  else out.push(L('Calor', 'ok', null, 'Aguanta bien ' + B1.num(a.T) + ' °C.', norma));

  if (a.pH2S >= 0.3) {
    if (m.h2s === 'mala') out.push(L('Ataque del H₂S', 'no', 'endurece',
      'Se endurece y se cuartea. El H₂S ataca este caucho en poco tiempo: pierde elasticidad y deja pasar el gas.', m.ref + '. No recomendado en gas agrio.'));
    else if (m.h2s === 'media') out.push(L('Ataque del H₂S', 'cond', 'endurece',
      'Se va endureciendo con los años. El H₂S lo vuelve rígido poco a poco; puede sellar al principio y fallar antes de los 25 años.',
      m.ref + '. Calificar con ensayo de envejecimiento a ' + B1.num(a.pH2S) + ' kPa de H₂S y extrapolar a la vida de diseño.'));
    else out.push(L('Ataque del H₂S', 'ok', null, 'El H₂S no lo ataca.', m.ref));
  }
  if (m.caucho && !a.soloMEG && a.pH2S + a.pCO2 > 0) {
    out.push(L('Descompresión rápida', 'ok', null,
      'Hay que comprarlo en grado resistente a descompresión: si no, el gas disuelto en el caucho lo ampolla cuando el pozo se despresuriza.',
      'ISO 23936-2, anexo B: calificación RGD para despresurizaciones de 15 bar/min.'));
  }
  return out;
}

function evalCemento(m, a) {
  var out = [];
  if (a.T > 110 && !m.silice) out.push(L('Calor', 'no', 'deshace',
    'Se debilita por el calor. Por encima de 110 °C el cemento Portland sin sílice cambia por dentro: pierde resistencia y se vuelve poroso.',
    m.producto + '. Retrogresión de resistencia: exige 35–40 % de sílice.'));
  else out.push(L('Calor', 'ok', null, m.silice ? 'La sílice evita que el calor lo debilite.' : 'A esta temperatura el calor no lo debilita.', m.producto));

  if (a.pCO2 > 0 || a.pH2S > 0) {
    if (m.resisteCO2) out.push(L('Ataque del gas ácido', 'ok', null, 'Está formulado para que el CO₂ y el agua ácida no lo disuelvan.', m.ref + '. Pedir el ensayo del proveedor.'));
    else out.push(L('Ataque del gas ácido', 'cond', 'deshace',
      'Se va deshaciendo de afuera hacia adentro. El CO₂ y el agua ácida (pH ' + B1.num(a.pH, 1) + ') disuelven la cal del cemento y lo dejan poroso; el avance crece con los años.' +
      (a.Cl > 0 ? ' El agua salada de formación lo acelera.' : ''),
      m.ref + '. "Resistente a sulfatos" no cubre CO₂ ni H₂S: exigir formulación y ensayo.'));
  }
  return out;
}

var EXTERNO = {
  N06625: ['ok', null, 'El agua de mar no la ataca.', 'ISO 21457. Aislar el contacto con el acero de la brida.'],
  N07718: ['cond', 'grieta', 'Puede agrietarse. La protección catódica produce hidrógeno, y esta aleación tan resistente lo absorbe y se vuelve quebradiza.', 'Riesgo de HISC en pernos de alta resistencia bajo protección catódica.'],
  L7:     ['cond', 'oxida', 'Se oxida. En la zona de salpicadura los ánodos no protegen y la pintura se daña con las olas.', 'ASTM A320 L7 / API 20E. Depende de recubrimiento y protección catódica; máx. 34 HRC.'],
  S32750: ['ok', null, 'Resiste el agua de mar. Hay que controlar la tensión para que el hidrógeno de los ánodos no lo agriete.', 'DNV-RP-F112 (HISC en dúplex bajo protección catódica).'],
  S31603: ['no', 'pica', 'Se pica. El 316L no aguanta el agua de mar: bajo la cubierta se forman picaduras que perforan el tubo.', 'El 316L no es resistente a agua de mar en rendijas.'],
  PE:     ['ok', null, 'El agua de mar fría no lo afecta.', 'ISO 13628-5.'],
  GALV:   ['cond', 'oxida', 'Se oxida si se rompe la cubierta. El zinc se gasta primero y luego el alambre de acero queda sin protección.', 'ISO 13628-5.'],
  X65:    ['ok', null, 'Por fuera lo protegen el recubrimiento y los ánodos.', 'DNV-RP-B401 / F103: diseño de protección catódica para 25 años.'],
  A4130:  ['ok', null, 'Por fuera lo protegen el recubrimiento y los ánodos.', 'DNV-RP-B401.']
};
function evalExterno(clave) {
  var e = EXTERNO[clave];
  if (!e) return L('Agua de mar', 'cond', 'oxida', 'No hay regla cargada para este material en agua de mar.', '');
  return L('Agua de mar', e[0], e[1], e[2], e[3]);
}

/* ---------- Evaluación de una capa con un material dado --------------- */
B1.evaluarCapa = function (capa, c, esc, anio, clave) {
  clave = clave || capa.mat;
  var m = B1.materiales[clave];
  var e = B1.exposicion(capa, c, esc, anio);
  var lineas;

  if (!e.ve) lineas = [L('Contacto con el gas', 'na', null, e.porque, '')];
  else if (e.externo) lineas = [evalExterno(clave)];
  else if (m.familia === 'cra') lineas = evalCRA(m, e.a);
  else if (m.familia === 'acero') lineas = evalAcero(m, e.a, c);
  else if (m.familia === 'recargue') lineas = evalRecargue(m, e.a);
  else if (m.familia === 'polimero') lineas = evalPolimero(m, e.a);
  else if (m.familia === 'cemento') lineas = evalCemento(m, e.a);
  else lineas = [L('Material', 'cond', null, 'El inventario no le asigna material, así que no se puede saber si aguanta.', m.ref)];

  if (capa.mar) lineas.push(evalExterno(clave));
  if (capa.aire) lineas.push(L('Aire marino de la costa', 'ok', null,
    'Por fuera lo protege la pintura. El aire salino de la costa obliga a revisarla y mantenerla.',
    'Ambiente atmosférico marino (informe B2). Sistema de pintura según ISO 12944, categoría C5.'));

  var estado = B1.peor(lineas.map(function (l) { return l.estado; }));
  var peores = lineas.filter(function (l) { return l.estado === estado; });
  // si hay varias causas igual de graves, manda la que tiene fecha (el desgaste)
  var peorLinea = peores.filter(function (l) { return l.anioFalla !== undefined; })[0] || peores[0];
  return {
    clave: clave, mat: m, capa: capa, rol: capa.rol, donde: e.donde, medio: e.medio, ve: e.ve,
    lineas: lineas, estado: estado, modo: peorLinea.modo,
    frac: peorLinea.frac === undefined ? (estado === 'no' ? 1 : 0.3) : peorLinea.frac,
    lado: (capa.mar && peorLinea.mec === 'Agua de mar') ? 'der' : 'izq'     // por dónde entra el daño
  };
};

/* elegidos: lista con el material elegido para cada capa (o nada = inventario) */
B1.evaluarPieza = function (pieza, c, esc, anio, elegidos) {
  var capas = pieza.capas.map(function (k, j) { return B1.evaluarCapa(k, c, esc, anio, elegidos && elegidos[j]); });
  return { pieza: pieza, capas: capas, estado: B1.peor(capas.map(function (k) { return k.estado; })) };
};

B1.evaluarComponente = function (comp, c, esc, anio, elegidosComp) {
  var piezas = comp.piezas.map(function (p, i) { return B1.evaluarPieza(p, c, esc, anio, elegidosComp && elegidosComp[i]); });
  return { comp: comp, piezas: piezas, estado: B1.peor(piezas.map(function (p) { return p.estado; })) };
};

B1.vidaPieza = function (pieza, c, esc, elegidos) {
  var v = [];
  for (var y = 0; y <= c.vida; y++) v.push(B1.evaluarPieza(pieza, c, esc, y, elegidos).estado);
  return v;
};

/* Peor estado de una capa en toda la vida y año en que empieza a fallar */
B1.vidaCapa = function (capa, c, esc, clave) {
  var peor = 'na', anioFalla = null;
  for (var y = 0; y <= c.vida; y++) {
    var e = B1.evaluarCapa(capa, c, esc, y, clave).estado;
    if (PESO[e] > PESO[peor]) peor = e;
    if (e === 'no' && anioFalla === null) anioFalla = y;
  }
  return { peor: peor, anioFalla: anioFalla };
};

/* ---------- Selección de material -------------------------------------
   Prueba todos los candidatos del grupo durante los 25 años y escoge
   el más barato entre los que mejor resisten.                          */
B1.recomendar = function (capa, c, esc) {
  if (!capa.grupo) return null;
  if (!B1.exposicion(capa, c, esc, 0).ve) return null;       // si no toca el gas, no hay nada que cambiar

  var claves = B1.grupos[capa.grupo].slice();
  if (claves.indexOf(capa.mat) < 0) claves.unshift(capa.mat);
  var lista = claves.map(function (k, i) {
    var v = B1.vidaCapa(capa, c, esc, k);
    return { clave: k, mat: B1.materiales[k], peor: v.peor, anioFalla: v.anioFalla, orden: i, inventario: k === capa.mat };
  });
  var orden = lista.slice().sort(function (x, y) {
    if (PESO[x.peor] !== PESO[y.peor]) return PESO[x.peor] - PESO[y.peor];
    if (x.peor === 'no' && x.anioFalla !== y.anioFalla) return y.anioFalla - x.anioFalla;   // el que falla más tarde
    if (x.mat.costo !== y.mat.costo) return x.mat.costo - y.mat.costo;
    if (x.inventario !== y.inventario) return x.inventario ? -1 : 1;
    return x.orden - y.orden;
  });
  var mejor = orden[0];
  var inv = lista.filter(function (x) { return x.inventario; })[0];

  var mensaje;
  if (mejor.inventario) mensaje = mejor.peor === 'ok' ? 'El material del inventario es el más adecuado.' : 'Ningún candidato resiste mejor que el del inventario.';
  else if (mejor.peor === 'no') mensaje = 'Ningún material de la lista resiste estas condiciones. ' + mejor.mat.corto + ' es el que más dura.';
  else if (PESO[inv.peor] > PESO[mejor.peor]) mensaje = mejor.mat.corto + ' es el material más económico que ' + (mejor.peor === 'ok' ? 'resiste los 25 años.' : 'queda solo en riesgo.');
  else mensaje = 'El del inventario resiste, pero ' + mejor.mat.corto + ' también y cuesta menos.';

  return { lista: lista, mejor: mejor.clave, mensaje: mensaje };
};

/* Materiales recomendados para todas las capas de un componente */
B1.recomendadosComp = function (comp, c, esc) {
  return comp.piezas.map(function (p) {
    return p.capas.map(function (k) { var r = B1.recomendar(k, c, esc); return r ? r.mejor : k.mat; });
  });
};

B1.anioCambio = function (comp, c, esc, elegidosComp) {
  var e0 = B1.evaluarComponente(comp, c, esc, 0, elegidosComp).estado;
  for (var y = 1; y <= c.vida; y++) {
    var e = B1.evaluarComponente(comp, c, esc, y, elegidosComp).estado;
    if (PESO[e] > PESO[e0]) return { anio: y, estado: e };
  }
  return null;
};

/* Frase corta de cómo falla una pieza (para titulares) */
var VERBO = { ablanda: 'se ablanda con el calor', grieta: 'se agrieta', adelgaza: 'se adelgaza', pica: 'se pica', endurece: 'se endurece y no sella', deshace: 'se deshace', oxida: 'se oxida' };
B1.titular = function (rp) {
  if (rp.estado === 'na') return 'No toca el gas';
  if (rp.estado === 'ok') return 'Resiste';
  var k = rp.capas.filter(function (x) { return x.estado === rp.estado; })[0];
  var verbo = k.mat.familia === 'pendiente' ? 'falta definir el material' : (VERBO[k.modo] || 'no está confirmado');
  return (rp.estado === 'no' ? 'Falla: ' : 'En riesgo: ') + verbo;
};
