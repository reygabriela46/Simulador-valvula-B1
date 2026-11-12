"""Motor reproducible, sin tasas de corrosión inventadas ni aprobación normativa automática."""
from __future__ import annotations
from dataclasses import dataclass
from catalogo import candidatos, Material

P_ATM_BAR = 1.01325
UMBRAL_AMBIENTE_AGRIO_BAR = 0.003  # ISO 15156-2:2020 §7.1: 0.3 kPa; solo cribado, NO aprobación
ESTADO_PENDIENTE = 'Pendiente de verificación'
ESTADO_EXCEDE = 'Excede criterio comprobado'
ESTADO_VERIFICADO = 'Compatible con límites verificados'


@dataclass(frozen=True)
class Condiciones:
    presion: float = 265.0
    referencia: float = 320.0
    presion_tipo: str = 'absoluta'  # bar(a) o bar(g)
    h2s_modo: str = 'mol'  # mol o parcial
    h2s_valor: float = 1.4
    co2_modo: str = 'mol'
    co2_valor: float = 1.8
    ph: float = 3.9
    t_operacion: float = 95.0
    t_max: float = 120.0
    anio: float = 0.0
    cloruros_formacion: float = 28000.0
    contacto_agua: bool = True
    exposure: str = 'Atmósfera marina'
    contacto_produccion_tornillos: bool = False
    recubrimiento_externo: bool = True
    overlay_confirmado: bool = False
    temperatura_min: float | None = None
    dureza_4130_hrc: float | None = None
    dureza_pernos_hrc: float | None = None
    dureza_tuercas_hrc: float | None = None
    tratamiento_documentado: bool = False
    propiedades_mecanicas_documentadas: bool = False

    def validar(self):
        assert self.presion >= 0, 'La presión no puede ser negativa'
        assert self.referencia > 0, 'La presión de diseño debe ser positiva'
        assert 0 <= self.anio <= 25
        assert 0 <= self.cloruros_formacion
        assert 0 <= self.h2s_valor and 0 <= self.co2_valor
        assert 0 <= self.ph <= 14
        for nombre in ('dureza_4130_hrc','dureza_pernos_hrc','dureza_tuercas_hrc'):
            hrc=getattr(self,nombre)
            if hrc is not None: assert 0 <= hrc <= 80, f'Dureza HRC fuera de rango: {nombre}'
        assert self.t_max >= self.t_operacion, 'T máxima no puede ser menor que T de operación'
        assert self.presion_tipo in ('absoluta','manometrica')
        assert self.h2s_modo in ('mol','parcial') and self.co2_modo in ('mol','parcial')
        if self.h2s_modo == 'mol': assert self.h2s_valor <= 100
        if self.co2_modo == 'mol': assert self.co2_valor <= 100
        if self.h2s_modo == 'mol' and self.co2_modo == 'mol':
            assert self.h2s_valor+self.co2_valor <= 100, 'Fracciones molares suman más de 100 %'
        if self.h2s_modo == 'parcial' and self.h2s_valor > self.presion_absoluta:
            raise AssertionError('pH₂S supera presión total absoluta')
        if self.co2_modo == 'parcial' and self.co2_valor > self.presion_absoluta:
            raise AssertionError('pCO₂ supera presión total absoluta')
        if self.h2s_partial+self.co2_partial > self.presion_absoluta+1e-8:
            raise AssertionError('Suma de presiones parciales supera presión absoluta')
        return self

    @property
    def presion_absoluta(self):
        return self.presion + (P_ATM_BAR if self.presion_tipo == 'manometrica' else 0.0)

    @property
    def h2s_partial(self):
        return self.h2s_valor*self.presion_absoluta/100.0 if self.h2s_modo=='mol' else self.h2s_valor

    @property
    def co2_partial(self):
        return self.co2_valor*self.presion_absoluta/100.0 if self.co2_modo=='mol' else self.co2_valor

    @property
    def h2s_molar(self):
        return self.h2s_valor if self.h2s_modo=='mol' else 100*self.h2s_valor/self.presion_absoluta if self.presion_absoluta else 0.0

    @property
    def co2_molar(self):
        return self.co2_valor if self.co2_modo=='mol' else 100*self.co2_valor/self.presion_absoluta if self.presion_absoluta else 0.0

    @property
    def cloruros(self):
        return self.cloruros_formacion if self.anio >= 8.0 else None

    @property
    def agrio(self):
        return self.contacto_agua and self.h2s_partial >= UMBRAL_AMBIENTE_AGRIO_BAR


