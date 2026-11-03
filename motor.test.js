// Tests del motor. Correr con: node --test
const test = require('node:test');
const assert = require('node:assert');
require('./motor.js');
require('./monstruos.js');
const M = globalThis.Motor;

// 2026-11-02 es lunes.
const habito = (o = {}) => ({ id: 'h', nombre: 'Leer', monstruo: 'babosa-verde', inicio: '2026-11-02', objetivo: 4, registro: { tipo: 'sino', campos: [] }, frecuencias: [{ tipo: 'diario', desde: '2026-11-02' }], ...o });
function cumplir(reg, id, lunes, dias) {
  for (const d of dias) M.marcar(reg, id, M.sumarDias(lunes, d), { estado: 'hecho' });
}
const TODA = [0, 1, 2, 3, 4, 5, 6];

test('las fechas caen en el día de semana correcto', () => {
  assert.equal(M.diaSemana('2026-11-02'), 0);
  assert.equal(M.diaSemana('2026-11-08'), 6);
  assert.equal(M.lunesDe('2026-11-08'), '2026-11-02');
  assert.equal(M.sumarDias('2026-12-31', 1), '2027-01-01');
});

test('los umbrales siguen la regla y coinciden con los monstruos', () => {
  assert.deepEqual(M.umbrales(4), [1, 2, 3, 4]);
  assert.deepEqual(M.umbrales(8), [2, 4, 6, 8]);
  assert.deepEqual(M.umbrales(26), [7, 13, 20, 26]);
  assert.deepEqual(M.umbrales(30), [2, 6, 12, 26]);
  assert.deepEqual(M.umbrales(null), [2, 6, 12, 26]);
  for (const T of [4, 7, 13, 26, 27, 52]) assert.deepEqual(M.umbrales(T), globalThis.Monstruos.thresholds(T));
});

test('el ejemplo de un mes crece cada semana', () => {
  const reg = {}, h = habito();
  const esperado = [[0, '2026-11-02'], [1, '2026-11-09'], [2, '2026-11-16'], [3, '2026-11-23'], [4, '2026-11-30']];
  for (const [forma, hoy] of esperado) {
    assert.equal(M.estado(h, reg, hoy).forma, forma, hoy);
    cumplir(reg, 'h', hoy, TODA);
  }
});

test('la semana en curso no cuenta hasta cerrarse', () => {
  const reg = {}, h = habito();
  cumplir(reg, 'h', '2026-11-02', TODA);
  assert.equal(M.estado(h, reg, '2026-11-08').cumplidas, 0);
  assert.equal(M.estado(h, reg, '2026-11-09').cumplidas, 1);
});

test('corregir un día recalcula el crecimiento', () => {
  const reg = {}, h = habito();
  cumplir(reg, 'h', '2026-11-02', TODA);
  assert.equal(M.estado(h, reg, '2026-11-09').forma, 1);
  M.marcar(reg, 'h', '2026-11-04', null);
  assert.equal(M.estado(h, reg, '2026-11-09').forma, 0);
});

test('días fijos: hacerlo otro día cuenta igual', () => {
  const reg = {}, h = habito({ frecuencias: [{ tipo: 'fijos', dias: [0, 2], desde: '2026-11-02' }] });
  cumplir(reg, 'h', '2026-11-02', [0, 3]);
  assert.equal(M.estado(h, reg, '2026-11-09').cumplidas, 1);
  assert.equal(M.toca(h, reg, '2026-11-09', '2026-11-09'), true);
  assert.equal(M.toca(h, reg, '2026-11-10', '2026-11-10'), false);
});

test('sin días fijos: aparece hasta llegar a la meta', () => {
  const reg = {}, h = habito({ frecuencias: [{ tipo: 'semanal', meta: 2, desde: '2026-11-02' }] });
  assert.equal(M.toca(h, reg, '2026-11-03', '2026-11-03'), true);
  cumplir(reg, 'h', '2026-11-02', [0, 1]);
  assert.equal(M.toca(h, reg, '2026-11-04', '2026-11-04'), false);
  assert.equal(M.toca(h, reg, '2026-11-01', '2026-11-04'), false, 'antes de empezar no toca');
});

