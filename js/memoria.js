/* =====================================================================
   memoria.js — Recuerda condiciones y materiales elegidos entre páginas
   Usa el almacenamiento del navegador. Si no está disponible, cada
   página arranca con la base de diseño y el inventario.
   ===================================================================== */
var B1 = globalThis.B1 || (globalThis.B1 = {});
var CLAVE = 'simulador-b1-v2';

B1.cargarEstado = function () {
  var vacio = { cond: {}, esc: {}, elegidos: {} };
  try {
    var txt = localStorage.getItem(CLAVE);
    if (!txt) return vacio;
    var d = JSON.parse(txt);
    return { cond: d.cond || {}, esc: d.esc || {}, elegidos: d.elegidos || {} };
  } catch (e) { return vacio; }
};

/* elegidos: { idComponente: [ [material de la capa 0, capa 1...], ...por pieza ] } */
B1.guardarEstado = function (cond, esc, elegidos) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ cond: cond, esc: esc, elegidos: elegidos || {} })); } catch (e) { /* sin almacenamiento */ }
};

B1.borrarEstado = function () {
  try { localStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ }
};

/* Escenarios rápidos: cambian varias condiciones de una vez */
B1.escenarios = [
  { id: 'base',     nombre: 'Base de diseño',        cambia: null },
  { id: 'dulce',    nombre: 'Pozo sin H₂S',          cambia: { pH2S: 0 } },
  { id: 'pocoH2S',  nombre: 'Poco H₂S',              cambia: { pH2S: 0.05 } },
  { id: 'caliente', nombre: 'Más caliente, 160 °C',  cambia: { T: 160 } },
  { id: 'suave',    nombre: 'Agua menos ácida',      cambia: { pH: 5.5 } }
];
