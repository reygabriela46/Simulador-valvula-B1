'use strict';
const DEFAULTS={
 presion:265,referencia:320,presion_tipo:'absoluta',h2s_modo:'mol',h2s_valor:1.4,
 co2_modo:'mol',co2_valor:1.8,ph:3.9,t_operacion:95,t_max:120,anio:0,
 cloruros_formacion:28000,contacto_agua:true,exposure:'Atmósfera marina',
 contacto_produccion_tornillos:false,recubrimiento_externo:true,overlay_confirmado:false,temperatura_min:null,dureza_4130_hrc:null,dureza_pernos_hrc:null,dureza_tuercas_hrc:null,tratamiento_documentado:false,propiedades_mecanicas_documentadas:false
};
let state={...DEFAULTS},last=null,requestId=0,waiter=null;
const get=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=(n,d=2)=>Number(n).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});
const pieces=[['cuerpo','07 / CUERPO'],['bonete','07 / BONETE'],['espárragos','08 / ESPÁRRAGOS'],['tuercas','08 / TUERCAS']];
function signal(){get('connection').textContent='Actualizando cálculo…';clearTimeout(waiter);waiter=setTimeout(evaluate,170)}
function capture(){
 document.querySelectorAll('[data-prop]').forEach(el=>{
  state[el.dataset.prop]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value.trim()===''?null:Number(el.value)):el.type==='range'?Number(el.value):el.value;
 });
 state.h2s_modo=get('h2s_modo').value;state.co2_modo=get('co2_modo').value;
 state.temperatura_min=get('usar_tmin').checked?Number(get('temperatura_min').value):null;
 get('year-number').textContent=fmt(state.anio,1);
 signal();
}
async function evaluate(){
 const seq=++requestId;
 try{
  let response=await fetch('/api/evaluar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});
  const payload=await response.json();
  if(seq!==requestId)return;
  if(!response.ok)throw new Error(payload.error||`HTTP ${response.status}`);
  last=payload;get('error').hidden=true;render(payload);
  get('connection').textContent='Motor Python conectado';
 }catch(err){
  if(seq!==requestId)return;
  get('error').textContent='Corrige las entradas: '+err.message;get('error').hidden=false;
  get('connection').textContent='Revisión de entradas pendiente';
 }
}
function render(d){
 const r=d.resumen,evals=d.evaluacion;
 get('metric-pabs').textContent=fmt(r['P absoluta (bar)'],2);
 get('metric-h2s').textContent=fmt(r['pH2S (bar)'],3);
 get('metric-co2').textContent=fmt(r['pCO2 (bar)'],3);
 get('metric-cl').textContent=typeof r['cloruros (mg/L)']==='number'?fmt(r['cloruros (mg/L)'],0):'No determinado';
 get('gascomp').textContent=` H₂S: ${fmt(r['H2S (% mol)'],3)} % mol · CO₂: ${fmt(r['CO2 (% mol)'],3)} % mol · 1 bar = 100 kPa.`;
 get('updated').textContent='Recalculado · '+new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
 get('cards').innerHTML=pieces.map(([id,label])=>{
  let x=evals[id].recomendacion;
  return `<article class="card"><div class="illustration"><img src="/diagram/${encodeURIComponent(id)}" alt="Dibujo esquemático de ${esc(id)}"></div>
   <div class="cardcontent"><div class="cardlabel">${esc(label)}</div><div class="cardname">${esc(x?.material??'Sin candidato')}</div>
   <div class="cardbottom"><span class="status">${esc(x?.estado??'No disponible')}</span><span class="score">PRI. ${esc(x?.score??'-')}</span></div></div></article>`;
 }).join('');
 const year=state.anio;
 get('badge-year').textContent=`AÑO ${fmt(year,1)}`;
 get('trackprogress').style.width=`${year/25*100}%`;
 get('locator').style.left=`${year/25*100}%`;
 get('envbox').innerHTML=year>=8?
 `<strong>Agua de formación incorporada · ${fmt(state.cloruros_formacion,0)} mg/L de cloruros</strong><p>El escenario incorpora salinidad desde el año 8. No representa cálculo de velocidad de corrosión ni pronóstico de fallo de la válvula.</p>`:
 '<strong>Cloruros del agua condensada: no determinados</strong><p>Antes del año 8 no se dispone de dato de salinidad. No se supone cero ni inmunidad a corrosión localizada.</p>';
 renderCompare(evals[get('focus-piece').value]);
}
function renderCompare(item){
 if(!item)return;
 get('compare-body').innerHTML=item.alternativas.map(a=>{
  const red=a.estado.startsWith('Excede');
  return `<tr><td>${esc(a.material)}</td><td><span class="mini-state ${red?'red':''}">${esc(a.estado)}</span></td>
   <td>${esc(a.score)}</td><td>${esc(a.limitaciones)}</td></tr>`;
 }).join('');
 const best=item.recomendacion;
 get('details').innerHTML=`
 <div class="detailpanel"><strong>MATERIAL PRIORIZADO · ALCANCE</strong><p><b>${esc(best?.material??'Sin candidato')}</b></p><p>${esc(best?.descripcion??'')}</p><p><b>Ventajas:</b> ${esc(best?.ventajas??'')}</p></div>
 <div class="detailpanel"><strong>DATOS QUE FALTAN</strong><p>${esc(best?.pendiente??'')}</p><p><b>Limitaciones:</b> ${esc(best?.limitaciones??'')}</p></div>
 <div class="detailpanel full"><strong>MECANISMOS DE DAÑO A EVALUAR</strong><ul>${item.mecanismos.map(([me,why])=>`<li><b>${esc(me)}:</b> ${esc(why)}</li>`).join('')}</ul></div>
 <div class="detailpanel full"><strong>REFERENCIAS DOCUMENTALES</strong><ul>${(best?.fuentes||[]).map(f=>`<li>${esc(f)}</li>`).join('')}</ul></div>`;
 const messages=[...(best?.avisos||[]),...item.alternativas.filter(a=>a.motivo_exclusion).map(a=>`${a.material}: ${a.motivo_exclusion}`)];
 get('failures').innerHTML=messages.map(x=>`<div class="failure">${esc(x)}</div>`).join('');
}
async function download(route,filename){
 try{
  const response=await fetch('/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});
  if(!response.ok){const j=await response.json();throw new Error(j.error||'No se pudo generar archivo')}
  const blob=await response.blob();const uri=URL.createObjectURL(blob);const a=document.createElement('a');a.href=uri;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),5000);
 }catch(e){get('error').textContent='Error al exportar: '+e.message;get('error').hidden=false;}
}
function init(){
 document.querySelectorAll('[data-prop]').forEach(el=>el.addEventListener(el.type==='range'?'input':'change',capture));
 get('h2s_modo').addEventListener('change',()=>{
  get('h2s_valor').value=get('h2s_modo').value==='mol'?1.4:3.71;
  get('h2s_valor').max=get('h2s_modo').value==='mol'?100:1500;capture();
 });
 get('co2_modo').addEventListener('change',()=>{
  get('co2_valor').value=get('co2_modo').value==='mol'?1.8:4.77;
  get('co2_valor').max=get('co2_modo').value==='mol'?100:1500;capture();
 });
 document.querySelectorAll('[data-pres]').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('[data-pres]').forEach(x=>x.classList.toggle('active',x===btn));
  state.presion_tipo=btn.dataset.pres;capture();
 }));
 get('usar_tmin').addEventListener('change',()=>{get('minwrap').hidden=!get('usar_tmin').checked;capture();});
 get('temperatura_min').addEventListener('change',capture);
 get('focus-piece').addEventListener('change',()=>{if(last)renderCompare(last.evaluacion[get('focus-piece').value]);});
 get('export-pdf').addEventListener('click',()=>download('reporte','Informe_tecnico_B1.pdf'));
 get('export-json').addEventListener('click',()=>download('json','Evaluacion_B1.json'));
 evaluate();
}
document.addEventListener('DOMContentLoaded',init);
