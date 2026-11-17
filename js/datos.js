/* =====================================================================
   datos.js — Inventario B1 y base de materiales
   ---------------------------------------------------------------------
   Aquí está TODO lo que se puede editar sin tocar la lógica:
     1. B1.base        -> condiciones base del escenario
     2. B1.materiales  -> límites de servicio de cada material
     3. B1.componentes -> piezas del inventario (Tabla 4 del informe)

   IMPORTANTE: los límites de ISO 15156 se cargaron como referencia de
   trabajo. Antes de citarlos en el informe, confírmenlos contra la
   edición de la norma que tenga el equipo (ver README.md).
   ===================================================================== */
var B1 = globalThis.B1 || (globalThis.B1 = {});

/* ---------- 1. Condiciones base (Tablas 2, 6 y 7 del informe) -------- */
B1.base = {
  pH2S: 4.48,          // bar  (cierre en cabeza, 320 bar x 1,4 %)
  pCO2: 5.76,          // bar  (cierre en cabeza, 320 bar x 1,8 %)
  pH: 3.9,             // agua condensada
  T: 120,              // °C, temperatura máxima de trabajo
  anio: 0,             // año de servicio que se está mirando
  clFormacion: 28000,  // mg/l, agua de formación
  anioIrrupcion: 8,    // año desde el que llega el agua de formación
  sobreespesor: 3,     // mm, sobreespesor de corrosión para aceros
  tLecho: 4,           // °C, lecho marino (línea de MEG)
  vida: 25             // años de diseño
};

B1.presets = {
  cierre:    { pH2S: 4.48, pCO2: 5.76 },   // 320 bar
  operacion: { pH2S: 3.71, pCO2: 4.77 }    // 265 bar
};

/* ---------- 2. Materiales --------------------------------------------
   Cada material tiene:
     nombre, corto  -> nombre completo y nombre para los dibujos
     familia        -> 'acero' | 'cra' | 'recargue' | 'polimero' | 'cemento' | 'pendiente'
     costo          -> costo relativo de 1 (barato) a 10 (muy caro). Es orientativo.
     producto       -> norma con la que se compra el material
     ref            -> norma que fija su límite en servicio amargo
     limites (CRA)  -> filas {T °C, pH2S kPa, Cl mg/l, pH mínimo}. Pasa si cumple
                       AL MENOS una fila completa. Infinity = sin límite.
   --------------------------------------------------------------------- */
var INF = Infinity;
var LIBRE = [{ T: INF, pH2S: INF, Cl: INF, pH: 0 }];
var F_718 = [
  { T: 135, pH2S: INF,  Cl: INF, pH: 0 }, { T: 149, pH2S: 2800, Cl: INF, pH: 0 },
  { T: 191, pH2S: 2500, Cl: INF, pH: 0 }, { T: 199, pH2S: 2300, Cl: INF, pH: 0 },
  { T: 204, pH2S: 1400, Cl: INF, pH: 0 }, { T: 232, pH2S: 200,  Cl: INF, pH: 0 }
];
var F_4C = [   // Ni-Fe-Cr-Mo trabajadas en frío para tubulares (Alloy 28, 825)
  { T: 132, pH2S: INF,  Cl: INF, pH: 0 }, { T: 177, pH2S: 1400, Cl: INF, pH: 0 },
  { T: 204, pH2S: 1000, Cl: INF, pH: 0 }, { T: 218, pH2S: 700,  Cl: INF, pH: 0 },
  { T: 232, pH2S: 200,  Cl: INF, pH: 0 }
];