test('la primera semana se prorratea', () => {
  const h = habito({ inicio: '2026-11-06' }); // viernes: quedan 3 días
  assert.equal(M.metaDeSemana(h, '2026-11-02'), 3);
  const s = habito({ inicio: '2026-11-07', frecuencias: [{ tipo: 'semanal', meta: 1, desde: '2026-11-07' }] }); // sábado: 2 días
  assert.equal(M.metaDeSemana(s, '2026-11-02'), 0, 'con meta 0 la semana no se evalúa');
});

test('una semana entera en pausa no cuenta y alarga el plazo', () => {
  const reg = {}, h = habito({ pausas: [{ desde: '2026-11-09', hasta: '2026-11-15' }] });
  cumplir(reg, 'h', '2026-11-02', TODA);
  cumplir(reg, 'h', '2026-11-16', TODA);
  const e = M.estado(h, reg, '2026-11-23');
  assert.equal(e.transcurridas, 2);
  assert.equal(e.cumplidas, 2);
  assert.equal(e.apagado, false);
});

test('una pausa parcial baja la meta de esa semana', () => {
  const h = habito({ pausas: [{ desde: '2026-11-11', hasta: '2026-11-15' }] });
  assert.equal(M.metaDeSemana(h, '2026-11-09'), 2);
});

test('pausar y reanudar', () => {
  const h = habito();
  M.pausar(h, '2026-11-10');
  assert.equal(M.enPausa(h, '2026-11-20'), true);
  M.reanudar(h, '2026-11-20');
  assert.equal(M.enPausa(h, '2026-11-20'), false);
  assert.equal(M.enPausa(h, '2026-11-19'), true);
  M.pausar(h, '2026-11-25'); M.reanudar(h, '2026-11-25');
  assert.equal(h.pausas.length, 1, 'una pausa del mismo día se descarta');
});

test('dos semanas seguidas sin cumplir lo apagan, y se recupera', () => {
  const reg = {}, h = habito({ objetivo: 12 });
  assert.equal(M.estado(h, reg, '2026-11-16').apagado, true);
  cumplir(reg, 'h', '2026-11-16', TODA);
  assert.equal(M.estado(h, reg, '2026-11-23').apagado, false);
  assert.equal(M.estado(h, reg, '2026-11-23').cumplidas, 1, 'no retrocede ni pierde lo logrado');
});

test('cambiar la frecuencia no reescribe semanas viejas', () => {
  const reg = {}, h = habito({ objetivo: 12 });
  cumplir(reg, 'h', '2026-11-02', TODA);
  const desde = M.cambiarFrecuencia(h, { tipo: 'semanal', meta: 1 }, '2026-11-11');
  assert.equal(desde, '2026-11-16');
  assert.equal(M.metaDeSemana(h, '2026-11-02'), 7);
  assert.equal(M.metaDeSemana(h, '2026-11-09'), 7);
  assert.equal(M.metaDeSemana(h, '2026-11-16'), 1);
  const nuevo = habito();
  assert.equal(M.cambiarFrecuencia(nuevo, { tipo: 'semanal', meta: 3 }, '2026-11-04'), '2026-11-02');
  assert.equal(nuevo.frecuencias.length, 1);
});

test('al terminar el tiempo queda pendiente y se puede extender', () => {
  const reg = {}, h = habito();
  for (const l of ['2026-11-02', '2026-11-09', '2026-11-23']) cumplir(reg, 'h', l, TODA); // falla la tercera
  let e = M.estado(h, reg, '2026-11-30');
  assert.equal(e.terminadoPendiente, true);
  assert.equal(e.forma, 3, 'adulto');
  assert.equal(e.faltanLegendario, 1);
  assert.equal(M.toca(h, reg, '2026-11-30', '2026-11-30'), false);
  M.extender(h, e.faltanLegendario);
  e = M.estado(h, reg, '2026-11-30');
  assert.equal(e.terminadoPendiente, false);
  cumplir(reg, 'h', '2026-11-30', TODA);
  e = M.estado(h, reg, '2026-12-07');
  assert.equal(e.forma, 4, 'legendario');
  assert.equal(e.terminadoPendiente, true);
});

