// Motor del jardín: reglas puras de hábitos, semanas y crecimiento. No toca la pantalla ni el guardado.
// El crecimiento no se guarda nunca: siempre se calcula desde el historial, así corregir un día alcanza.
(function (root) {
  const DIA_MS = 86400000;
  const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  const dos = n => String(n).padStart(2, '0');
  const aFecha = d => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  const utc = f => { const [a, m, d] = f.split('-').map(Number); return Date.UTC(a, m - 1, d); };
  const sumarDias = (f, n) => new Date(utc(f) + n * DIA_MS).toISOString().slice(0, 10);
  const diaSemana = f => (new Date(utc(f)).getUTCDay() + 6) % 7; // 0 = lunes, 6 = domingo
  const lunesDe = f => sumarDias(f, -diaSemana(f));
  const diasEntre = (a, b) => Math.round((utc(b) - utc(a)) / DIA_MS);

  // Hasta 26 semanas el plan se reparte en cuartos; con más o sin fin, plan fijo y estrellas.
  const umbrales = T => (T == null || T > 26) ? [2, 6, 12, 26] : [1, 2, 3, 4].map(k => Math.round(T * k / 4));
  const formaDe = (cumplidas, T) => umbrales(T).filter(x => cumplidas >= x).length;

  function frecuenciaEn(h, fecha) {
    let actual = h.frecuencias[0];
    for (const f of h.frecuencias) if (f.desde <= fecha) actual = f;
    return actual;
  }
  const enPausa = (h, fecha) => (h.pausas || []).some(p => p.desde <= fecha && (p.hasta == null || fecha <= p.hasta));
  const estaPausado = (h, hoy) => enPausa(h, hoy);
  const hechoEn = (registros, id, fecha) => ((registros[id] || {})[fecha] || {}).estado === 'hecho';

  function metaDeSemana(h, lunes) {
    const disponibles = [];
    for (let i = 0; i < 7; i++) {
      const f = sumarDias(lunes, i);
      if (f >= h.inicio && !enPausa(h, f)) disponibles.push(f);
    }
    if (!disponibles.length) return 0;
    const fr = frecuenciaEn(h, disponibles[0]);
    if (fr.tipo === 'semanal') return Math.round(fr.meta * disponibles.length / 7);
    if (fr.tipo === 'fijos') return disponibles.filter(f => fr.dias.includes(diaSemana(f))).length;
    return disponibles.length;
  }

  function semanas(h, registros, hoy) {
    const res = [], tope = h.fin ? h.fin.fecha : hoy;
    for (let l = lunesDe(h.inicio); l <= lunesDe(tope); l = sumarDias(l, 7)) {
      let hechos = 0;
      for (let i = 0; i < 7; i++) if (hechoEn(registros, h.id, sumarDias(l, i))) hechos++;
      const meta = metaDeSemana(h, l);
      res.push({ lunes: l, hechos, meta, evaluada: meta > 0, cumplida: meta > 0 && hechos >= meta, cerrada: sumarDias(l, 6) < hoy });
    }
    return res;
  }

  function estado(h, registros, hoy) {
    const todas = semanas(h, registros, hoy), T = h.objetivo == null ? null : h.objetivo, ext = h.extension || 0;
    let validas = todas.filter(s => s.cerrada && s.evaluada);
    if (T != null) validas = validas.slice(0, T + ext);
    if (h.fin) validas = validas.filter(s => sumarDias(s.lunes, 6) < h.fin.fecha);
    const cumplidas = validas.filter(s => s.cumplida).length, transcurridas = validas.length;
    const forma = formaDe(cumplidas, T), um = [0, ...umbrales(T)];
    const estrellas = (T == null || T > 26) ? Math.max(0, cumplidas - 26) : 0;
    const ult = validas.slice(-2);
    const terminadoPendiente = !h.fin && T != null && (transcurridas >= T + ext || cumplidas >= T);
    const sem = todas[todas.length - 1] || { hechos: 0, meta: 0 };
    return {
      semanas: todas, cumplidas, transcurridas, forma, estrellas, umbrales: um,
      mejoras: forma >= 4 ? 0 : cumplidas - um[forma],
      proxima: forma >= 4 ? null : { forma: forma + 1, faltan: um[forma + 1] - cumplidas },
      apagado: !h.fin && !enPausa(h, hoy) && ult.length === 2 && ult.every(s => !s.cumplida),
      pausado: !h.fin && enPausa(h, hoy),
      terminadoPendiente,
      faltanLegendario: T != null ? Math.max(0, T - cumplidas) : 0,
      semanaActual: { hechos: sem.hechos, meta: sem.meta }
    };
  }

  // Si toca marcarlo ese día. Un hábito hecho otro día igual se puede marcar desde "No tocan hoy".
  function toca(h, registros, fecha, hoy) {
    if (h.fin || fecha < h.inicio || enPausa(h, fecha)) return false;
    if (estado(h, registros, hoy).terminadoPendiente) return false;
    const fr = frecuenciaEn(h, fecha);
    if (fr.tipo === 'diario') return true;
    if (fr.tipo === 'fijos') return fr.dias.includes(diaSemana(fecha));
    const l = lunesDe(fecha);
    let hechos = 0;
    for (let i = 0; i < 7; i++) {
      const f = sumarDias(l, i);
      if (f !== fecha && hechoEn(registros, h.id, f)) hechos++;
    }
    return hechos < fr.meta;
  }

  // Color de cada día en el calendario: hecho, fallado, nada (no había nada que hacer), pendiente (hoy) o futuro.
  // Si lo hizo otro día de la misma semana, el día programado deja de contar como fallado.
  function estadosDeSemana(h, registros, lunes, hoy, fueraDePlazo) {
    const res = {}, reg = registros[h.id] || {}, dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
    const marca = f => (reg[f] || {}).estado;
    for (const f of dias) res[f] = f > hoy ? 'futuro' : marca(f) === 'hecho' ? 'hecho' : 'nada';
    const disp = dias.filter(f => f >= h.inicio && !enPausa(h, f) && !(h.fin && f >= h.fin.fecha));
    if (!disp.length || fueraDePlazo) return res;
    const fr = frecuenciaEn(h, disp[0]);
    const vencido = f => f < hoy || (f === hoy && marca(f) === 'no');
    if (fr.tipo === 'semanal') {
      if (h.fin && h.fin.fecha <= sumarDias(lunes, 6)) return res;
      const hechos = dias.filter(f => marca(f) === 'hecho').length, meta = metaDeSemana(h, lunes);
      if (disp.includes(hoy) && !marca(hoy) && hechos < meta) res[hoy] = 'pendiente';
      const restantes = disp.filter(f => f > hoy || (f === hoy && !marca(f))).length;
      const deuda = Math.max(0, meta - hechos - restantes);
      const cand = disp.filter(f => vencido(f) && marca(f) !== 'hecho');
      const orden = [...cand.filter(f => marca(f) === 'no'), ...cand.filter(f => marca(f) !== 'no').reverse()];
      for (const f of orden.slice(0, deuda)) res[f] = 'fallado';
      return res;
    }
    const programado = f => fr.tipo === 'diario' || fr.dias.includes(diaSemana(f));
    const faltas = disp.filter(f => programado(f) && vencido(f) && marca(f) !== 'hecho');
    const extras = dias.filter(f => marca(f) === 'hecho' && !programado(f)).length;
    for (const f of faltas.slice(extras)) res[f] = 'fallado';
    if (disp.includes(hoy) && programado(hoy) && !marca(hoy)) res[hoy] = 'pendiente';
    return res;
  }

  function diasDelAnio(h, registros, anio, hoy) {
    const e = estado(h, registros, hoy), dias = {}, conteo = { hecho: 0, fallado: 0, nada: 0, pendiente: 0, futuro: 0 };
    const validas = e.semanas.filter(s => s.cerrada && s.evaluada);
    const ultima = e.terminadoPendiente && validas.length ? validas[Math.min(validas.length, (h.objetivo || 0) + (h.extension || 0)) - 1].lunes : null;
    for (let l = lunesDe(`${anio}-01-01`); l <= `${anio}-12-31`; l = sumarDias(l, 7)) {
      const sem = estadosDeSemana(h, registros, l, hoy, ultima != null && l > ultima);
      for (const f of Object.keys(sem)) {
        if (f.slice(0, 4) !== String(anio)) continue;
        dias[f] = sem[f]; conteo[sem[f]]++;
      }
    }
    const base = conteo.hecho + conteo.fallado;
    return { dias, conteo, cumplimiento: base ? Math.round(conteo.hecho / base * 100) : null };
  }

  // Se puede corregir hasta 7 días para atrás, porque muchas veces se marca al día siguiente.
  const editable = (fecha, hoy) => fecha <= hoy && diasEntre(fecha, hoy) <= 7;

  function marcar(registros, id, fecha, entrada) {
    registros[id] = registros[id] || {};
    if (entrada) registros[id][fecha] = entrada; else delete registros[id][fecha];
  }

  // El cambio rige desde el lunes siguiente, salvo en la semana en que se creó el hábito.
  function cambiarFrecuencia(h, nueva, hoy) {
    if (lunesDe(hoy) === lunesDe(h.inicio)) { h.frecuencias = [{ ...nueva, desde: h.inicio }]; return h.inicio; }
    const desde = sumarDias(lunesDe(hoy), 7);
    h.frecuencias = h.frecuencias.filter(f => f.desde < desde);
    h.frecuencias.push({ ...nueva, desde });
    return desde;
  }

  function pausar(h, hoy) {
    h.pausas = h.pausas || [];
    if (!enPausa(h, hoy)) h.pausas.push({ desde: hoy, hasta: null });
  }
  function reanudar(h, hoy) {
    const ayer = sumarDias(hoy, -1);
    h.pausas = (h.pausas || []).map(p => p.hasta == null ? { ...p, hasta: ayer } : p).filter(p => p.desde <= p.hasta);
  }
  function extender(h, semanasMas) { h.extension = (h.extension || 0) + semanasMas; }
  function terminar(h, destino, hoy) { h.fin = { fecha: hoy, destino }; }

  const ocupado = h => !h.fin || h.fin.destino === 'jardin';
  const enJardin = habitos => habitos.filter(ocupado);
  const libres = (habitos, elenco, propio) => {
    const usados = new Set(habitos.filter(h => ocupado(h) && h.monstruo !== propio).map(h => h.monstruo));
    return elenco.filter(m => !usados.has(m.id));
  };

  function resumen(habitos, registros, hoy, dias = 7) {
    const lineas = [];
    for (let i = dias - 1; i >= 0; i--) {
      const f = sumarDias(hoy, -i), items = [];
      for (const h of habitos) {
        const r = (registros[h.id] || {})[f];
        if (!r) continue;
        const vals = (r.valores || []).map((v, n) => v === '' || v == null ? null : `${v}${h.registro.campos[n] && h.registro.campos[n].unidad ? ' ' + h.registro.campos[n].unidad : ''}`).filter(Boolean);
        items.push(`- ${h.nombre}: ${r.estado === 'hecho' ? 'hecho' : 'no hecho'}${vals.length ? ' (' + vals.join(', ') + ')' : ''}${r.nota ? '. Nota: ' + r.nota : ''}`);
      }
      if (items.length) lineas.push(`${f} (${DIAS[diaSemana(f)]})`, ...items);
    }
    return lineas.length ? `Resumen de hábitos al ${hoy}\n${lineas.join('\n')}` : `Resumen de hábitos al ${hoy}\nSin marcas en los últimos ${dias} días.`;
  }

  root.Motor = { DIAS, aFecha, sumarDias, diaSemana, lunesDe, diasEntre, umbrales, formaDe, frecuenciaEn, enPausa, estaPausado, metaDeSemana, semanas, estado, estadosDeSemana, diasDelAnio, toca, editable, marcar, cambiarFrecuencia, pausar, reanudar, extender, terminar, ocupado, enJardin, libres, resumen };
})(typeof window !== 'undefined' ? window : globalThis);
