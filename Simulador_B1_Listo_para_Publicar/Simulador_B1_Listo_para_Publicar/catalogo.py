"""Candidatos de ingeniería. Ninguna ficha implica certificación comercial o normativa."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Material:
    id: str
    pieza: str
    nombre: str
    familia: str
    descripcion: str
    ventajas: str
    limitaciones: str
    pendiente: str
    fuentes: tuple[str, ...]

MATERIALES = (
    Material('4130_625','cuerpo','AISI 4130 + overlay Alloy 625','revestido',
             'Acero de baja aleación con barrera interna de aleación UNS N06625 por soldadura.',
             'Cuerpo resistente con barrera CRA en superficie mojada; propuesta base del escenario.',
             'La continuidad y ausencia de defectos del overlay, dilución, zonas de transición y desempeño del acero base requieren prueba.',
             'MTR/HT/durezas del 4130 y ZAC; WPS/PQR, dilución, continuidad del overlay; presión API 6A; ISO 15156-2/3.',
             ('ISO 15156-2:2020 §7.1, §7.3, Anexo A','ISO 15156-3:2020 Anexo A','ISO 21457:2010 §6','API 6A:2004/ISO 10423')),
    Material('625_SOL','cuerpo','Alloy 625 macizo · UNS N06625','niquel',
             'Cuerpo/bonete enteramente en aleación de níquel; no equivale a validación del producto fundido o forjado.',
             'Elimina la interfaz de recargue; mayor margen cualitativo frente a corrosión localizada en la superficie.',
             'Costo, disponibilidad y propiedades/espesor resistente; condición metalúrgica y ruta de fabricación decisivas.',
             'Verificar forma del producto, estado recocido/solubilizado, tabla aplicable ISO 15156-3 y rating API 6A.',
             ('ISO 15156-3:2020 tablas A.13 / A.32 según forma y tratamiento (verificar edición)','API 6A:2004','ISO 21457:2010 §6')),
    Material('4130_BASE','cuerpo','AISI 4130 sin overlay','carbono',
             'Acero de baja aleación sin barrera interna de CRA.',
             'Fabricación y costo potencialmente menores si la corrosión se controla por diseño.',
             'Susceptible a corrosión acuosa por CO₂ y a SSC en servicio agrio sin calificación/control.',
             'Certificado de material, tratamiento, durezas, ISO 15156-2, control de corrosión y espesor de diseño.',
             ('ISO 15156-2:2020 §7 y Anexo A','ISO 21457:2010 §6','API 6A:2004')),
    Material('B7','espárragos','ASTM A193 B7','carbono',
             'Espárrago para uso no expuesto al fluido agrio, cuando se cumplan las demás restricciones de API 6A.',
             'Opción de uso convencional en uniones no expuestas; adquisición relativamente sencilla.',
             'No extrapolar la aceptación de tornillería no expuesta a tornillería expuesta a fluido agrio.',
             'Clase térmica, categoría de exposición, diámetro, MTR, tenacidad y rating del ensamble.',
             ('API 6A:2004 §10.3.3.4; tabla 49','ISO 21457:2010 §6')),
    Material('B7M','espárragos','ASTM A193 B7M','carbono_agrio',
             'Espárrago con condición de fabricación y control de dureza para casos de exposición al servicio agrio.',
             'Candidato de acero de costo moderado para ciertas configuraciones expuestas.',
             'Resistencia mecánica, diámetro/rating de brida y corrosión externa deben comprobarse; no inmunidad marina.',
             'API 6A tabla 49 según clase/tamaño/presión; dureza real, certificados, ISO 15156-2 y protección externa.',
             ('API 6A:2004 §10.3.3.3; tabla 49','ISO 15156-2:2020 §7.3','ISO 21457:2010 §6')),
    Material('L7M','espárragos','ASTM A320 L7M','carbono_agrio',
             'Opción a estudiar cuando también importa la condición de baja temperatura por despresurización.',
             'Permite evaluar tenacidad de pernos con requisito de temperatura baja.',
             'No presupone que cumple el mínimo térmico ni el rating; susceptibilidad a corrosión marina.',
             'Ensayo de impacto, temperaturas mínimas, API 6A, ISO 15156 y protección externa.',
             ('API 6A:2004 §10.3.3 y tabla 49','ISO 15156-2:2020 §7.3')),
    Material('BOLT_625','espárragos','Espárrago CRA Alloy 625 · UNS N06625','niquel',
             'Candidato CRA para exposición marina severa y eventual contacto con producción; especificación del perno pendiente.',
             'Alternativa anticorrosiva que evita depender solo de un recubrimiento externo de acero.',
             'No asumir resistencia/pre-carga equivalente a acero B7M; riesgo de gripado y calificación del conjunto.',
             'Producto certificado, resistencia/rosca, precarga, pareja de tuerca, ISO 15156-3 y aprobación API 6A.',
             ('API 6A:2004 §10.3.3 y tabla 49','ISO 15156-3:2020 Anexo A, tablas A.13/A.32 si corresponden','ISO 21457:2010 §6')),
    Material('BOLT_660','espárragos','ASTM A453 grado 660 · condición verificada','alta_resistencia',
             'Alternativa de alta resistencia citada para condiciones específicas en API 6A.',
             'Puede atender restricciones de carga cuando se valida la condición exacta.',
             'Susceptibilidad a SCC y corrosión marina, tratamiento térmico y restricciones de servicio por verificar.',
             'Comprobar condición 660 y clase térmica/servicio de API 6A, ISO 15156 aplicable y unión.',
             ('API 6A:2004 §10.3.3, tabla 49','ISO 15156-3:2020 Anexo A')),
    Material('2H','tuercas','ASTM A194 2H','carbono',
             'Tuerca para ensamble no expuesto al fluido de proceso, sujeta a verificación mecánica.',
             'Disponibilidad y emparejamiento con clases habituales de tornillería.',
             'No extrapolar a condición agria expuesta sin revisar límites de API 6A.',
             'Grado/ensayo del lote, dureza, ajuste con espárrago y categoría de exposición.',
             ('API 6A:2004 §10.3.3.5; tabla 49','ISO 21457:2010 §6')),
    Material('2HM','tuercas','ASTM A194 2HM','carbono_agrio',
             'Tuerca frecuentemente propuesta para sistema NACE expuesto, condicionada a calificación del ensamble.',
             'Candidata para uso con espárragos B7M sujetos a aprobación del diseño.',
             'La resistencia a grietas no asegura resistencia a corrosión atmosférica/salpicadura marina.',
             'MTR, dureza, geometría, emparejamiento, recubrimiento y requisitos API 6A.',
             ('API 6A:2004 §10.3.3.5; tabla 49','ISO 15156-2:2020 §7.3')),
    Material('7M','tuercas','ASTM A194 7M','carbono_agrio',
             'Alternativa de tuerca indicada en normas de bridas y tornillería, a revisar para perno específico.',
             'Posible compatibilidad con espárragos L7M bajo requisitos del proveedor.',
             'No asumir intercambiabilidad entre grados sin prueba de esfuerzo de prueba y rosca.',
             'Requisitos de ASTM, API 6A y compatibilidad del conjunto.',
             ('API 6A:2004 §10.3.3.5; tabla 49','ISO 21457:2010 §6')),
    Material('NUT_625','tuercas','Tuerca CRA Alloy 625 · UNS N06625','niquel',
             'Alternativa CRA para atmósfera/salpicadura marina o fluido de producción.',
             'Resistencia cualitativa a corrosión superficial; pareja coherente con perno CRA.',
             'Gripado de roscas, precarga, resistencia y grado certificado del producto requieren diseño.',
             'Especificación fabricante, ensayo de carga, control de gripado, ISO 15156-3, API 6A.',
             ('API 6A:2004 §10.3.3.5; tabla 49','ISO 15156-3:2020 Anexo A, tablas A.13/A.32 si corresponden','ISO 21457:2010 §6')),
)

def candidatos(pieza):
    return tuple(m for m in MATERIALES if m.pieza == ('cuerpo' if pieza in ('cuerpo','bonete') else pieza))

MAPA = {m.id:m for m in MATERIALES}