B1.materiales = {
  /* ---- Aleaciones resistentes a la corrosión (ISO 15156-3) ---- */
  N04400: { nombre: 'Monel 400 (UNS N04400)', corto: 'Monel 400', familia: 'cra', costo: 7,
    producto: 'ASTM B165', ref: 'ISO 15156-3, A.4 (Ni-Cu)', limites: LIBRE, req: 'Dureza máx. 35 HRC.',
    avisoAgrio: true },
  N06625: { nombre: 'Alloy 625 (UNS N06625)', corto: 'Alloy 625', familia: 'cra', costo: 9,
    producto: 'ASTM B444 / B446; overlay según API 6A', ref: 'ISO 15156-3, A.4 y A.13', limites: LIBRE,
    req: 'Recocido o depositado por soldadura.' },
  N08825: { nombre: 'Alloy 825 recocido (UNS N08825)', corto: 'Alloy 825', familia: 'cra', costo: 6,
    producto: 'ASTM B423 / B704', ref: 'ISO 15156-3, A.4', limites: LIBRE, req: 'Condición recocida.' },
  N08825_CW: { nombre: 'Alloy 825 trabajado en frío (UNS N08825)', corto: 'Alloy 825', familia: 'cra', costo: 7,
    producto: 'ISO 13680', ref: 'ISO 15156-3, A.4 (tabla A.14, tipo 4c)', limites: F_4C, req: 'Dureza máx. 35 HRC.' },
  N08028: { nombre: 'Alloy 28 (UNS N08028)', corto: 'Alloy 28', familia: 'cra', costo: 6,
    producto: 'ISO 13680', ref: 'ISO 15156-3, A.4 (tabla A.14, tipo 4c)', limites: F_4C, req: 'Dureza máx. 35 HRC.' },
  N06985: { nombre: 'Alloy G-3 (UNS N06985)', corto: 'Alloy G-3', familia: 'cra', costo: 8,
    producto: 'ISO 13680', ref: 'ISO 15156-3, A.4 (tabla A.14, tipo 4d)',
    limites: [{ T: 149, pH2S: INF, Cl: INF, pH: 0 }, { T: 218, pH2S: 2000, Cl: INF, pH: 0 }], req: 'Dureza máx. 40 HRC.' },
  N10276: { nombre: 'Alloy C-276 (UNS N10276)', corto: 'C-276', familia: 'cra', costo: 10,
    producto: 'ISO 13680', ref: 'ISO 15156-3, A.4 (tabla A.14, tipo 4e)',
    limites: [{ T: 204, pH2S: INF, Cl: INF, pH: 0 }, { T: 232, pH2S: 7000, Cl: INF, pH: 0 }], req: 'Dureza máx. 45 HRC.' },
  N07718: { nombre: 'Alloy 718 (UNS N07718)', corto: 'Alloy 718', familia: 'cra', costo: 6,
    producto: 'API 6ACRA', ref: 'ISO 15156-3, A.9 (tabla A.32)', limites: F_718,
    req: '40 HRC solo si está solubilizado y envejecido; 35 HRC en las demás condiciones.' },
  CUNA_718: { nombre: 'Cuñas de Alloy 718 con insertos de carburo', corto: '718 + carburo', familia: 'cra', costo: 7,
    producto: 'API 6ACRA; ISO 14310', ref: 'ISO 15156-3, A.9 (tabla A.32)', limites: F_718,
    req: 'Los insertos de carburo hacen el agarre; el cuerpo no necesita ser duro.' },
  N09925: { nombre: 'Alloy 925 (UNS N09925)', corto: 'Alloy 925', familia: 'cra', costo: 6,
    producto: 'API 6ACRA', ref: 'ISO 15156-3, A.9 (tabla A.32)', limites: F_718, req: 'Dureza según condición (tabla A.32).' },
  N08926: { nombre: 'Superaustenítico 6Mo (UNS N08926)', corto: '6Mo', familia: 'cra', costo: 5,
    producto: 'ASTM B649', ref: 'ISO 15156-3, A.3 (tablas A.8 y A.9)',
    limites: [{ T: 121, pH2S: 700, Cl: 60700, pH: 3.5 }, { T: 149, pH2S: 310, Cl: 5000, pH: 0 },
              { T: 171, pH2S: 100, Cl: 5000, pH: 0 }, { T: 60, pH2S: 100, Cl: INF, pH: 0 }], req: 'Condición solubilizada.' },
  S32750: { nombre: 'Superdúplex 25Cr (UNS S32750)', corto: 'Súper dúplex', familia: 'cra', costo: 5,
    producto: 'ASTM A789; ISO 13680', ref: 'ISO 15156-3, A.7 (tabla A.24)',
    limites: [{ T: 232, pH2S: 20, Cl: INF, pH: 0 }], req: 'Ferrita 35–65 %. En tubulares trabajados en frío aplica la tabla A.25, más estricta.' },
  S31803: { nombre: 'Dúplex 22Cr (UNS S31803)', corto: 'Dúplex 22Cr', familia: 'cra', costo: 4, picable: true,
    producto: 'ASTM A789; ISO 13680', ref: 'ISO 15156-3, A.7 (tabla A.24)',
    limites: [{ T: 232, pH2S: 10, Cl: INF, pH: 0 }], req: 'Ferrita 35–65 %. En tubulares trabajados en frío aplica la tabla A.25, más estricta.' },
  S31600: { nombre: 'Inoxidable 316 (UNS S31600)', corto: 'Inox 316', familia: 'cra', costo: 2, picable: true,
    producto: 'ASTM A240 / A276', ref: 'ISO 15156-3, A.2 (tabla A.2)',
    limites: [{ T: 60, pH2S: 100, Cl: INF, pH: 0 }, { T: INF, pH2S: 350, Cl: 50, pH: 0 }, { T: 93, pH2S: 10.2, Cl: 5000, pH: 5.0 },
              { T: 120, pH2S: 100, Cl: 1000, pH: 3.5 }, { T: 149, pH2S: 10.2, Cl: 1000, pH: 4.0 }], req: 'Máx. 22 HRC, sin trabajo en frío.' },
  S31603: { nombre: 'Inoxidable 316L (UNS S31603)', corto: 'Inox 316L', familia: 'cra', costo: 2, picable: true,
    producto: 'ASTM A269 / A240; clad según API 5LD', ref: 'ISO 15156-3, A.2 (tabla A.2)',
    limites: [{ T: 60, pH2S: 100, Cl: INF, pH: 0 }, { T: INF, pH2S: 350, Cl: 50, pH: 0 }, { T: 93, pH2S: 10.2, Cl: 5000, pH: 5.0 },
              { T: 120, pH2S: 100, Cl: 1000, pH: 3.5 }, { T: 149, pH2S: 10.2, Cl: 1000, pH: 4.0 }], req: 'Máx. 22 HRC, sin trabajo en frío.' },
  S42000: { nombre: 'Acero 13Cr (L80-13Cr, UNS S42000)', corto: '13Cr', familia: 'cra', costo: 2, picable: true, tPractica: 150,
    producto: 'API 5CT / ISO 11960', ref: 'ISO 15156-3, A.6 (tabla A.19)',
    limites: [{ T: INF, pH2S: 10, Cl: INF, pH: 3.5 }], req: 'Máx. 23 HRC.' },
  S41426: { nombre: 'Súper 13Cr (UNS S41426)', corto: 'Súper 13Cr', familia: 'cra', costo: 3, picable: true, tPractica: 180,
    producto: 'ISO 13680', ref: 'ISO 15156-3, A.6 (tabla A.19)',
    limites: [{ T: INF, pH2S: 10, Cl: INF, pH: 3.5 }], req: 'Máx. 27 HRC.' },
  S17400: { nombre: 'Inoxidable 17-4PH (UNS S17400)', corto: '17-4PH', familia: 'cra', costo: 3,
    producto: 'ASTM A564; API 6A', ref: 'ISO 15156-3, A.8 (tabla A.27)',
    limites: [{ T: INF, pH2S: 3.4, Cl: INF, pH: 4.5 }], req: 'Máx. 33 HRC, doble envejecido.' },

  /* ---- Recargues duros (la norma no les fija límites) ---- */
  STELLITE6: { nombre: 'Stellite 6 (recargue base cobalto)', corto: 'Stellite 6', familia: 'recargue', costo: 3,
    producto: 'AWS A5.21 (ERCoCr-A)', ref: 'ISO 15156-3, A.13.3.2' },
  WC_HVOF: { nombre: 'Carburo de tungsteno (HVOF)', corto: 'Carburo W', familia: 'recargue', costo: 3,
    producto: 'Especificación del fabricante', ref: 'ISO 15156-3, A.13' },

  /* ---- Aceros al carbono y de baja aleación (ISO 15156-2) ---- */
  L80_1:  { nombre: 'Acero API 5CT L80 Tipo 1', corto: 'L80', familia: 'acero', costo: 1, producto: 'API 5CT / ISO 11960', ref: 'ISO 15156-2, A.2 (tabla A.3)', ssc: 'todas' },
  K55:    { nombre: 'Acero API 5CT K55', corto: 'K55', familia: 'acero', costo: 1, producto: 'API 5CT / ISO 11960', ref: 'ISO 15156-2, A.2 (tabla A.3)', ssc: 'todas' },
  N80:    { nombre: 'Acero API 5CT N80', corto: 'N80', familia: 'acero', costo: 1, producto: 'API 5CT / ISO 11960', ref: 'ISO 15156-2, A.2 (tabla A.3)', ssc: 'tmin', tMin: 80 },
  X52:    { nombre: 'Acero API 5L X52', corto: 'X52', familia: 'acero', costo: 1, producto: 'API 5L / ISO 3183', ref: 'ISO 15156-2, A.2 y cláusula 8', ssc: 'a2', hic: true },
  X65:    { nombre: 'Acero API 5L X65', corto: 'X65', familia: 'acero', costo: 1, producto: 'API 5L / ISO 3183 (anexo H, servicio amargo)', ref: 'ISO 15156-2, A.2 y cláusula 8', ssc: 'a2', hic: true },
  X65_INH:{ nombre: 'Acero X65 sin revestir, con inhibidor de corrosión', corto: 'X65 + inhibidor', familia: 'acero', costo: 1, inhibidor: true,
            producto: 'API 5L / ISO 3183 (anexo H)', ref: 'ISO 15156-2; ISO 21457', ssc: 'a2', hic: true },
  A4130:  { nombre: 'Acero AISI 4130 (máx. 22 HRC)', corto: 'AISI 4130', familia: 'acero', costo: 1, producto: 'API 6A (60K) / ASTM A29', ref: 'ISO 15156-2, A.2', ssc: 'a2' },
  F22:    { nombre: 'Acero 2¼Cr-1Mo (ASTM A182 F22)', corto: 'F22', familia: 'acero', costo: 2, producto: 'ASTM A182 F22; API 6A', ref: 'ISO 15156-2, A.2', ssc: 'a2' },
  A4140:  { nombre: 'Acero AISI 4140', corto: 'AISI 4140', familia: 'acero', costo: 1, producto: 'ASTM A29; ISO 14310', ref: 'ISO 15156-2, A.2', ssc: 'a2', sinDureza: true },
  A8620C: { nombre: 'Acero AISI 8620 carburizado', corto: '8620 carb.', familia: 'acero', costo: 1, producto: 'ASTM A29', ref: 'ISO 15156-2, A.2', ssc: 'duro' },
  ACERO_C:{ nombre: 'Acero al carbono', corto: 'Acero C', familia: 'acero', costo: 1, producto: 'API 10D / fabricante', ref: 'ISO 15156-2, A.2', ssc: 'a2' },
  GALV:   { nombre: 'Alambre de acero galvanizado', corto: 'Galvanizado', familia: 'acero', costo: 1, producto: 'ISO 13628-5', ref: 'ISO 13628-5', ssc: 'duro' },
  L7:     { nombre: 'Acero de baja aleación ASTM A320 L7', corto: 'Acero L7', familia: 'acero', costo: 1, producto: 'ASTM A320 L7; API 6A / API 20E', ref: 'ISO 15156-2, A.2', ssc: 'a2' },

  /* ---- Cauchos y plásticos (ISO 23936) ---- */
  NBR:  { nombre: 'Caucho nitrilo (NBR)', corto: 'NBR', familia: 'polimero', costo: 1, producto: 'ISO 23936-2', ref: 'ISO 23936-2', tOk: 100, tMax: 120, h2s: 'mala', caucho: true, color: '#2b2f33' },
  HNBR: { nombre: 'Nitrilo hidrogenado (HNBR)', corto: 'HNBR', familia: 'polimero', costo: 2, producto: 'ISO 23936-2', ref: 'ISO 23936-2', tOk: 125, tMax: 150, h2s: 'media', caucho: true, color: '#2b2f33' },
  FKM:  { nombre: 'Fluoroelastómero (FKM, tipo Viton)', corto: 'FKM', familia: 'polimero', costo: 3, producto: 'ISO 23936-2', ref: 'ISO 23936-2', tOk: 180, tMax: 200, h2s: 'media', caucho: true, color: '#3a2f2a' },
  FEPM: { nombre: 'Elastómero TFE/P (FEPM, tipo Aflas)', corto: 'FEPM', familia: 'polimero', costo: 4, producto: 'ISO 23936-2', ref: 'ISO 23936-2', tOk: 200, tMax: 230, h2s: 'buena', caucho: true, color: '#24303a' },
  FFKM: { nombre: 'Perfluoroelastómero (FFKM)', corto: 'FFKM', familia: 'polimero', costo: 9, producto: 'ISO 23936-2', ref: 'ISO 23936-2', tOk: 250, tMax: 300, h2s: 'buena', caucho: true, color: '#1f2428' },
  PEEK: { nombre: 'PEEK', corto: 'PEEK', familia: 'polimero', costo: 3, producto: 'ISO 23936-1', ref: 'ISO 23936-1', tOk: 143, tMax: 250, h2s: 'buena', color: '#cdb98f' },
  PTFE: { nombre: 'PTFE reforzado', corto: 'PTFE', familia: 'polimero', costo: 3, producto: 'ISO 23936-1', ref: 'ISO 23936-1', tOk: 200, tMax: 260, h2s: 'buena', color: '#e6e8e3' },
  G10:  { nombre: 'Laminado epoxi-vidrio G10', corto: 'G10', familia: 'polimero', costo: 2, producto: 'NEMA LI 1 (G10); NACE SP0286', ref: 'NACE SP0286', tOk: 110, tMax: 140, h2s: 'buena', rigido: true, color: '#c98a2b' },
  G11:  { nombre: 'Laminado epoxi-vidrio G11 (alta temperatura)', corto: 'G11', familia: 'polimero', costo: 3, producto: 'NEMA LI 1 (G11); NACE SP0286', ref: 'NACE SP0286', tOk: 150, tMax: 180, h2s: 'buena', rigido: true, color: '#b8731f' },
  PE:   { nombre: 'Polietileno extruido', corto: 'Polietileno', familia: 'polimero', costo: 1, producto: 'ISO 13628-5', ref: 'ISO 13628-5', tOk: 60, tMax: 80, h2s: 'buena', color: '#3d4a52' },

  /* ---- Cementos ---- */
  CEMENTO_G:   { nombre: 'Cemento clase G', corto: 'Clase G', familia: 'cemento', costo: 1, producto: 'API 10A / ISO 10426-1', ref: 'API RP 10B-2 (ensayos)', silice: false, resisteCO2: false },
  CEMENTO_GS:  { nombre: 'Cemento clase G con 35–40 % de sílice', corto: 'G + sílice', familia: 'cemento', costo: 2, producto: 'API 10A / ISO 10426-1', ref: 'API RP 10B-2 (ensayos)', silice: true, resisteCO2: false },
  CEMENTO_CO2: { nombre: 'Cemento resistente a CO₂ (bajo en Portland)', corto: 'Resist. CO₂', familia: 'cemento', costo: 5, producto: 'Formulación del proveedor', ref: 'API RP 10B-2 (ensayos)', silice: true, resisteCO2: true },

  PENDIENTE: { nombre: 'Material sin definir', corto: 'Sin definir', familia: 'pendiente', costo: 0, producto: 'Por definir', ref: 'Hallazgo H-6' }
};