test('las semanas después del límite no suman', () => {
  const reg = {}, h = habito();
  for (let i = 0; i < 6; i++) cumplir(reg, 'h', M.sumarDias('2026-11-02', i * 7), TODA);
  const e = M.estado(h, reg, '2026-12-21');
  assert.equal(e.cumplidas, 4);
});

test('más de 26 semanas o sin fin suman estrellas', () => {
  const reg = {}, h = habito({ objetivo: null });
  for (let i = 0; i < 28; i++) cumplir(reg, 'h', M.sumarDias('2026-11-02', i * 7), TODA);
  const e = M.estado(h, reg, M.sumarDias('2026-11-02', 28 * 7));
  assert.equal(e.forma, 4);
  assert.equal(e.estrellas, 2);
  assert.equal(e.terminadoPendiente, false);
  const corto = habito({ objetivo: 26 }), r2 = {};
  for (let i = 0; i < 26; i++) cumplir(r2, 'h', M.sumarDias('2026-11-02', i * 7), TODA);
  assert.equal(M.estado(corto, r2, M.sumarDias('2026-11-02', 26 * 7)).estrellas, 0);
});

test('un personaje que se queda ocupa su lugar; liberado vuelve a estar libre', () => {
  const elenco = globalThis.Monstruos.ELENCO, a = habito({ id: 'a' }), b = habito({ id: 'b', monstruo: 'verde-peludo' });
  assert.equal(M.libres([a, b], elenco).length, 18);
  M.terminar(a, 'jardin', '2026-11-30');
  assert.equal(M.libres([a, b], elenco).length, 18);
  assert.equal(M.enJardin([a, b]).length, 2);
  M.terminar(b, 'liberado', '2026-11-30');
  assert.equal(M.libres([a, b], elenco).length, 19);
  assert.equal(M.enJardin([a, b]).length, 1);
  assert.equal(M.libres([a, b], elenco, 'babosa-verde').length, 20, 'al editar puede conservar el suyo');
});

test('un hábito terminado deja de sumar y de pedir marcas', () => {
  const reg = {}, h = habito({ objetivo: null });
  cumplir(reg, 'h', '2026-11-02', TODA);
  M.terminar(h, 'jardin', '2026-11-09');
  cumplir(reg, 'h', '2026-11-09', TODA);
  const e = M.estado(h, reg, '2026-12-01');
  assert.equal(e.cumplidas, 1);
  assert.equal(e.apagado, false);
  assert.equal(M.toca(h, reg, '2026-11-20', '2026-12-01'), false);
});

test('solo se corrigen los últimos 7 días', () => {
  assert.equal(M.editable('2026-11-02', '2026-11-09'), true);
  assert.equal(M.editable('2026-11-01', '2026-11-09'), false);
  assert.equal(M.editable('2026-11-10', '2026-11-09'), false);
});

test('el resumen lista marcas, valores y notas', () => {
  const reg = {}, h = habito({ nombre: 'Tipeo', registro: { tipo: 'numero', campos: [{ nombre: 'Velocidad', unidad: 'PPM' }] } });
  M.marcar(reg, 'h', '2026-11-03', { estado: 'hecho', valores: ['80'], nota: 'bien' });
  M.marcar(reg, 'h', '2026-11-04', { estado: 'no' });
  const t = M.resumen([h], reg, '2026-11-04');
  assert.match(t, /2026-11-03 \(martes\)/);
  assert.match(t, /Tipeo: hecho \(80 PPM\)\. Nota: bien/);
  assert.match(t, /Tipeo: no hecho/);
});

const dia = (h, reg, f, hoy) => M.diasDelAnio(h, reg, +f.slice(0, 4), hoy).dias[f];

test('calendario, todos los días: verde hecho, rojo si pasó sin hacerse, hoy pendiente', () => {
  const reg = {}, h = habito({ objetivo: 12 });
  M.marcar(reg, 'h', '2026-11-02', { estado: 'hecho' });
  assert.equal(dia(h, reg, '2026-11-02', '2026-11-04'), 'hecho');
  assert.equal(dia(h, reg, '2026-11-03', '2026-11-04'), 'fallado');
  assert.equal(dia(h, reg, '2026-11-04', '2026-11-04'), 'pendiente');
  assert.equal(dia(h, reg, '2026-11-05', '2026-11-04'), 'futuro');
  assert.equal(dia(h, reg, '2026-11-01', '2026-11-04'), 'nada', 'antes de empezar no había nada que hacer');
});