def mecanismos(c: Condiciones, pieza: str):
    a=[]
    si_tornillo=pieza in ('espárragos','tuercas')
    humedo = c.contacto_agua and (not si_tornillo or c.contacto_produccion_tornillos)
    if humedo and c.h2s_partial > 0:
        a += [('SSC / agrietamiento por H₂S','Evaluar resistencia y condición metalúrgica; ISO 15156-2 o -3.')]
        a += [('SCC / GHSC en aleaciones CRA','Evaluar aleación, estado metalúrgico, tensión, pH, temperatura y cloruros según ISO 15156-3; no se deduce inmunidad.') ]
        if not si_tornillo:
            a += [('HIC / SOHIC','Revisar acero base, soldaduras y vía de penetración por defectos de revestimiento.')]
    if humedo and c.co2_partial > 0:
        a += [('Corrosión acuosa por CO₂','No se estima velocidad con una fórmula no calibrada; ISO 21457.')]
    if humedo and c.cloruros is not None and c.cloruros>0:
        a += [('Picadura / rendijas en cloruros','Salmuera de formación desde año 8; evaluación cualitativa de superficie CRA y juntas.')]
    elif humedo:
        a += [('Cloruros por determinar','Antes del año 8 la salinidad del condensado no está especificada.')]
    if si_tornillo:
        if c.exposure != 'Protegida/seca':
            a += [('Corrosión marina externa','Inspeccionar atmósfera, salpicadura, recubrimientos y accesibilidad.')]
        if c.contacto_produccion_tornillos:
            a += [('Tornillería en contacto con producción','Aplicar clasificación de tornillería expuesta, API 6A.')]
        if c.exposure == 'Salpicadura / inmersión':
            a += [('Rendijas / depósitos y par galvánico','Revisar juntas de brida, protección catódica, galvanismo y fragilización.')]
        a += [('Carga de apriete / gripado','Verificar tracción, precarga, par y compatibilidad espárrago-tuerca.')]
    else:
        if not c.overlay_confirmado:
            a += [('Integridad del revestimiento no verificada','Verificar continuidad de Alloy 625 y zonas no recubiertas.')]
        a += [('Capacidad de presión / fatiga térmica','Rating API 6A, tenacidad y transición por despresurización; faltan datos geométricos.')]
    return a


def justificacion(m: Material,c:Condiciones):
    avisos=[]
    excepcion=None
    agrio = c.agrio
    if m.id in ('4130_625','4130_BASE') and c.dureza_4130_hrc is not None and c.dureza_4130_hrc > 22:
        excepcion=('Dureza real del 4130 (%.1f HRC) supera los 22 HRC del ESCENARIO B1. '
                   'Es criterio preliminar del proyecto, NO se generaliza como límite universal ISO 15156.' % c.dureza_4130_hrc)
    if m.id == 'B7' and c.contacto_produccion_tornillos and agrio:
        excepcion='B7 está referenciado en API 6A:2004 §10.3.3.4 para bolting NO expuesto; aquí se declaró exposición al servicio agrio.'
    if m.id == '2H' and c.contacto_produccion_tornillos and agrio:
        # No declarar no apto por norma: grado 2H requiere lectura adicional de alcance.
        avisos.append('Revisar grado 2H de tuerca para la categoría NACE expuesta; 2HM es una alternativa del inventario normativo.')
    if m.familia in ('carbono','carbono_agrio'):
        if agrio:
            avisos.append('Servicio agrio: documentar química, dureza de lote, tratamiento térmico y uso de ISO 15156-2; SSC no equivale a corrosión general.')
        if c.exposure == 'Salpicadura / inmersión' and m.pieza != 'cuerpo':
            avisos.append('Acero expuesto a ambiente marino agresivo: diseño y mantenimiento de protección externa pendientes.')
        if m.id == '4130_BASE' and c.contacto_agua and c.co2_partial>0:
            avisos.append('La corrosión por CO₂ del acero desnudo no tiene tasa calculada; faltan datos hidráulicos e inhibidor.')
    if m.familia in ('niquel','revestido'):
        avisos.append('ISO 15156-3 examina agrietamiento; no prueba ausencia de picadura o corrosión general.')
        if c.cloruros is not None:
            avisos.append('Cloruros de formación presentes; revisar pH, temperatura, depósito, rendijas y aireación real.')
    if m.id == '4130_625':
        avisos.append('Barrera Alloy 625 dependiente de continuidad; acero 4130 no debe tratarse como aislado si hay defectos.')
    if m.id in ('BOLT_625','NUT_625'):
        avisos.append('Verificar capacidad de carga y gripado antes de usar una unión completa CRA.')
    if not c.tratamiento_documentado:
        avisos.append('Tratamiento térmico del lote aún no documentado; no asumir propiedades metalúrgicas calificadas.')
    if not c.propiedades_mecanicas_documentadas:
        avisos.append('Sin comprobación de esfuerzo de prueba/fluencia, dimensionamiento y precarga de la unión API 6A.')
    if m.pieza == 'espárragos' and c.dureza_pernos_hrc is not None:
        avisos.append(f'Dureza medida de espárragos {c.dureza_pernos_hrc:g} HRC: confrontar con norma de grado y condición; NO se aplicó un máximo sin fuente.')
    if m.pieza == 'tuercas' and c.dureza_tuercas_hrc is not None:
        avisos.append(f'Dureza medida de tuercas {c.dureza_tuercas_hrc:g} HRC: verificar especificación ASTM y lote; no se asume equivalente a dureza del espárrago.')
    if c.presion > c.referencia:
        avisos.append('Presión ingresada supera referencia de 320 bar: desvío de diseño; no es automáticamente fallo del material.')
    if c.t_max>120:
        avisos.append('Temperatura superior al máximo inicial del caso; revisar clase térmica y propiedades, sin asumir límite normativo.')
    return excepcion, avisos


