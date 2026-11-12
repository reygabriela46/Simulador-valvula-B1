"""PDF técnico autocontenido generado con biblioteca estándar (sin pip)."""
from __future__ import annotations
from io import BytesIO
from textwrap import wrap
from unicodedata import normalize
from motor import evaluar_todo,resumen


def _text(s):
    s=str(s).replace('₂','2').replace('₃','3').replace('⁻','-').replace('≥','>=').replace('≤','<=').replace('·','-')
    s=s.replace('–','-').replace('—','-').replace('’',"'").replace('“','"').replace('”','"')
    return s.encode('latin-1','replace').decode('latin-1')


def crear_pdf(c):
    entries=[]
    def write(s='',style='normal'):
        text=_text(s)
        width=65 if style=='title' else (83 if style=='h' else 97)
        for line in wrap(text,width=width,replace_whitespace=False,drop_whitespace=True) or ['']:
            entries.append((line,style))
    vals=resumen(c)
    write('SIMULADOR B1 - INFORME TECNICO','title')
    write('Componentes 7 y 8 - valvula maestra de gas costa afuera')
    write('Evaluacion academica. NO certificacion de producto ni prediccion de vida util.')
    write('CONDICIONES DE OPERACION','h')
    write(f'Presion: {c.presion:g} bar ({c.presion_tipo}); P absoluta: {c.presion_absoluta:.3f} bar')
    write(f'Presion de referencia/cierre: {c.referencia:g} bar')
    write(f'Fraccion H2S: {c.h2s_molar:.4f}% mol; pH2S: {c.h2s_partial:.5f} bar = {c.h2s_partial*100:.3f} kPa')
    write(f'Fraccion CO2: {c.co2_molar:.4f}% mol; pCO2: {c.co2_partial:.5f} bar = {c.co2_partial*100:.3f} kPa')
    write(f'pH: {c.ph:g}; T normal: {c.t_operacion:g} C; T maxima: {c.t_max:g} C; anio: {c.anio:g}')
    write(f'Cloruros: {c.cloruros:,.0f} mg/L' if c.cloruros is not None else 'Cloruros antes del anio 8: NO DETERMINADOS; no se asume cero')
    write(f'Exterior de tornilleria: {c.exposure}. Contacto produccion: {"si" if c.contacto_produccion_tornillos else "no"}')
    write(f'Dureza 4130: {c.dureza_4130_hrc if c.dureza_4130_hrc is not None else "desconocida"} HRC; grado de perno y tuerca: lotes pendientes')
    write(f'Tratamiento documentado: {c.tratamiento_documentado}; propiedades mecanicas documentadas: {c.propiedades_mecanicas_documentadas}')
    write('HIPOTESIS Y ALERTAS','h')
    write('Gas ideal: p_i = y_i * P absoluta. P(g) + 1.01325 bar = P(a). No equivale a composicion acuosa.')
    write('No se calcula corrosion por CO2 ni vida remanente; se requieren datos y modelos calibrados.')
    if c.presion>c.referencia:write('ALERTA: la presion excede la referencia. Verificar rating API 6A.')
    rr=evaluar_todo(c)
    for pieza,datos in rr.items():
        write(f'COMPONENTE: {pieza.upper()}','h')
        best=datos['recomendacion']
        if best:
            write('RECOMENDACION CONDICIONAL: '+best['material'])
            write('ESTADO: '+best['estado'])
            write('PENDIENTE: '+best['pendiente'])
            write('CRITERIO: '+best['descripcion'])
            write('FUENTES: '+ '; '.join(best['fuentes']))
        write('Alternativas evaluadas:')
        for a in datos['alternativas']:
            write(f' - {a["material"]} [{a["estado"]}] priorizacion {a["score"]}')
            if a['motivo_exclusion']:write('    MOTIVO: '+a['motivo_exclusion'])
        write('Mecanismos potenciales: '+', '.join(x[0] for x in datos['mecanismos']))
    write('REFERENCIAS Y LIMITACIONES','h')
    write('ISO 15156-2:2020: 7.1, 7.3, 8 y Anexo A; ISO 15156-3:2020: Anexo A.')
    write('API 6A:2004: 10.3.3 y tabla 49; ISO 21457:2010: 6.')
    write('Las puntuaciones son criterios heurísticos de priorización, NO límites ISO/API.')
    write('Conformidad final exige certificados de lote, dureza, tratamiento, mecanica y rating del ensamble.')

    pageheight=842
    blocks=[];stream=[];y=792
    def finish():
        nonlocal stream,y
        blocks.append(('\n'.join(stream)+'\n').encode('latin1'))
        stream=[];y=792
    for line,style in entries:
        size=16 if style=='title' else 11 if style=='h' else 8
        delta=25 if style=='title' else 18 if style=='h' else 11.1
        if y<55:finish()
        color='0.08 0.42 0.49' if style in ('title','h') else '0.1 0.17 0.24'
        safe=line.replace('\\','\\\\').replace('(','\\(').replace(')','\\)')
        stream.append(f'BT /F1 {size} Tf {color} rg 48 {y:.2f} Td ({safe}) Tj ET')
        y-=delta
    finish()
    objs=[]
    def add(b):
        objs.append(b)
        return len(objs)
    catalog=add(b'')
    pagesid=add(b'')
    fontid=add(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
    pageids=[]
    for stream in blocks:
        data=add(b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'\nendstream')
        pageids.append(add(f'<< /Type /Page /Parent {pagesid} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 {fontid} 0 R >> >> /Contents {data} 0 R >>'.encode()))
    objs[pagesid-1]=(f'<< /Type /Pages /Kids ["'+"".join(f'{p} 0 R ' for p in pageids)+'"'+f'] /Count {len(pageids)} >>').replace('"','').encode()
    objs[catalog-1]=f'<< /Type /Catalog /Pages {pagesid} 0 R >>'.encode()
    b=BytesIO();b.write(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets=[0]
    for i,obj in enumerate(objs,1):
        offsets.append(b.tell())
        b.write(f'{i} 0 obj\n'.encode()+obj+b'\nendobj\n')
    start=b.tell();b.write(f'xref\n0 {len(objs)+1}\n0000000000 65535 f \n'.encode())
    for off in offsets[1:]:b.write(f'{off:010d} 00000 n \n'.encode())
    b.write(f'trailer\n<< /Size {len(objs)+1} /Root {catalog} 0 R >>\nstartxref\n{start}\n%%EOF\n'.encode())
    return b.getvalue()