/* ---------- Candidatos por tipo de pieza ------------------------------
   Cuando cambian las condiciones, el simulador prueba todos los
   materiales del grupo y escoge el más barato que resista los 25 años. */
B1.grupos = {
  tubular:    ['L80_1', 'S42000', 'S41426', 'S31803', 'S32750', 'N08028', 'N08825_CW', 'N04400', 'N06985', 'N10276'],
  fondo:      ['A4140', 'S42000', 'N07718', 'N09925'],
  cunas:      ['A8620C', 'L80_1', 'CUNA_718'],
  anular_eq:  ['A4130', 'N08926', 'N07718'],
  control:    ['S31603', 'N08825', 'N06625'],
  abrazadera: ['S31600', 'N08825'],
  overlay:    ['S31603', 'N06625'],
  forjado:    ['A4130', 'F22'],
  vastago:    ['S17400', 'N09925', 'N07718'],
  trim:       ['S17400', 'N07718', 'N06625'],
  recargue:   ['WC_HVOF', 'STELLITE6'],
  elastomero: ['NBR', 'HNBR', 'FKM', 'FEPM', 'FFKM'],
  termo:      ['PTFE', 'PEEK'],
  cemento:    ['CEMENTO_G', 'CEMENTO_GS', 'CEMENTO_CO2'],
  clad:       ['X65_INH', 'S31603', 'N08825', 'N06625'],
  sello_metal:['S31603', 'N08825', 'N06625'],
  umbilical:  ['S31603', 'S32750', 'N06625'],
  pernos:     ['L7', 'N07718', 'N06625'],
  equipo_meg: ['S31603', 'S32750', 'N06625'],
  aislante:   ['G10', 'G11'],
  sello_junta:['FKM', 'FEPM', 'PTFE']
};