def puntuacion(m:Material, c:Condiciones):
    """Índice comparativo de preferencia, NO modelo físico ni norma. Valores transparentes en README."""
    brine=c.cloruros is not None and c.cloruros>0 and c.contacto_agua
    wet=c.contacto_agua
    sour=c.agrio
    highacid=c.ph < 3.5 and wet
    hot=c.t_max>120
    seawater=c.exposure == 'Salpicadura / inmersión'
    marine=c.exposure == 'Atmósfera marina'
    exposed=c.contacto_produccion_tornillos
    scores={
        '4130_625':80, '625_SOL':58, '4130_BASE':42,
        'B7':78,'B7M':69,'L7M':61,'BOLT_625':46,'BOLT_660':37,
        '2H':76,'2HM':68,'7M':57,'NUT_625':47,
    }
    s=scores[m.id]
    if m.id=='4130_625':
        s+= 7 if sour else 0
        s-= 27 if brine and not c.overlay_confirmado else 0
        s+= 14 if brine and c.overlay_confirmado else 0
        s-= 33 if not c.overlay_confirmado and highacid else 0
        s-= 14 if hot else 0
    if m.id=='625_SOL':
        s+= 30 if brine else 0
        s+= 27 if highacid else 0
        s+= 16 if hot else 0
        s+= 7 if sour else 0
    if m.id=='4130_BASE':
        s+= 42 if not wet else -20
        s-= 35 if sour else 0
        s-= 22 if brine else 0
        s-= 20 if wet and c.co2_partial>=1 else 0  # criterio de priorización de proyecto, no límite
    if m.id in ('B7','2H'):
        s-= 51 if exposed and sour else 0
        s-= 26 if seawater else 0
        s-= 14 if marine else 0
        s+= 6 if c.exposure=='Protegida/seca' and not exposed else 0
    if m.id in ('B7M','2HM','L7M','7M'):
        s+= 15 if exposed and sour else 0
        s-= 38 if seawater else 0
        s-= 20 if seawater and not c.recubrimiento_externo else 0
        s-= 14 if exposed and brine else 0
        s+= 12 if c.temperatura_min is not None and c.temperatura_min<0 and m.id in ('L7M','7M') else 0
    if m.id in ('BOLT_625','NUT_625'):
        s+= 47 if seawater else 0
        s+= 35 if exposed and brine else 0
        s+= 25 if exposed and sour else 0
        s+= 10 if marine and not c.recubrimiento_externo else 0
        s+= 9 if highacid and exposed else 0
    if m.id=='BOLT_660':
        s+= 5 if c.presion>c.referencia else 0  # No constituye verificación mecánica
        s-= 28 if seawater else 0
    return s


def clasificar(m:Material,c:Condiciones):
    falla,avisos=justificacion(m,c)
    return {
        'id':m.id, 'material':m.nombre,'pieza':m.pieza,
        'estado': ESTADO_EXCEDE if falla else ESTADO_PENDIENTE,
        'motivo_exclusion':falla,
        'avisos':avisos, 'score':puntuacion(m,c),
        'pendiente':m.pendiente,'ventajas':m.ventajas,'limitaciones':m.limitaciones,
        'fuentes':list(m.fuentes), 'descripcion':m.descripcion,
    }


def evaluar_pieza(c:Condiciones,pieza:str):
    c.validar()
    resultados=[clasificar(m,c) for m in candidatos(pieza)]
    resultados.sort(key=lambda d:(d['estado']!=ESTADO_EXCEDE,d['score']),reverse=True)
    validos=[x for x in resultados if x['estado']!=ESTADO_EXCEDE]
    mejor=validos[0] if validos else None
    return {'pieza':pieza,'recomendacion':mejor,'alternativas':resultados,'mecanismos':mecanismos(c,pieza)}


def evaluar_todo(c:Condiciones):
    c.validar()
    return {pieza:evaluar_pieza(c,pieza) for pieza in ('cuerpo','bonete','espárragos','tuercas')}


def resumen(c:Condiciones):
    return {
        'P absoluta (bar)':round(c.presion_absoluta,5),
        'pH2S (bar)':round(c.h2s_partial,6),
        'pH2S (kPa)':round(c.h2s_partial*100,4),
        'pCO2 (bar)':round(c.co2_partial,6),
        'pCO2 (kPa)':round(c.co2_partial*100,4),
        'H2S (% mol)':round(c.h2s_molar,6),
        'CO2 (% mol)':round(c.co2_molar,6),
        'cloruros (mg/L)':c.cloruros if c.cloruros is not None else 'NO DETERMINADO',
        'servicio agrio (cribado)':c.agrio,
        'presión vs referencia':'MAYOR' if c.presion>c.referencia else 'NO MAYOR',
    }
