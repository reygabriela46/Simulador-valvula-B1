# Master Valve / Materials Lab — B1

Simulador educativo **funcional**, no herramienta certificada, para la selección comparativa dinámica de cuatro elementos de una válvula maestra de gas costa afuera:

- **7:** cuerpo y bonete.
- **8:** espárragos y tuercas.

## Instalación en Windows — método más fácil

**No abras `test_motor.py` para ejecutar el simulador.**

1. Descomprime el ZIP en una carpeta nueva.
2. Haz doble clic en `INICIAR_SIMULADOR.bat`. **No requiere Streamlit ni instalar librerías.**
3. Si no se abre solo, entra desde Chrome en <http://127.0.0.1:8765>.
4. El proyecto también se abre desde PyCharm / VS Code ejecutando `main.py` con el botón verde.

Desde PyCharm, abre **la carpeta que contiene `main.py`** (no su carpeta padre). Haz clic derecho sobre `main.py` → **Run 'main'**. Utiliza cualquier Python 3 actualizado. No necesitas crear `.venv`. También sirve en VS Code.

Método de terminal en la carpeta `main.py`:

```powershell
python main.py
```

En Windows también puedes ejecutar `py -3 main.py`. En Linux/Mac ejecuta `python3 main.py`. **Este modo usa solo la biblioteca estándar de Python.**

Este proyecto **no usa Streamlit ni librerías externas**. Toda la interfaz se abre desde `main.py` en una página local con Python estándar. Por eso evita el problema anterior de dependencias y entornos virtuales.

## Funciones

- Cálculo de presiones parciales a partir de presión absoluta o manométrica, composiciones molares o parciales directas.
- Controles de pH, presión, H₂S, CO₂, temperatura normal/máxima, año de servicio y cloruros.
- Entradas opcionales de dureza (HRC) del acero 4130, espárragos y tuercas, y evidencia documental del tratamiento térmico y mecánica.
- **Cloruros desconocidos hasta el año 8.** Desde ese año se adopta concentración de agua de formación introducida, por defecto 28.000 mg/L.
- Cuatro evaluaciones independientes y sincronizadas: cuerpo, bonete, espárragos, tuercas.
- Comparaciones que realmente **cambian la recomendación**, por ejemplo: año 7 → año 8; protección/sequedad → salpicadura; recargue continuo documentado ↔ no documentado.
- Diagramas técnicos esquemáticos de cada componente, en SVG original.
- Alertas de SSC, HIC/SOHIC, SCC, corrosión CO₂, cloruros, mar y carga de uniones.
- Informe PDF nativo sin dependencias (generación propia) y evaluación JSON descargables.
- Tests unitarios con `python -m unittest discover -s tests -v`.

## REGLAS: selección dinámica versus aprobación normativa

Hay dos procesos **separados**:

**A. Cribado normativo verificable (categórico)**

- ISO 15156-2:2020 §7.1, umbral de referencia de **0,3 kPa = 0,003 bar** de H₂S parcial para clasificación del entorno SSC de aceros, en presencia de condiciones acuosas. **NO** constituye un límite de aprobación del 4130.
- API 6A:2004 §10.3.3.4 y tabla 49: se evalúa el alcance de B7 como tornillería **no expuesta** al fluido agrio; cuando se declara exposición directa, el programa marca el grado B7 como **fuera del criterio comprobado** en este contexto de selección. Los grados B7M/L7M/CRA requieren verificación adicional con la tabla según tamaño, clase de temperatura y rating.
- ISO 15156-3:2020, Anexo A: selección de aleaciones resistentes al agrietamiento. Su aceptación no demuestra resistencia a pérdida de espesor ni picadura.
- ISO 21457:2010 §6: considerar mecanismos, control de corrosión y ambiente externo/interno.
- El **escenario B1** menciona **22 HRC** como máximo del acero base 4130 de la selección preliminar: si el usuario introduce una dureza medida superior, se excluye esa alternativa por el **criterio de proyecto**, no se atribuye falsamente ese número a todos los grados de la norma. Para otras durezas, sin la tabla y condición certificada, el resultado permanece pendiente.