/* ---------- 3. Componentes y piezas ----------------------------------
   Cada pieza tiene una o varias "capas". Cada capa es un material con
   su exposición:
     'produccion' -> mojada por gas, condensado y agua del pozo
     'cemento'    -> cemento frente a la zona productora
     'anular'     -> en el anular, sobre el packer (solo ve gas si hay fuga)
     'respaldo'   -> acero bajo un revestimiento 625 (solo ve gas si hay defecto)
     'meg'        -> mojada por MEG (solo ve gas si hay retroflujo)
     'externo'    -> agua de mar / zona de salpicadura
     'fuera'      -> fuera de la corriente (ver "porque")
   El "grupo" de cada capa dice qué materiales alternativos se prueban.
   --------------------------------------------------------------------- */
/* capa(material, exposición, rol, porqué, grupo)
   Si no se indica el grupo de candidatos, se deduce del material y del rol. */
function grupoDe(mat, exp, rol) {
  if (exp === 'fuera') return null;
  if (mat === 'HNBR') return 'elastomero';
  if (mat === 'PEEK' || mat === 'PTFE') return 'termo';
  if (mat === 'CEMENTO_G') return 'cemento';
  if (mat === 'STELLITE6' || mat === 'WC_HVOF') return 'recargue';
  if (mat === 'N04400') return 'tubular';
  if (mat === 'N09925') return 'vastago';
  if (mat === 'N07718' || mat === 'A4140') return 'fondo';
  if (mat === 'A8620C') return 'cunas';
  if (mat === 'L80_1') return exp === 'produccion' ? 'cunas' : 'tubular';
  if (mat === 'N08926') return 'anular_eq';
  if (mat === 'A4130') return exp === 'anular' ? 'anular_eq' : 'forjado';
  if (mat === 'N08825') return 'control';
  if (mat === 'S31600') return 'abrazadera';
  if (mat === 'S32750') return 'umbilical';
  if (mat === 'PENDIENTE') return 'equipo_meg';
  if (mat === 'N06625') {
    if (rol === 'overlay') return 'overlay';
    if (rol === 'revestimiento') return 'clad';
    if (rol === 'cuerpo') return 'trim';
    if (exp === 'externo') return 'pernos';
    if (exp === 'meg') return 'equipo_meg';
    return 'sello_metal';
  }
  return null;
}
function capa(mat, exp, rol, porque, grupo) {
  return {
    mat: mat, exp: exp, rol: rol || '', porque: porque || '',
    grupo: grupo || grupoDe(mat, exp, rol || ''),
    // "mar": la misma pared toca agua de mar por fuera
    mar: (mat === 'X65' && exp === 'respaldo') || (mat === 'S32750' && exp === 'meg')
  };
}
var SOBRE = 'Queda cementado por encima de la zona productora: no ve H2S en operación normal.';
var TEMP  = 'Equipo de cementación: se perfora o queda embebido en cemento.';

