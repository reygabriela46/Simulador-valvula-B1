import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import unittest
from motor import Condiciones, evaluar_pieza, evaluar_todo, resumen, ESTADO_EXCEDE

class MotorTest(unittest.TestCase):
    def test_presiones_ideal(self):
        c=Condiciones()
        self.assertAlmostEqual(c.h2s_partial,3.71,places=9)
        self.assertAlmostEqual(c.co2_partial,4.77,places=9)
        self.assertAlmostEqual(c.h2s_partial*100,371)

    def test_manometrica(self):
        c=Condiciones(presion_tipo='manometrica')
        self.assertAlmostEqual(c.presion_absoluta,266.01325)
        self.assertAlmostEqual(c.h2s_partial,3.7241855)

    def test_modo_parcial(self):
        c=Condiciones(h2s_modo='parcial',h2s_valor=1.1,co2_modo='parcial',co2_valor=3.3)
        self.assertAlmostEqual(c.h2s_partial,1.1)
        self.assertAlmostEqual(c.co2_partial,3.3)
        self.assertAlmostEqual(c.h2s_molar,100*1.1/265)

    def test_cloruros_desconocidos(self):
        self.assertIsNone(Condiciones(anio=7.999).cloruros)
        self.assertEqual(Condiciones(anio=8).cloruros,28000)

    def test_dynamic_body_8(self):
        pre=evaluar_pieza(Condiciones(anio=7.5),'cuerpo')['recomendacion']['id']
        post=evaluar_pieza(Condiciones(anio=8),'cuerpo')['recomendacion']['id']
        self.assertEqual(pre,'4130_625');self.assertEqual(post,'625_SOL')

    def test_overlay_confirmado_cambia_recomendacion(self):
        sel=evaluar_pieza(Condiciones(anio=10,overlay_confirmado=True),'cuerpo')['recomendacion']['id']
        self.assertEqual(sel,'4130_625')  # confirmación mejora prioridad del overlay

    def test_dynamic_bolt_external(self):
        dry=evaluar_pieza(Condiciones(exposure='Protegida/seca'),'espárragos')['recomendacion']['id']
        splash=evaluar_pieza(Condiciones(exposure='Salpicadura / inmersión',recubrimiento_externo=False),'espárragos')['recomendacion']['id']
        self.assertEqual(dry,'B7');self.assertEqual(splash,'BOLT_625')

    def test_dynamic_nut_external(self):
        dry=evaluar_pieza(Condiciones(exposure='Protegida/seca'),'tuercas')['recomendacion']['id']
        splash=evaluar_pieza(Condiciones(exposure='Salpicadura / inmersión',recubrimiento_externo=False),'tuercas')['recomendacion']['id']
        self.assertEqual(dry,'2H');self.assertEqual(splash,'NUT_625')

    def test_b7_exposed_sour_exclusion(self):
        results=evaluar_pieza(Condiciones(contacto_produccion_tornillos=True),'espárragos')['alternativas']
        byid={x['id']:x for x in results}
        self.assertEqual(byid['B7']['estado'],ESTADO_EXCEDE)
        self.assertTrue('NO expuesto' in byid['B7']['motivo_exclusion'])

    def test_4130_excede_criterio_proyecto(self):
        r=evaluar_pieza(Condiciones(dureza_4130_hrc=24),'cuerpo')
        self.assertEqual(next(x for x in r['alternativas'] if x['id']=='4130_625')['estado'],ESTADO_EXCEDE)
        self.assertEqual(r['recomendacion']['id'],'625_SOL')

    def test_gas_seco_cambia_base(self):
        r=evaluar_pieza(Condiciones(contacto_agua=False),'cuerpo')
        self.assertEqual(r['recomendacion']['id'],'4130_BASE')

    def test_pendiente_not_certified(self):
        r=evaluar_todo(Condiciones())
        self.assertTrue(all(x['recomendacion']['estado']=='Pendiente de verificación' for x in r.values()))

    def test_validation(self):
        with self.assertRaises(AssertionError):Condiciones(presion=265,h2s_modo='parcial',h2s_valor=300).validar()
        with self.assertRaises(AssertionError):Condiciones(t_max=50,t_operacion=90).validar()
        with self.assertRaises(AssertionError):Condiciones(h2s_valor=90,co2_valor=50).validar()

    def test_report_pdf(self):
        from reporte_stdlib import crear_pdf
        b=crear_pdf(Condiciones())
        self.assertTrue(b.startswith(b'%PDF-'))
        self.assertGreater(len(b),1000)

if __name__=='__main__':unittest.main()