**B. Índice ordinal de priorización (heurístico, NO normativo):**

No se fabrican tasas de corrosión, resistencias, límites de dureza o tablas de homologación. Para proponer una **recomendación que cambie** al variar las entradas, el programa usa un índice cualitativo, indicado en el código `motor.py::puntuacion()`. Es **una política académica de decisión**, no un modelo de degradación ni una norma. Se puede modificar/explicar. Ejemplos:

- Frente a agua de formación con cloruros y overlay no documentado, se incrementa la prioridad de Alloy 625 macizo frente a 4130 con overlay 625 por robustez de la barrera (no significa que el overlay en buen estado falle).
- Si el ambiente es seco y tornillería no expuesta, se favorece B7/2H; si hay salpicadura marina sin protección, aumenta la prioridad de una alternativa CRA; ambas requieren revisión de resistencias y API 6A.
- Si el entorno es agrio, se penaliza acero 4130 desnudo o B7 expuesto; el motor NO afirma que B7M, L7M, 625 o 718 estén calificados.

**Estados de la herramienta**

- **Compatible con límites verificados**: categoría definida para futuro módulo de certificaciones y tablas completas, **no se emite por defecto** porque faltan documentos de producto y cotas de servicio.
- **Pendiente de verificación**: estado normal de todas las propuestas de materiales, aun cuando sean el primer candidato.
- **Excede criterio comprobado**: solo cuando una restricción concreta, p. ej. B7 clasificado para bolting no expuesto frente a exposición directa agria, lo sustenta. No se confunde con vida útil ni tasa de corrosión.

**Importante:** no se deduce vida útil por 25 años. No hay cálculo de corrosión por CO₂ sin caudal, agua, química completa y modelo calibrado. Las presiones y composiciones de fase gas no bastan para estimar una tasa. La presión superior a la referencia genera una alerta **de diseño**, no un descarte automático por material.

## Evidencia faltante para conformidad industrial

- Especificaciones reales de material (UNS y grado), lote/MTR, condición metalúrgica y temperatura/tiempo de tratamiento térmico.
- Durezas máximas y medidas incluyendo soldaduras y zona afectada por calor.
- Condiciones completas de ISO 15156-2 o -3 (incluyendo tablas y excepciones por forma de producto); ensayos específicos/servicio previo cuando aplique.
- Clase de material, PSL, clase de temperatura, tamaño de conexión, rating, carga de prueba y precarga de API 6A.
- Requisitos del recargue: continuidad, dilución, WPS/PQR, transiciones, corrosión y reparaciones.
- Para pernos, riesgo de rosca, gripado, pares galvánicos, protección externa, protección catódica, lluvia/salpicadura y contacto real con fluido.
- Datos de flujo, salinidad previa al año 8 (desconocida), composición líquida, cloruros reales, inhibidores y temperatura mínima transitoria.

## Bases documentales y edición

- Escenario B — Desarrollo de gas costa afuera, Caribe colombiano, PDF del equipo. Valores iniciales p=265 bar operación y 320 bar referencia/cierre, CO₂=1,8 mol %, H₂S=1,4 mol %, pH=3,9, 95/120 °C, 28.000 mg/L desde año 8, 25 años.
- UNE-EN ISO 15156-1:2020 — principios para servicio con H₂S.
- UNE-EN ISO 15156-2:2020 — §7, §8 y Anexo A.
- UNE-EN ISO 15156-3:2020 — Anexo A; ciertas tablas específicas dependen de aleación, estado metalúrgico y forma del producto.
- EN ISO 21457:2010 — §6, materiales/corrosión durante selección.
- API 6A:2004 — §10.3.3, tabla 49 para tornillería; **edición antigua de referencia académica**; una revisión industrial debe verificar la edición contractual vigente.

Los PDFs de las normas **no** se redistribuyen en este paquete por derechos de reproducción. Los enlaces de Google Drive y de la interfaz externa proporcionados podrían requerir permisos o no estar accesibles; el software no los requiere para operar. Diseño propio con inspiración en dashboards industriales, sin replicar código de terceros.