B1.componentes = [
  {
    id: 'formacion', num: '1', nombre: 'Formación productora', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Casing frente a la formación', material: 'UNS N04400, 4½ in', norma: 'ISO 15156-3',
        capas: [capa('N04400', 'produccion')],
        nota: 'H-4: casing, liner y tubing aparecen confundidos en dimensiones (4½ in y 7 in).' },
      { nombre: 'Anillo de cemento', material: 'Cemento clase G o H, resistente a sulfatos', norma: 'ISO 10426-1',
        capas: [capa('CEMENTO_G', 'cemento')],
        nota: 'H-5: "resistente a sulfatos" no demuestra resistencia a CO2 y H2S.' },
      { nombre: 'Perforaciones (cañón)', material: 'Cañón de acero aleado; túneles en casing, cemento y roca', norma: 'Sin norma específica',
        capas: [capa('ACERO_C', 'fuera', '', 'El cañón es una herramienta de completamiento; los túneles no son una pieza de material.')] }
    ]
  },
  {
    id: 'casing', num: '2', nombre: 'Casing (revestimientos)', corriente: 'C1 y anular',
    piezas: [
      { nombre: 'Conductor 36 in', material: 'API 5L X52', norma: 'API 5L / ISO 3183',
        capas: [capa('X52', 'fuera', '', SOBRE)] },
      { nombre: 'Revestimiento de superficie 20 in', material: 'API 5CT K55', norma: 'API 5CT / ISO 11960',
        capas: [capa('K55', 'fuera', '', SOBRE)] },
      { nombre: 'Revestimiento intermedio 13⅜ in', material: 'API 5CT N80', norma: 'API 5CT / ISO 11960',
        capas: [capa('N80', 'fuera', '', SOBRE)] },
      { nombre: 'Colgador 13⅜ in y sello anular', material: 'AISI 4130; sello metal-metal con respaldo HNBR', norma: 'API 17D; ISO 23936-2',
        capas: [capa('A4130', 'fuera', 'cuerpo', SOBRE), capa('HNBR', 'fuera', 'sello', SOBRE)] },
      { nombre: 'Revestimiento de producción 9⅝ in', material: 'API 5CT L80 Tipo 1', norma: 'API 5CT; ISO 15156-2',
        capas: [capa('L80_1', 'anular')] },
      { nombre: 'Conexiones premium 9⅝ in', material: 'L80 Tipo 1, herméticas al gas', norma: 'ISO 13679',
        capas: [capa('L80_1', 'anular')] },
      { nombre: 'Colgador 9⅝ in y sello anular', material: 'AISI 4130 (dureza de servicio amargo); respaldo HNBR', norma: 'API 17D; ISO 15156-2; ISO 23936-2',
        capas: [capa('A4130', 'anular', 'cuerpo'), capa('HNBR', 'anular', 'sello')] },
      { nombre: 'Liner 7 in sobre el packer', material: 'API 5CT L80 Tipo 1', norma: 'API 5CT; ISO 15156-2',
        capas: [capa('L80_1', 'anular')] },
      { nombre: 'Liner 7 in bajo el packer', material: 'UNS N04400 (Monel 400)', norma: 'ASTM B165; ISO 15156-3',
        capas: [capa('N04400', 'produccion')] },
      { nombre: 'Junta de transición L80 ↔ N04400', material: 'Transición acero / Monel', norma: 'ISO 21457',
        capas: [capa('L80_1', 'anular', 'lado acero'), capa('N04400', 'anular', 'lado Monel')],
        nota: 'Par galvánico: el acero es el ánodo. Si el anular tiene salmuera conductora, el L80 se corroe junto a la unión.' },
      { nombre: 'Colgador de liner', material: 'UNS N08926', norma: 'API 19LH',
        capas: [capa('N08926', 'anular')] },
      { nombre: 'Empacador del tope del liner y PBR', material: 'UNS N08926; sello HNBR', norma: 'ISO 14310; ISO 23936-2',
        capas: [capa('N08926', 'anular', 'cuerpo'), capa('HNBR', 'anular', 'sello')] },
      { nombre: 'Zapata, collar flotador y de asentamiento 7 in', material: 'UNS N04400', norma: 'API RP 10F',
        capas: [capa('N04400', 'produccion')] },
      { nombre: 'Centralizadores', material: 'Acero al carbono (tramo L80); no metálicos o CRA (tramo Monel)', norma: 'API 10D',
        capas: [capa('ACERO_C', 'fuera', '', 'Quedan embebidos en el cemento, por fuera del revestimiento.')] },
      { nombre: 'Cemento del liner 7 in', material: 'Cemento clase G resistente a CO2 y H2S', norma: 'API 10A / ISO 10426-1',
        capas: [capa('CEMENTO_G', 'cemento')] },
      { nombre: 'Tapones de cementación y dardo', material: 'Caucho con núcleo perforable', norma: 'API RP 10F',
        capas: [capa('PENDIENTE', 'fuera', '', TEMP)] }
    ]
  },
  {
    id: 'tubing', num: '3', nombre: 'Tubing de producción', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Tubing 4½ in', material: 'UNS N04400 trabajado en frío', norma: 'ASTM B165; ISO 13679; ISO 15156-3',
        capas: [capa('N04400', 'produccion')],
        nota: 'H-3: en otra tabla figura como recocido. Revisar la capacidad mecánica frente a las cargas.' },
      { nombre: 'Niples de asiento X y XN', material: 'UNS N04400', norma: 'ISO 16070',
        capas: [capa('N04400', 'produccion')] },
      { nombre: 'Guía de entrada de wireline', material: 'UNS N04400', norma: 'ISO 14998',
        capas: [capa('N04400', 'produccion')] },
      { nombre: 'Camisa deslizable', material: 'UNS N07718; sellos HNBR', norma: 'ISO 14998',
        capas: [capa('N07718', 'produccion', 'cuerpo'), capa('HNBR', 'produccion', 'sellos')] },
      { nombre: 'Mandril del sensor de fondo', material: 'UNS N07718', norma: 'ISO 14998',
        capas: [capa('N07718', 'produccion')] },
      { nombre: 'Cable del sensor', material: 'UNS N08825, ¼ in', norma: 'ASTM B704',
        capas: [capa('N08825', 'anular')] },
      { nombre: 'Abrazaderas del cable y la línea de control', material: 'Acero inoxidable 316', norma: 'Según fabricante',
        capas: [capa('S31600', 'anular')] },
      { nombre: 'Colgador de tubing', material: 'AISI 4130 con overlay UNS N06625; sellos HNBR', norma: 'API 6A; API 17D; ISO 15156-3',
        capas: [capa('N06625', 'produccion', 'overlay'), capa('A4130', 'respaldo', 'acero base'), capa('HNBR', 'produccion', 'sellos')] }
    ]
  },
  {
    id: 'sssv', num: 'VS', nombre: 'Válvula de seguridad del tubing', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Cuerpo, pistón, tubo de flujo y flapper', material: 'UNS N07718, máx. 40 HRC', norma: 'ISO 10432 / API 14A',
        capas: [capa('N07718', 'produccion')] },
      { nombre: 'Sellos', material: 'Termoplástico PEEK / PTFE', norma: 'ISO 23936-1',
        capas: [capa('PEEK', 'produccion'), capa('PTFE', 'produccion')] },
      { nombre: 'Línea de control hidráulico', material: 'UNS N08825, ¼ in, 330 m', norma: 'ASTM B704',
        capas: [capa('N08825', 'anular')] }
    ]
  },
  {
    id: 'packer', num: '4', nombre: 'Packer y sellos', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Mandril (ficha "Packer y sellos")', material: 'Acero de baja aleación tipo 4140', norma: 'ISO 15156-2',
        capas: [capa('A4140', 'produccion')],
        nota: 'H-1: el mismo mandril figura como 4140 y como Alloy 718. Hay que resolverlo con el plano.' },
      { nombre: 'Cuerpo y mandril (ficha "Completamiento")', material: 'UNS N07718-120K', norma: 'ISO 14310; ISO 15156-3',
        capas: [capa('N07718', 'produccion')],
        nota: 'H-1: alternativa al mandril 4140.' },
      { nombre: 'Elementos de sello', material: 'HNBR', norma: 'ISO 23936-2',
        capas: [capa('HNBR', 'produccion')] },
      { nombre: 'Anillos antiextrusión', material: 'PEEK o PTFE reforzado', norma: 'ISO 14310; ISO 23936-1',
        capas: [capa('PEEK', 'produccion'), capa('PTFE', 'produccion')] },
      { nombre: 'Cuñas (ficha "Packer y sellos")', material: 'Acero 8620 carburizado', norma: 'ISO 15156-2',
        capas: [capa('A8620C', 'produccion')],
        nota: 'H-2: no se ha demostrado si la superficie endurecida toca el medio agrio.' },
      { nombre: 'Cuñas y conos (ficha "Completamiento")', material: 'Acero de baja aleación L80 endurecido', norma: 'ISO 14310; ISO 15156-2',
        capas: [capa('L80_1', 'produccion')] },
      { nombre: 'Ensamble de sellos y ancla', material: 'Cuerpo N07718; sellos chevron HNBR / PEEK', norma: 'ISO 14310',
        capas: [capa('N07718', 'produccion', 'cuerpo'), capa('HNBR', 'produccion', 'sellos'), capa('PEEK', 'produccion', 'sellos')] },
      { nombre: 'O-rings y sellos secundarios', material: 'HNBR', norma: 'ISO 23936',
        capas: [capa('HNBR', 'produccion')] }
    ]
  },
  {
    id: 'cabezal', num: '5', nombre: 'Cabezal de pozo', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Cuerpo (carcasa)', material: 'AISI 4130 + overlay Alloy 625 > 3 mm', norma: 'API 6A HH; ISO 21457; ISO 15156',
        capas: [capa('N06625', 'produccion', 'overlay'), capa('A4130', 'respaldo', 'acero base')] },
      { nombre: 'Bonete de válvulas laterales', material: 'AISI 4130 + overlay Alloy 625', norma: 'API 6A HH',
        capas: [capa('N06625', 'produccion', 'overlay'), capa('A4130', 'respaldo', 'acero base')] },
      { nombre: 'Vástago de válvulas laterales', material: 'Alloy 925 (UNS N09925)', norma: 'ISO 15156-3, tabla A.32',
        capas: [capa('N09925', 'produccion')] },
      { nombre: 'Compuerta', material: 'Alloy 718 con carburo de tungsteno (HVOF)', norma: 'ISO 15156-3, tabla A.32',
        capas: [capa('N07718', 'produccion', 'cuerpo', '', 'trim'), capa('WC_HVOF', 'produccion', 'caras')] },
      { nombre: 'Asientos', material: 'Alloy 718 con carburo de tungsteno (HVOF)', norma: 'ISO 15156-3, tabla A.32',
        capas: [capa('N07718', 'produccion', 'cuerpo', '', 'trim'), capa('WC_HVOF', 'produccion', 'caras')] },
      { nombre: 'Empaque del vástago', material: 'PTFE reforzado', norma: 'API 6A; ISO 23936-1',
        capas: [capa('PTFE', 'produccion')] }
    ]
  },
  {
    id: 'arbol', num: '6', nombre: 'Árbol de producción submarino', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Cuerpo (bloque)', material: 'AISI 4130 + Alloy 625, 22 HRC', norma: 'API 6A HH; ISO 21457; ISO 15156',
        capas: [capa('N06625', 'produccion', 'overlay'), capa('A4130', 'respaldo', 'acero base')] },
      { nombre: 'Bonetes y actuadores', material: 'AISI 4130 + Alloy 625 en zonas mojadas', norma: 'API 6A HH; ISO 21457',
        capas: [capa('N06625', 'produccion', 'overlay'), capa('A4130', 'respaldo', 'acero base')] },
      { nombre: 'Vástagos (PWV, AMV, AWV, XOV)', material: 'Alloy 718 (UNS N07718)', norma: 'API 17D; API 6A HH',
        capas: [capa('N07718', 'produccion', '', '', 'vastago')] },
      { nombre: 'Compuertas', material: 'Alloy 718 con carburo de tungsteno (HVOF)', norma: 'ISO 15156-3, tabla A.32',
        capas: [capa('N07718', 'produccion', 'cuerpo', '', 'trim'), capa('WC_HVOF', 'produccion', 'caras')] },
      { nombre: 'Asientos', material: 'Alloy 718 con carburo de tungsteno (HVOF)', norma: 'ISO 15156-3, tabla A.32',
        capas: [capa('N07718', 'produccion', 'cuerpo', '', 'trim'), capa('WC_HVOF', 'produccion', 'caras')] },
      { nombre: 'Sellos de vástago', material: 'PEEK con respaldo de PTFE', norma: 'API 17D; ISO 23936-1',
        capas: [capa('PEEK', 'produccion'), capa('PTFE', 'produccion')] },
      { nombre: 'Conector de control hidráulico', material: 'Alloy 625 (UNS N06625)', norma: 'ISO 21457, 8.9',
        capas: [capa('N06625', 'fuera', '', 'Lleva fluido hidráulico de control, no fluido del pozo.')] }
    ]
  },
  {
    id: 'vmaestra', num: '7', nombre: 'Válvula maestra: cuerpo y bonete', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Cuerpo', material: 'AISI 4130 + Alloy 625', norma: 'API 6A 10.5.3.1; ISO 21457',
        capas: [capa('N06625', 'produccion', 'overlay'), capa('A4130', 'respaldo', 'acero base')],
        nota: 'H-9: contrastar la clase de temperatura con el enfriamiento por despresurización.' },
      { nombre: 'Bonete', material: 'AISI 4130 + Alloy 625', norma: 'API 6A 10.5.3.1; ISO 21457',
        capas: [capa('N06625', 'produccion', 'overlay'), capa('A4130', 'respaldo', 'acero base')] }
    ]
  },
  {
    id: 'esparragos', num: '8', nombre: 'Espárragos y tuercas de la brida', corriente: 'C6 · Exposición externa',
    piezas: [
      { nombre: 'Espárragos 1⅛ in – 8 UN', material: 'UNS N06625', norma: 'ISO 21457, 8.9; API 6A',
        capas: [capa('N06625', 'externo')],
        nota: 'H-7: falta definir la posición física de la brida (zona de salpicadura o sumergida).' },
      { nombre: 'Tuercas', material: 'UNS N06625', norma: 'API 6A; ASTM A194',
        capas: [capa('N06625', 'externo')] }
    ]
  },
  {
    id: 'trim', num: '9', nombre: 'Trim de la válvula maestra', corriente: 'C1 · Gas y condensado',
    piezas: [
      { nombre: 'Vástago', material: 'Alloy 718 (UNS N07718)', norma: 'ISO 15156-3, tablas A.32 y A.33',
        capas: [capa('N07718', 'produccion', '', '', 'vastago')] },
      { nombre: 'Asientos', material: 'Alloy 625 con Stellite 6 en las caras', norma: 'ISO 15156-3, A.13.3.2',
        capas: [capa('N06625', 'produccion', 'cuerpo'), capa('STELLITE6', 'produccion', 'caras')] },
      { nombre: 'Superficies de sellado', material: 'Stellite 6 sobre Alloy 625', norma: 'ISO 15156-3, A.13.3.2',
        capas: [capa('STELLITE6', 'produccion')] },
      { nombre: 'Obturador (compuerta)', material: 'Alloy 625 + Stellite 6', norma: 'ISO 15156-3, A.13.3.2',
        capas: [capa('N06625', 'produccion', 'cuerpo'), capa('STELLITE6', 'produccion', 'caras')] }
    ]
  },
  {
    id: 'jumper', num: '10', nombre: 'Jumper / manifold', corriente: 'C2 · Gas con MEG',
    piezas: [
      { nombre: 'Tubería', material: 'API 5L X65 con revestimiento interno Alloy 625', norma: 'ISO 13628-4; API RP 17R',
        capas: [capa('N06625', 'produccion', 'revestimiento'), capa('X65', 'respaldo', 'acero base')],
        nota: 'H-8: la continuidad del 625 en codos y uniones no está demostrada.' },
      { nombre: 'Conectores', material: 'Acero de baja aleación con revestimiento Alloy 625', norma: 'ISO 13628-4; API RP 17R',
        capas: [capa('N06625', 'produccion', 'revestimiento'), capa('A4130', 'respaldo', 'acero base')] },
      { nombre: 'Sellos de conexión', material: 'Alloy 625 (metal-metal)', norma: 'ISO 13628-4',
        capas: [capa('N06625', 'produccion')] }
    ]
  },
  {
    id: 'flowline', num: '11', nombre: 'Flowline a tierra', corriente: 'C2 · Gas con MEG',
    piezas: [
      { nombre: 'Tubería', material: 'API 5L X65 con revestimiento interno Alloy 625', norma: 'ISO 15156-2 y -3; ISO 3183',
        capas: [capa('N06625', 'produccion', 'revestimiento'), capa('X65', 'respaldo', 'acero base')],
        nota: 'La línea se enfría hacia tierra: si el acero queda expuesto, revisar corrosión en el techo de la línea (TLC). H-8 aplica en las soldaduras.' }
    ]
  },
  {
    id: 'meg', num: 'MEG', nombre: 'Sistema de inyección de MEG', corriente: 'C5 · MEG al 60 %',
    piezas: [
      { nombre: 'Conector de la línea de MEG en el árbol', material: 'Alloy 625 (UNS N06625)', norma: 'ISO 21457, 8.9',
        capas: [capa('N06625', 'meg')] },
      { nombre: 'Tubos del umbilical', material: 'Superdúplex 25Cr UNS S32750, sin costura', norma: 'ISO 13628-5',
        capas: [capa('S32750', 'meg')] },
      { nombre: 'Cubierta del umbilical', material: 'Polietileno extruido', norma: 'ISO 13628-5',
        capas: [capa('PE', 'externo')] },
      { nombre: 'Armadura del umbilical', material: 'Alambres de acero galvanizado', norma: 'ISO 13628-5',
        capas: [capa('GALV', 'externo')] },
      { nombre: 'Terminaciones y accesorios', material: 'Alloy 625', norma: 'ISO 21457',
        capas: [capa('N06625', 'meg')] },
      { nombre: 'Válvula de retención y punto de inyección', material: 'No figura en el inventario', norma: 'Por definir',
        capas: [capa('PENDIENTE', 'produccion')],
        nota: 'H-6: faltan definiciones de terminaciones y sellos de la línea de inyección.' }
    ]
  },
  {
    // Tomado del informe B2: Tabla 8 (etapa 01, límite B1/B2) y Tabla 18 (nivel A:
    // 320 bar de base de escenario, 95 °C de operación y 120 °C máximo, corriente C01).
    id: 'llegada', num: '12', nombre: 'Válvula de llegada', corriente: 'C01 · Gas, condensado, agua agria y MEG',
    piezas: [
      { nombre: 'Cuerpo y extremos', material: 'Acero de baja aleación + overlay Alloy 625 en zonas mojadas (hipótesis de interfaz)', norma: 'API 6D; ASME B16.5; ISO 15156',
        capas: [capa('N06625', 'produccion', 'overlay'), Object.assign(capa('A4130', 'respaldo', 'acero base'), { aire: true })],
        nota: 'Paso NPS 8, clase ASME 2500. La presión real de llegada y la conexión están pendientes del acta B1–B2: los 320 bar son la base del escenario, no un dato medido en la frontera.' },
      { nombre: 'Trim y asientos', material: 'CRA según fabricante (sin definir en el inventario)', norma: 'API 6D / ISO 14313; ISO 15156-3',
        capas: [capa('PENDIENTE', 'produccion', '', '', 'trim')],
        nota: 'El informe B2 deja el trim "por fabricante". El simulador propone uno según las condiciones.' },
      { nombre: 'Junta de aislamiento eléctrico', material: 'Kit aislante reforzado G10 / epoxi (propuesta)', norma: 'ASME B16.5; NACE SP0286',
        capas: [capa('G10', 'produccion', '', '', 'aislante')],
        nota: 'Separa eléctricamente la línea submarina (con protección catódica) de la planta. Su ubicación exacta está por acordar entre B1, B2 y B3.' },
      { nombre: 'Sellos de la junta aislante', material: 'Juntas aptas para gas agrio (sin definir)', norma: 'ASME B16.5; ISO 23936',
        capas: [capa('PENDIENTE', 'produccion', '', '', 'sello_junta')] }
    ]
  }
];