test('calendario, días fijos: gris los días sin tarea, y compensar borra el rojo', () => {
  const reg = {}, h = habito({ objetivo: 12, frecuencias: [{ tipo: 'fijos', dias: [0, 2], desde: '2026-11-02' }] });
  assert.equal(dia(h, reg, '2026-11-02', '2026-11-06'), 'fallado');
  assert.equal(dia(h, reg, '2026-11-03', '2026-11-06'), 'nada');
  assert.equal(dia(h, reg, '2026-11-04', '2026-11-06'), 'fallado');
  M.marcar(reg, 'h', '2026-11-05', { estado: 'hecho' }); // jueves, en vez del lunes
  assert.equal(dia(h, reg, '2026-11-02', '2026-11-06'), 'nada');
  assert.equal(dia(h, reg, '2026-11-04', '2026-11-06'), 'fallado');
  assert.equal(dia(h, reg, '2026-11-05', '2026-11-06'), 'hecho');
});

test('calendario, sin días fijos: solo es rojo lo que ya no se puede recuperar', () => {
  const reg = {}, h = habito({ objetivo: 12, frecuencias: [{ tipo: 'semanal', meta: 2, desde: '2026-11-02' }] });
  assert.equal(dia(h, reg, '2026-11-03', '2026-11-05'), 'nada', 'todavía llega');
  assert.equal(dia(h, reg, '2026-11-05', '2026-11-05'), 'pendiente');
  M.marcar(reg, 'h', '2026-11-03', { estado: 'hecho' });
  const cerrada = M.diasDelAnio(h, reg, 2026, '2026-11-09');
  assert.equal(cerrada.dias['2026-11-08'], 'fallado', 'faltó una: el último día queda rojo');
  assert.equal(cerrada.dias['2026-11-07'], 'nada');
  M.marcar(reg, 'h', '2026-11-04', { estado: 'no' });
  const conNo = M.diasDelAnio(h, reg, 2026, '2026-11-09');
  assert.equal(conNo.dias['2026-11-04'], 'fallado', 'prefiere el día marcado como no');
  assert.equal(conNo.dias['2026-11-08'], 'nada');
});

test('calendario: una marca de no hoy cuenta como fallado', () => {
  const reg = {}, h = habito({ objetivo: 12 });
  M.marcar(reg, 'h', '2026-11-04', { estado: 'no' });
  assert.equal(dia(h, reg, '2026-11-04', '2026-11-04'), 'fallado');
});

test('calendario: la pausa y el hábito terminado no fallan', () => {
  const reg = {}, h = habito({ objetivo: 12, pausas: [{ desde: '2026-11-09', hasta: '2026-11-15' }] });
  assert.equal(dia(h, reg, '2026-11-10', '2026-11-20'), 'nada');
  const t = habito({ objetivo: null });
  M.terminar(t, 'jardin', '2026-11-05');
  assert.equal(dia(t, reg, '2026-11-04', '2026-11-20'), 'fallado');
  assert.equal(dia(t, reg, '2026-11-10', '2026-11-20'), 'nada');
});

test('calendario: pasado el tiempo objetivo, sin decidir, no hay días fallados', () => {
  const reg = {}, h = habito();
  for (const l of ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23']) cumplir(reg, 'h', l, TODA);
  assert.equal(dia(h, reg, '2026-12-01', '2026-12-03'), 'nada');
});

test('calendario: el conteo anual da el porcentaje sobre días con tarea', () => {
  const reg = {}, h = habito({ objetivo: 12 });
  M.marcar(reg, 'h', '2026-11-02', { estado: 'hecho' });
  M.marcar(reg, 'h', '2026-11-03', { estado: 'hecho' });
  M.marcar(reg, 'h', '2026-11-04', { estado: 'hecho' });
  const a = M.diasDelAnio(h, reg, 2026, '2026-11-06');
  assert.equal(a.conteo.hecho, 3);
  assert.equal(a.conteo.fallado, 1);
  assert.equal(a.cumplimiento, 75);
  assert.equal(Object.keys(a.dias).length, 365);
});
