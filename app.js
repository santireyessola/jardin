// Pantallas del jardín. Las reglas viven en motor.js y los dibujos en monstruos.js.
(function () {
  const { FORMS, ELENCO, draw } = window.Monstruos;
  const M = window.Motor;
  const CLAVE = 'jardin-v1';
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const trazo = (d, g = 2.2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    si: trazo('<path d="M5 12.5l4.6 4.6L19 7.5"/>', 3),
    no: trazo('<path d="M6 6l12 12M18 6L6 18"/>', 3),
    mas: trazo('<path d="M12 5v14M5 12h14"/>', 2.8),
    atras: trazo('<path d="M15 5l-7 7 7 7"/>', 2.6),
    adelante: trazo('<path d="M9 5l7 7-7 7"/>', 2.6),
    jardin: trazo('<path d="M12 21v-8"/><path d="M12 13c0-4 2.6-6.5 7-7 .3 4.6-2.4 7-7 7z"/><path d="M12 15.5c0-3-2-5-6-5.5-.2 3.800 2 5.500 6 5.500z"/>'),
    calendario: trazo('<rect x="3.500" y="5" width="17" height="15.500" rx="3.500"/><path d="M3.500 10h17M8 3v4M16 3v4"/>'),
    habitos: trazo('<path d="M9 6.500h11M9 12h11M9 17.500h11"/><path d="M3.800 6.500l1 1 1.800-2M3.800 12l1 1 1.800-2M3.800 17.500l1 1 1.800-2"/>'),
    ajustes: trazo('<path d="M4 7.500h9M18 7.500h2M4 16.500h2M11 16.500h9"/><circle cx="15.500" cy="7.500" r="2.500"/><circle cx="8.500" cy="16.500" r="2.500"/>'),
    editar: trazo('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.500 6.500l4 4"/>'),
    pausa: trazo('<path d="M9 5v14M15 5v14"/>', 2.6),
    seguir: trazo('<path d="M7 5l12 7-12 7z"/>'),
    bandera: trazo('<path d="M6 21V4M6 4.500c4-2 7 2 12 0v9c-5 2-8-2-12 0"/>'),
    borrar: trazo('<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l1 13h9l1-13"/>'),
    copiar: trazo('<rect x="8.500" y="8.500" width="12" height="12" rx="2.800"/><path d="M15.500 8.500V6a2.500 2.500 0 0 0-2.500-2.500H6A2.500 2.500 0 0 0 3.500 6v7A2.500 2.500 0 0 0 6 15.500h2.500"/>'),
    bajar: trazo('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
    subir: trazo('<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>'),
    simular: trazo('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.500 2M9.500 2.500h5"/>'),
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const LETRAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const TEXTO_ESTADO = { hecho: 'Cumplido', fallado: 'Fallado', nada: 'Nada que hacer', pendiente: 'Pendiente de hoy', futuro: 'Todavía no' };
  const dos = n => String(n).padStart(2, '0');
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  function cargar() {
    try {
      const d = JSON.parse(localStorage.getItem(CLAVE));
      if (d && Array.isArray(d.habitos)) return { registros: {}, ...d };
    } catch (e) { /* sin almacenamiento o datos dañados: arranca vacío */ }
    return { v: 1, habitos: [], registros: {} };
  }
  let real = cargar(), sim = null, vista = { p: 'jardin' }, diaSel = null, wiz = null, hoja = null, cola = [], cal = { id: null, anio: null }, pestana = 'jardin';
  const D = () => sim ? sim.datos : real;
  function guardar() {
    if (sim) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(real)); } catch (e) { aviso('El navegador no dejó guardar.'); }
  }
  const hoy = () => { const f = M.aFecha(new Date()); return sim ? M.sumarDias(f, sim.dias) : f; };
  const habito = id => D().habitos.find(h => h.id === id);
  const spec = h => ELENCO.find(m => m.id === h.monstruo) || ELENCO[0];
  const nuevoId = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const fechaLarga = f => { const [, m, d] = f.split('-').map(Number); return `${M.DIAS[M.diaSemana(f)]} ${d} de ${MESES[m - 1]}`; };
  const svg = (m, forma, id, quieto, sinBrillo) => `<svg ${quieto ? 'class="still"' : ''} viewBox="0 0 400 400" aria-hidden="true">${draw(m, forma, id, sinBrillo)}</svg>`;
  // Encuadre ajustado para miniaturas: los bebés se dibujan chicos dentro de la escena de 400 × 400.
  const ENCUADRE = ['90 165 220 220', '60 110 280 280', '30 60 340 340', '0 0 400 400', '0 0 400 400'];
  const miniatura = (m, forma, id) => svg(m, forma, id, true, true).replace('viewBox="0 0 400 400"', `viewBox="${ENCUADRE[forma]}"`);
  const ENCUADRE_RUTA = ['55 120 290 290', '40 85 320 320', '25 50 350 350', '10 20 380 380', '0 0 400 400'];
  const vibrar = n => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) { /* no disponible */ } };

  let avisoT = null;
  function aviso(t) {
    let el = $('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t;
    clearTimeout(avisoT);
    avisoT = setTimeout(() => el.remove(), 2600);
  }
  function chispas(x, y, n, colores) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const cols = colores || ['#12B76A', '#2EE59D', '#14396B'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'), a = Math.random() * 6.28, d = 36 + Math.random() * 80;
      c.className = 'chispa';
      c.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
      c.addEventListener('animationend', () => c.remove());
      document.body.appendChild(c);
    }
  }
  function chispasEn(el, n, colores) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    chispas(r.left + r.width / 2, r.top + r.height / 2, n, colores);
  }

  /* ---------- Jardín ---------- */
  function lugares(n) {
    const fila = (xs, abajo, ancho, z) => xs.map(x => ({ x, abajo, ancho, z }));
    if (n <= 3) return fila([50, 21, 79], 10, 44, 4);
    if (n <= 7) return [...fila([50, 18, 82], 9, 35, 4), ...fila([35, 65, 12, 88], 25, 27, 3)];
    return [...fila([50, 20, 80], 8, 29, 4), ...fila([35, 65, 9, 91], 22, 24, 3), ...fila([50, 28, 72, 8, 92], 35, 19, 2), ...fila([40, 60, 20, 80, 5, 95, 30, 70], 46, 15, 1)];
  }
  function escena(flores) {
    const pos = [[8, 84], [92, 82], [24, 88], [76, 89], [50, 86], [14, 73], [86, 72], [38, 77], [62, 76], [4, 68], [96, 67], [30, 68], [70, 66], [48, 70], [18, 61], [82, 61], [58, 62], [40, 60], [90, 57], [10, 56], [68, 55], [28, 55], [52, 54], [78, 53], [22, 51], [36, 50], [64, 49], [6, 50], [94, 49], [46, 49]];
    const fl = pos.slice(0, flores).map(([x, y], i) => {
      const r = .5 + (y - 49) * .012, col = ['#FFFFFF', '#2EE59D', '#FFFFFF', '#BFF5DC'][i % 4];
      return `<g transform="translate(${x} ${y}) scale(${r.toFixed(2)})"><path d="M0 0V-3.200" stroke="#2EE59D" stroke-width=".55"/>${[0, 72, 144, 216, 288].map(g => `<circle cx="${(Math.cos(g * Math.PI / 180) * 1.05).toFixed(2)}" cy="${(-4.2 + Math.sin(g * Math.PI / 180) * 1.05).toFixed(2)}" r=".72" fill="${col}"/>`).join('')}<circle cx="0" cy="-4.2" r=".55" fill="#12B76A"/></g>`;
    }).join('');
    return `<svg class="escena" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><circle class="tw" cx="62" cy="12" r=".45" fill="#fff"/><circle class="tw b" cx="74" cy="24" r=".4" fill="#fff"/><circle class="tw" cx="90" cy="30" r=".4" fill="#fff"/><circle class="tw b" cx="8" cy="33" r=".4" fill="#fff"/><circle class="tw b" cx="40" cy="28" r=".35" fill="#fff"/><path d="M0 46Q26 38 50 43T100 44V100H0Z" fill="#0C4A38"/><path d="M0 66Q34 58 62 63T100 62V100H0Z" fill="#0E6246"/><path d="M0 84Q30 78 60 82T100 81V100H0Z" fill="#0F7A55"/>${fl}</svg>`;
  }
  function htmlMonstruosJardin() {
    const lista = M.enJardin(D().habitos), L = lugares(lista.length), H = hoy(), pocos = lista.length <= 8;
    return lista.map((h, i) => {
      const e = M.estado(h, D().registros, H), p = L[i], t = 1 + Math.min(.12, e.mejoras * .02) + Math.min(.08, e.estrellas * .004);
      const clase = [e.apagado ? 'apagado' : '', e.pausado ? 'pausado' : ''].join(' ');
      const medalla = h.fin ? '<svg class="medalla" viewBox="0 0 24 24"><circle cx="12" cy="13" r="9" fill="#FFFFFF"/><path d="M12 8l1.500 3.100 3.400.5-2.500 2.400.6 3.400-3-1.600-3 1.600.6-3.400-2.500-2.400 3.400-.5z" fill="#12B76A"/></svg>' : '';
      return `<button type="button" class="g-mon ${clase}" data-a="tocar-mon" data-id="${h.id}" aria-label="${esc(h.nombre)}: ${FORMS[e.forma].n}" style="left:${p.x}%;bottom:${p.abajo}%;width:${p.ancho}%;z-index:${p.z}"><span class="cuerpo" style="animation-delay:-${(i * .37).toFixed(2)}s">${svg(spec(h), e.forma, 'j' + i, !pocos || e.pausado, true).replace('<svg ', `<svg style="transform:scale(${t.toFixed(3)});transform-origin:50% 86%" `)}</span>${e.pausado ? '<span class="zz">z z</span>' : ''}${medalla}</button>`;
    }).join('');
  }
  function renderJardin() {
    const el = $('monstruos-jardin');
    if (!el) return;
    const lista = M.enJardin(D().habitos), H = hoy();
    const total = lista.reduce((t, h) => t + M.estado(h, D().registros, H).cumplidas, 0);
    $('escena-jardin').innerHTML = escena(Math.min(14, Math.ceil(total / 2)));
    el.innerHTML = lista.length ? htmlMonstruosJardin() : '<div class="vacio-hero"><h2>Tu jardín te espera</h2><p>Cada hábito que crees va a hacer nacer un monstruo acá.</p></div>';
  }
  function saltar(id, n) {
    const el = document.querySelector(`.g-mon[data-id="${id}"]`);
    if (!el) return;
    el.classList.remove('salta'); void el.offsetWidth; el.classList.add('salta');
    el.addEventListener('animationend', () => el.classList.remove('salta'), { once: true });
    chispasEn(el, n || 14, ['#2EE59D', '#FFFFFF', '#12B76A']);
  }

  /* ---------- Hoy ---------- */
  function habitosDelDia(f, H) {
    const activos = D().habitos.filter(h => !h.fin);
    const pend = activos.filter(h => M.estado(h, D().registros, H).terminadoPendiente);
    const validos = activos.filter(h => !pend.includes(h) && f >= h.inicio && !M.enPausa(h, f));
    const marcado = h => !!(D().registros[h.id] || {})[f];
    const tocan = validos.filter(h => M.toca(h, D().registros, f, H) || marcado(h));
    const otros = validos.filter(h => !tocan.includes(h));
    const hechos = tocan.filter(h => ((D().registros[h.id] || {})[f] || {}).estado === 'hecho').length;
    return { activos, pend, tocan, otros, hechos };
  }
  function filaHabito(h, f, H) {
    const r = (D().registros[h.id] || {})[f], e = M.estado(h, D().registros, H), m = M.metaDeSemana(h, M.lunesDe(f));
    const sem = e.semanas.find(s => s.lunes === M.lunesDe(f)) || { hechos: 0 };
    const barra = Array.from({ length: m }, (_, i) => `<i class="${i < sem.hechos ? 'on' : ''}"></i>`).join('');
    const valores = r && r.valores ? r.valores.map((v, i) => v === '' || v == null ? '' : `${esc(v)}${h.registro.campos[i] && h.registro.campos[i].unidad ? ' ' + esc(h.registro.campos[i].unidad) : ''}`).filter(Boolean).join(' · ') : '';
    const num = h.registro.tipo === 'numero';
    return `<article class="fila-h ${r ? r.estado : ''}">
      <button type="button" class="sq" data-a="ficha" data-id="${h.id}" aria-label="Ver ficha de ${esc(h.nombre)}">${miniatura(spec(h), e.forma, 'c' + h.id + f)}</button>
      <button type="button" class="info" data-a="detalle" data-id="${h.id}" data-f="${f}"><strong>${esc(h.nombre)}</strong><span class="sub num">${valores || (r && r.nota ? 'Con nota' : `${sem.hechos} de ${m} esta semana`)}</span><span class="barra">${barra}</span></button>
      <span class="acciones">
        <button type="button" class="marca nop ${r && r.estado === 'no' ? 'on' : ''}" data-a="marcar-no" data-id="${h.id}" data-f="${f}" aria-label="No lo hice" aria-pressed="${!!(r && r.estado === 'no')}">${IC.no}</button>
        <button type="button" class="marca si ${r && r.estado === 'hecho' ? 'on' : ''}" data-a="${num ? 'detalle' : 'marcar-si'}" data-id="${h.id}" data-f="${f}" aria-label="Lo hice" aria-pressed="${!!(r && r.estado === 'hecho')}">${IC.si}</button>
      </span></article>`;
  }
  function renderAnillo() {
    const el = $('anillo');
    if (!el) return;
    const H = hoy(), { tocan, hechos } = habitosDelDia(H, H), C = 2 * Math.PI * 26, frac = tocan.length ? hechos / tocan.length : 0;
    el.hidden = !tocan.length;
    el.setAttribute('aria-label', `${hechos} de ${tocan.length} hábitos de hoy`);
    el.innerHTML = `<svg viewBox="0 0 60 60"><circle class="pista" cx="30" cy="30" r="26"/><circle class="valor" cx="30" cy="30" r="26" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - frac)).toFixed(1)}"/></svg><span>${hechos}/${tocan.length}</span>`;
  }
  function tiraDias(f, H) {
    let html = '';
    for (let i = 7; i >= 0; i--) {
      const d = M.sumarDias(H, -i), info = habitosDelDia(d, H);
      const punto = !info.tocan.length ? '' : info.hechos >= info.tocan.length ? 'total' : 'parcial';
      html += `<button type="button" data-a="dia" data-f="${d}" aria-pressed="${d === f}" aria-label="${fechaLarga(d)}"><span>${LETRAS[M.diaSemana(d)]}</span><b>${+d.slice(8)}</b><i class="${punto}"></i></button>`;
    }
    return `<div class="tira">${html}</div>`;
  }
  function renderHoy() {
    const el = $('hoy');
    if (!el) return;
    const H = hoy(), f = diaSel && M.editable(diaSel, H) ? diaSel : H;
    diaSel = f;
    const { activos, pend, tocan, otros, hechos } = habitosDelDia(f, H), pausa = activos.filter(h => M.enPausa(h, H));
    const abierto = el.querySelector('details') && el.querySelector('details').open;
    let cuerpo;
    if (!D().habitos.length) cuerpo = `<div class="vacia"><p class="sub">Creá tu primer hábito, elegí cada cuánto lo vas a hacer y conocé a tu primer monstruo.</p><button type="button" class="btn pri" data-a="crear">Crear mi primer hábito</button></div>`;
    else cuerpo = `${pend.map(h => `<button type="button" class="aviso" data-a="ficha" data-id="${h.id}">Terminó el tiempo de ${esc(h.nombre)}. Tocá para decidir qué pasa con su monstruo.</button>`).join('')}
      ${tocan.length ? `<div class="lista">${tocan.map(h => filaHabito(h, f, H)).join('')}</div>` : `<p class="sub">No hay nada programado para este día.</p>`}
      ${otros.length ? `<details ${abierto ? 'open' : ''}><summary>No tocan este día (${otros.length})</summary><div class="lista">${otros.map(h => filaHabito(h, f, H)).join('')}</div></details>` : ''}
      ${pausa.length ? `<p class="sub">En pausa: ${pausa.map(h => esc(h.nombre)).join(', ')}.</p>` : ''}`;
    const titulo = f === H ? 'Hoy' : f === M.sumarDias(H, -1) ? 'Ayer' : cap(fechaLarga(f));
    el.innerHTML = `<div class="bloque">${tiraDias(f, H)}</div><div class="bloque pila"><div class="titulo-fila"><h2>${titulo}</h2>${tocan.length ? `<span class="sub num">${hechos} de ${tocan.length} hechos</span>` : ''}</div>${cuerpo}</div>`;
    renderAnillo();
  }

  /* ---------- Estructura común ---------- */
  function barraInferior() {
    const tab = (p, ic, t) => `<button type="button" class="tab" data-a="tab" data-v="${p}" ${pestana === p ? 'aria-current="page"' : ''}>${ic}<span>${t}</span></button>`;
    const quedan = M.libres(D().habitos, ELENCO).length;
    return `<nav class="tabs" aria-label="Secciones">${tab('jardin', IC.jardin, 'Jardín')}${tab('calendario', IC.calendario, 'Calendario')}<button type="button" class="tab-mas" data-a="crear" aria-label="Nuevo hábito" ${quedan ? '' : 'disabled'}>${IC.mas}</button>${tab('habitos', IC.habitos, 'Hábitos')}${tab('ajustes', IC.ajustes, 'Ajustes')}</nav>`;
  }
  function barraSim() {
    if (!sim) return '';
    return `<div class="sim"><span>Simulador: ${fechaLarga(hoy())}. Nada se guarda.</span><div class="botones"><button type="button" data-a="sim-dia">+1 día</button><button type="button" data-a="sim-semana">+1 sem.</button><button type="button" data-a="sim-cumplir">Cumplir</button><button type="button" class="salir" data-a="sim-salir">Salir</button></div></div>`;
  }
  function render(animar) {
    const app = $('app'), v = vista.p;
    let html = '';
    if (v === 'jardin') html = vistaJardin();
    else if (v === 'crear') html = vistaAsistente();
    else if (v === 'ficha') html = vistaFicha();
    else if (v === 'calendario') html = vistaCalendario();
    else if (v === 'habitos') html = vistaHabitos();
    else if (v === 'ajustes') html = vistaAjustes();
    const conBarra = v !== 'crear';
    app.innerHTML = `<div class="${animar ? 'entrar' : ''}">${html}</div>${conBarra ? barraSim() + barraInferior() : ''}`;
    if (v === 'jardin') { renderJardin(); renderHoy(); revisarCrecimiento(); }
    pintarHoja();
  }
  const ir = (p, extra) => { vista = { p, ...extra }; if (['jardin', 'calendario', 'habitos', 'ajustes'].includes(p)) pestana = p; render(true); window.scrollTo(0, 0); };
  function vistaJardin() {
    const h24 = new Date().getHours(), H = hoy();
    return `<header class="hero ${h24 >= 7 && h24 < 19 ? 'dia' : ''}"><div id="escena-jardin"></div><div class="hero-top"><div><p class="fecha">${cap(fechaLarga(H))}</p><h1>Jardín</h1></div><div class="anillo" id="anillo" role="img"></div></div><div id="monstruos-jardin"></div></header><main class="hoja-blanca" id="hoy"></main>`;
  }

  /* ---------- Asistente de crear y editar ---------- */
  function abrirAsistente(h) {
    wiz = h ? (() => {
      const fr = h.frecuencias[h.frecuencias.length - 1];
      return { paso: 1, id: h.id, nombre: h.nombre, tipo: h.registro.tipo, campos: h.registro.campos.map(c => ({ ...c })), frec: fr.tipo, dias: fr.dias ? [...fr.dias] : [], meta: fr.meta || 3, objetivo: h.objetivo, monstruo: h.monstruo };
    })() : { paso: 1, id: null, nombre: '', tipo: 'sino', campos: [{ nombre: '', unidad: '' }], frec: 'diario', dias: [], meta: 3, objetivo: 8, monstruo: null, error: '' };
    if (h && !wiz.campos.length) wiz.campos = [{ nombre: '', unidad: '' }];
    ir('crear');
  }
  function rutaHtml(m, T, formaActual) {
    const um = [0, ...M.umbrales(T)];
    return `<div class="ruta">${FORMS.map((f, k) => `<div class="${formaActual === k ? 'on' : ''} ${formaActual != null && k > formaActual ? 'off' : ''}"><span class="sq">${svg(m, k, 'p' + k, true, true).replace('viewBox="0 0 400 400"', `viewBox="${ENCUADRE_RUTA[k]}"`)}</span><span>${f.n}</span><small>${k ? 'sem. ' + um[k] : 'inicio'}</small></div>`).join('')}</div>`;
  }
  const opcion = (a, v, on, titulo, texto) => `<button type="button" class="opcion ${on ? 'on' : ''}" data-a="${a}" data-v="${v}" aria-pressed="${on}"><span><b>${titulo}</b><span class="sub">${texto}</span></span><i class="radio"></i></button>`;
  function vistaAsistente() {
    const w = wiz, TITULOS = ['¿Qué querés registrar?', '¿Cada cuánto?', '¿Por cuánto tiempo?', 'Elegí tu monstruo'];
    const libresList = M.libres(D().habitos, ELENCO, w.monstruo);
    let cuerpo = '';
    if (w.paso === 1) {
      const campos = w.tipo === 'numero' ? w.campos.map((c, i) => `<div style="display:grid;grid-template-columns:2fr 1fr;gap:8px"><label>Dato ${i + 1}<input id="campo-n${i}" data-c="${i}" data-k="nombre" value="${esc(c.nombre)}" placeholder="Ej: Páginas" maxlength="24"></label><label>Unidad<input id="campo-u${i}" data-c="${i}" data-k="unidad" value="${esc(c.unidad)}" placeholder="Ej: pág" maxlength="10"></label></div>`).join('') + `<button type="button" class="link" data-a="w-campos" style="justify-self:start">${w.campos.length < 2 ? 'Sumar otro dato' : 'Dejar un solo dato'}</button>` : '';
      cuerpo = `<label>Nombre del hábito<input id="w-nombre" value="${esc(w.nombre)}" placeholder="Ej: Leer 20 minutos" maxlength="40"></label>
        ${opcion('w-tipo', 'sino', w.tipo === 'sino', 'Sí o no', 'Marcás si lo hiciste. Podés sumar una nota.')}
        ${opcion('w-tipo', 'numero', w.tipo === 'numero', 'Con números', 'Anotás uno o dos datos cada día.')}${campos}`;
    } else if (w.paso === 2) {
      cuerpo = `${opcion('w-frec', 'diario', w.frec === 'diario', 'Todos los días', 'Meta de 7 por semana.')}
        ${opcion('w-frec', 'fijos', w.frec === 'fijos', 'Días fijos', 'Elegís los días. Si lo hacés otro día, cuenta igual.')}
        ${w.frec === 'fijos' ? `<div class="dias">${LETRAS.map((l, i) => `<button type="button" class="${w.dias.includes(i) ? 'on' : ''}" data-a="w-dia" data-v="${i}" aria-label="${M.DIAS[i]}" aria-pressed="${w.dias.includes(i)}">${l}</button>`).join('')}</div>` : ''}
        ${opcion('w-frec', 'semanal', w.frec === 'semanal', 'Sin días fijos', 'Una cantidad por semana, cuando puedas.')}
        ${w.frec === 'semanal' ? `<div class="contador"><button type="button" data-a="w-meta" data-n="-1" aria-label="Menos">−</button><div><b>${w.meta}</b></div><button type="button" data-a="w-meta" data-n="1" aria-label="Más">+</button></div><p class="sub" style="text-align:center">${w.meta === 1 ? 'vez' : 'veces'} por semana</p>` : ''}
        ${w.id ? '<p class="sub">Si cambiás la frecuencia, rige desde el lunes que viene.</p>' : ''}`;
    } else if (w.paso === 3) {
      const m = libresList.find(x => x.id === w.monstruo) || libresList[0] || ELENCO[0];
      const T = w.objetivo, chips = [4, 8, 12, 26, 52];
      cuerpo = `<div class="chips">${chips.map(n => `<button type="button" class="chip ${T === n ? 'on' : ''}" data-a="w-obj" data-v="${n}">${n} semanas</button>`).join('')}<button type="button" class="chip ${T == null ? 'on' : ''}" data-a="w-obj" data-v="">Sin fin</button></div>
        <label>Otra cantidad de semanas<input id="w-otro" type="number" inputmode="numeric" min="4" max="156" value="${T != null && !chips.includes(T) ? T : ''}" placeholder="Mínimo 4"></label>
        <h3 style="margin-top:8px">Así va a crecer</h3><div id="w-plan">${rutaHtml(m, T)}</div>
        <p class="sub" id="w-nota">${T == null || T > 26 ? 'Las semanas cuentan cuando cumplís la meta. Desde la 26, suma una estrella por semana.' : 'Las semanas cuentan cuando cumplís la meta. Al terminar, se puede quedar en el jardín.'}</p>`;
    } else {
      const m = libresList.find(x => x.id === w.monstruo);
      cuerpo = `${m ? `<h3>${esc(m.nombre)}</h3>${rutaHtml(m, w.objetivo)}` : '<p class="sub">Tocá uno para ver cómo va a crecer.</p>'}
        <div class="elenco">${libresList.map((x, i) => `<button type="button" class="${x.id === w.monstruo ? 'on' : ''}" data-a="w-mon" data-v="${x.id}" aria-label="${esc(x.nombre)}" aria-pressed="${x.id === w.monstruo}">${miniatura(x, 0, 'e' + i)}</button>`).join('')}</div>`;
    }
    return `<div class="asistente"><div class="bloque barra-sup"><button type="button" class="volver" data-a="w-atras" aria-label="Volver">${IC.atras}</button><div class="progreso" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${w.paso}"><i style="width:${w.paso * 25}%"></i></div><span class="sub num">${w.paso}/4</span></div>
      <div class="bloque cuerpo-a"><h1>${TITULOS[w.paso - 1]}</h1>${cuerpo}${w.error ? `<p class="error" role="alert">${esc(w.error)}</p>` : ''}</div>
      <div class="bloque pie-a"><button type="button" class="btn pri" data-a="w-seguir">${w.paso < 4 ? 'Seguir' : w.id ? 'Guardar cambios' : 'Crear hábito'}</button></div></div>`;
  }
  function validarPaso() {
    const w = wiz;
    if (w.paso === 1) {
      if (!w.nombre.trim()) return 'Ponele un nombre al hábito.';
      if (w.tipo === 'numero' && w.campos.some(c => !c.nombre.trim())) return 'Ponele nombre a cada dato.';
    }
    if (w.paso === 2 && w.frec === 'fijos' && !w.dias.length) return 'Elegí al menos un día.';
    if (w.paso === 3 && w.objetivo != null && (!Number.isInteger(w.objetivo) || w.objetivo < 4)) return 'El tiempo objetivo mínimo es de 4 semanas.';
    if (w.paso === 4 && !w.monstruo) return 'Elegí un monstruo.';
    return '';
  }
  function frecuenciaDe(w) {
    if (w.frec === 'fijos') return { tipo: 'fijos', dias: [...w.dias].sort((a, b) => a - b) };
    if (w.frec === 'semanal') return { tipo: 'semanal', meta: w.meta };
    return { tipo: 'diario' };
  }
  function terminarAsistente() {
    const w = wiz, H = hoy();
    const registro = { tipo: w.tipo, campos: w.tipo === 'numero' ? w.campos.map(c => ({ nombre: c.nombre.trim(), unidad: c.unidad.trim() })) : [] };
    if (w.id) {
      const h = habito(w.id), fr = frecuenciaDe(w), { desde, ...vieja } = h.frecuencias[h.frecuencias.length - 1];
      h.nombre = w.nombre.trim(); h.registro = registro; h.objetivo = w.objetivo; h.monstruo = w.monstruo;
      if (JSON.stringify(vieja) !== JSON.stringify(fr)) M.cambiarFrecuencia(h, fr, H);
      guardar(); wiz = null; ir('ficha', { id: h.id });
      return;
    }
    const h = { id: nuevoId(), nombre: w.nombre.trim(), monstruo: w.monstruo, inicio: H, objetivo: w.objetivo, registro, frecuencias: [{ ...frecuenciaDe(w), desde: H }], pausas: [], visto: { forma: 0, estrellas: 0 } };
    D().habitos.push(h);
    guardar(); wiz = null; diaSel = H; ir('jardin');
    setTimeout(() => saltar(h.id, 22), 90);
  }

  /* ---------- Calendario ---------- */
  function mesGrande(h, anio, m, H) {
    const mapa = M.diasDelAnio(h, D().registros, anio, H).dias, pri = `${anio}-${dos(m + 1)}-01`, n = new Date(Date.UTC(anio, m + 1, 0)).getUTCDate();
    let c = LETRAS.map(l => `<span>${l}</span>`).join('') + '<i></i>'.repeat(M.diaSemana(pri));
    for (let i = 1; i <= n; i++) {
      const f = `${anio}-${dos(m + 1)}-${dos(i)}`, est = mapa[f], clase = `c ${est} ${f === H ? 'hoy' : ''}`, txt = `${fechaLarga(f)}: ${TEXTO_ESTADO[est]}`;
      c += !h.fin && M.editable(f, H) && f >= h.inicio ? `<button type="button" class="${clase}" data-a="detalle" data-id="${h.id}" data-f="${f}" aria-label="${txt}">${i}</button>` : `<div class="${clase}" role="img" aria-label="${txt}">${i}</div>`;
    }
    return `<div class="mes-grande">${c}</div>`;
  }
  function mesMini(anio, m, mapa) {
    const pri = `${anio}-${dos(m + 1)}-01`, n = new Date(Date.UTC(anio, m + 1, 0)).getUTCDate();
    let c = '<i class="d vacia-d"></i>'.repeat(M.diaSemana(pri));
    for (let i = 1; i <= n; i++) c += `<i class="d ${mapa[`${anio}-${dos(m + 1)}-${dos(i)}`]}"></i>`;
    const cuenta = est => Object.keys(mapa).filter(f => f.slice(5, 7) === dos(m + 1) && mapa[f] === est).length;
    return `<button type="button" class="mes" data-a="mes" data-m="${m}" aria-label="${cap(MESES[m])}: ${cuenta('hecho')} cumplidos, ${cuenta('fallado')} fallados"><b>${cap(MESES[m]).slice(0, 3)}</b><span class="mes-grid">${c}</span></button>`;
  }
  const leyenda = `<div class="leyenda"><span><i class="d muestra hecho"></i>Cumplido</span><span><i class="d muestra fallado"></i>Fallado</span><span><i class="d muestra nada"></i>Nada que hacer</span><span><i class="d muestra futuro"></i>Todavía no</span></div>`;
  function vistaCalendario() {
    const lista = D().habitos, H = hoy(), anioH = +H.slice(0, 4);
    if (!lista.length) return `<main class="sin-hero bloque"><h1>Calendario</h1><div class="vacia"><p class="sub">Cuando crees un hábito, acá vas a ver todo su año, día por día.</p><button type="button" class="btn pri" data-a="crear">Crear mi primer hábito</button></div></main>`;
    if (!habito(cal.id)) cal.id = (lista.find(h => !h.fin) || lista[0]).id;
    if (!cal.anio) cal.anio = anioH;
    const h = habito(cal.id), a = M.diasDelAnio(h, D().registros, cal.anio, H), minAnio = +h.inicio.slice(0, 4);
    const selector = lista.map((x, i) => `<button type="button" data-a="cal-habito" data-id="${x.id}" aria-pressed="${x.id === h.id}"><i class="sq">${miniatura(spec(x), M.estado(x, D().registros, H).forma, 's' + i)}</i><span>${esc(x.nombre)}</span></button>`).join('');
    return `<main class="sin-hero bloque"><h1>Calendario</h1>
      <div class="selector" role="group" aria-label="Elegí un hábito">${selector}</div>
      <div class="anio"><button type="button" data-a="cal-anio" data-n="-1" aria-label="Año anterior" ${cal.anio > minAnio ? '' : 'disabled'}>${IC.atras}</button><b>${cal.anio}</b><button type="button" data-a="cal-anio" data-n="1" aria-label="Año siguiente" ${cal.anio < anioH ? '' : 'disabled'}>${IC.adelante}</button></div>
      <div class="datos"><div><b class="verde">${a.conteo.hecho}</b><small>días cumplidos</small></div><div><b class="rojo">${a.conteo.fallado}</b><small>días fallados</small></div><div><b>${a.cumplimiento == null ? '–' : a.cumplimiento + '%'}</b><small>cumplimiento</small></div></div>
      <div class="anual">${MESES.map((_, m) => mesMini(cal.anio, m, a.dias)).join('')}</div>
      ${leyenda}<p class="sub">Tocá un mes para verlo en grande. Si lo hiciste otro día de la misma semana, el día programado no cuenta como fallado.</p></main>`;
  }

  /* ---------- Hábitos ---------- */
  function textoFrecuencia(h, H) {
    const fr = M.frecuenciaEn(h, H);
    if (fr.tipo === 'diario') return 'Todos los días';
    if (fr.tipo === 'fijos') return fr.dias.map(d => M.DIAS[d].slice(0, 3)).join(', ');
    return `${fr.meta} ${fr.meta === 1 ? 'vez' : 'veces'} por semana`;
  }
  function vistaHabitos() {
    const H = hoy(), todos = D().habitos;
    if (!todos.length) return `<main class="sin-hero bloque"><h1>Hábitos</h1><div class="vacia"><p class="sub">Todavía no creaste ninguno.</p><button type="button" class="btn pri" data-a="crear">Crear mi primer hábito</button></div></main>`;
    const fila = (h, i) => {
      const e = M.estado(h, D().registros, H);
      const estado = h.fin ? (h.fin.destino === 'jardin' ? 'En el jardín' : 'Liberado') : e.pausado ? 'En pausa' : textoFrecuencia(h, H);
      return `<button type="button" class="item" data-a="ficha" data-id="${h.id}"><i class="sq" style="width:48px;height:48px;border-radius:14px">${miniatura(spec(h), e.forma, 'l' + i + h.id)}</i><span>${esc(h.nombre)}<small>${FORMS[e.forma].n} · ${esc(estado)}</small></span>${IC.chev}</button>`;
    };
    const grupo = (t, l) => l.length ? `<section class="pila" style="gap:8px"><h3>${t}</h3><div class="grupo">${l.map(fila).join('')}</div></section>` : '';
    const activos = todos.filter(h => !h.fin && !M.enPausa(h, H)), pausa = todos.filter(h => !h.fin && M.enPausa(h, H));
    const jardin = todos.filter(h => h.fin && h.fin.destino === 'jardin'), lib = todos.filter(h => h.fin && h.fin.destino === 'liberado');
    const ocupados = M.enJardin(todos).length;
    return `<main class="sin-hero bloque"><div><h1>Hábitos</h1><p class="sub num">${ocupados} de ${ELENCO.length} monstruos en tu jardín</p></div>${grupo('Activos', activos)}${grupo('En pausa', pausa)}${grupo('Terminados', jardin)}${grupo('Liberados', lib)}</main>`;
  }

  /* ---------- Ficha ---------- */
  function vistaFicha() {
    const h = habito(vista.id);
    if (!h) { vista = { p: pestana }; setTimeout(render); return ''; }
    const H = hoy(), e = M.estado(h, D().registros, H), m = spec(h), T = h.objetivo;
    let estadoTxt = e.proxima ? (e.proxima.faltan === 1 ? 'Falta 1 semana cumplida' : `Faltan ${e.proxima.faltan} semanas cumplidas`) + ` para ${FORMS[e.proxima.forma].n}.` : (T == null || T > 26) ? 'Legendario. Suma una estrella por cada semana cumplida.' : 'Llegó a Legendario.';
    if (h.fin) estadoTxt = `Hábito terminado el ${fechaLarga(h.fin.fecha)}.`;
    else if (e.pausado) estadoTxt = 'En pausa. Está durmiendo y no pierde nada.';
    else if (e.terminadoPendiente) estadoTxt = '';
    else if (e.apagado) estadoTxt = 'Está apagado: dos semanas sin cumplir. Vuelve a brillar con la próxima semana cumplida.';
    const racha = (() => { let n = 0; const v = e.semanas.filter(s => s.cerrada && s.evaluada); for (let i = v.length - 1; i >= 0 && v[i].cumplida; i--) n++; return n; })();
    const decision = e.terminadoPendiente ? `<div class="grupo" style="padding:16px;display:grid;gap:12px"><h3>Terminó el tiempo objetivo</h3><p class="sub">${FORMS[e.forma].n}, con ${e.cumplidas} de ${T} semanas cumplidas. ¿Qué hacemos?</p><div class="dos-btn">
        ${e.faltanLegendario > 0 ? `<button type="button" class="btn pri" data-a="extender" data-n="${e.faltanLegendario}">Extender ${e.faltanLegendario} ${e.faltanLegendario === 1 ? 'semana' : 'semanas'}</button>` : ''}
        <button type="button" class="btn ${e.faltanLegendario > 0 ? '' : 'pri'}" data-a="fin" data-v="jardin">Se queda en el jardín</button><button type="button" class="btn borde" data-a="fin" data-v="liberado">Liberarlo</button></div></div>` : '';
    const nums = h.registro.tipo === 'numero' ? Object.entries(D().registros[h.id] || {}).filter(([, r]) => r.estado === 'hecho' && r.valores && r.valores.some(v => v !== '')).sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 7) : [];
    const mesH = +H.slice(5, 7) - 1, anioH = +H.slice(0, 4);
    return `<header class="hero-ficha"><svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${esc(m.nombre)}, forma ${FORMS[e.forma].n}"><path d="M0 348Q110 322 200 334T400 340V400H0Z" fill="#0C4A38"/><path d="M0 372Q130 352 240 366T400 362V400H0Z" fill="#0F7A55"/><g id="ficha-mon" class="jumper tocable" data-a="ficha-saltar" style="${e.apagado ? 'filter:saturate(.25) brightness(.62)' : ''}">${draw(m, e.forma, 'f')}</g></svg>
        <div class="barra-sup"><button type="button" class="volver" data-a="volver" aria-label="Volver">${IC.atras}</button>${e.estrellas ? `<span class="estrellas num">★ ${e.estrellas}</span>` : ''}</div></header>
      <main class="hoja-blanca"><div class="bloque pila" style="gap:16px">
        <div><h1 style="font-size:26px">${esc(h.nombre)}</h1><p class="sub">${esc(m.nombre)} · ${FORMS[e.forma].n}</p></div>
        ${estadoTxt ? `<p style="font-weight:600">${esc(estadoTxt)}</p>` : ''}${decision}
        <div class="datos"><div><b>${e.cumplidas}</b><small>semanas cumplidas</small></div><div><b>${racha}</b><small>racha de semanas</small></div><div><b>${e.semanaActual.hechos}/${e.semanaActual.meta}</b><small>esta semana</small></div></div>
        <section class="pila"><h3>Plan de crecimiento</h3>${rutaHtml(m, T, e.forma)}<p class="sub">${esc(textoFrecuencia(h, H))} · ${T == null ? 'Sin fin' : `Tiempo objetivo: ${T} semanas${h.extension ? ` + ${h.extension}` : ''}`}</p></section>
        <section class="pila"><div class="titulo-fila"><h3>${cap(MESES[mesH])}</h3><button type="button" class="link" data-a="ver-anio">Ver todo el año${IC.adelante}</button></div>${mesGrande(h, anioH, mesH, H)}${leyenda}</section>
        ${nums.length ? `<section class="pila" style="gap:4px"><h3>Últimos datos</h3><div class="valores">${nums.map(([f, r]) => `<div><span>${esc(f.slice(8))}/${esc(f.slice(5, 7))}</span><span>${r.valores.map((v, i) => v === '' ? '' : `${esc(v)} ${esc((h.registro.campos[i] || {}).unidad || '')}`).filter(Boolean).join(' · ')}</span></div>`).join('')}</div></section>` : ''}
        <div class="grupo">
          ${h.fin ? '' : `<button type="button" class="item" data-a="editar">${IC.editar}<span>Editar hábito</span>${IC.chev}</button><button type="button" class="item" data-a="${e.pausado ? 'reanudar' : 'pausar'}">${e.pausado ? IC.seguir : IC.pausa}<span>${e.pausado ? 'Reanudar' : 'Pausar'}<small>${e.pausado ? '' : 'Para viajes o semanas sin poder hacerlo'}</small></span></button><button type="button" class="item" data-a="preguntar-fin">${IC.bandera}<span>Terminar hábito</span></button>`}
          ${h.fin && h.fin.destino === 'jardin' ? `<button type="button" class="item" data-a="fin" data-v="liberado">${IC.bandera}<span>Liberar monstruo</span></button>` : ''}
          <button type="button" class="item rojo" data-a="preguntar-borrar">${IC.borrar}<span>Borrar hábito</span></button>
        </div></div></main>`;
  }

  /* ---------- Ajustes ---------- */
  function vistaAjustes() {
    return `<main class="sin-hero bloque"><h1>Ajustes</h1>
      <section class="pila" style="gap:8px"><h3>Tus datos</h3><div class="grupo">
        <button type="button" class="item" data-a="copiar-resumen">${IC.copiar}<span>Copiar resumen<small>Los últimos 7 días, para pegar en el chat con Claude</small></span></button>
        <button type="button" class="item" data-a="exportar">${IC.bajar}<span>Exportar copia de seguridad<small>Tus datos viven solo en este teléfono</small></span></button>
        <button type="button" class="item" data-a="mostrar-importar">${IC.subir}<span>Importar copia de seguridad<small>Reemplaza lo que hay en este teléfono</small></span></button>
      </div></section>
      <section class="pila" style="gap:8px"><h3>Probar</h3><div class="grupo"><button type="button" class="item" data-a="${sim ? 'sim-salir' : 'sim-entrar'}">${IC.simular}<span>${sim ? 'Salir del simulador' : 'Simulador de semanas'}<small>Adelantá el tiempo para ver crecer a tus monstruos, sin tocar tus datos</small></span></button></div></section></main>`;
  }
  function copiar(texto, listo, alFallar) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(listo, alFallar); else alFallar();
  }

  /* ---------- Hojas ---------- */
  function hojaDetalle() {
    const h = habito(hoja.id), f = hoja.f, r = (D().registros[h.id] || {})[f], num = h.registro.tipo === 'numero';
    return `<div><h2>${esc(h.nombre)}</h2><p class="sub">${cap(fechaLarga(f))}</p></div>
      ${num ? h.registro.campos.map((c, i) => `<label>${esc(c.nombre)}${c.unidad ? ` (${esc(c.unidad)})` : ''}<input id="h-valor${i}" type="text" inputmode="decimal" value="${esc(r && r.valores ? r.valores[i] : '')}" style="font-size:22px;font-weight:700"></label>`).join('') : ''}
      <label>Nota (opcional)<textarea id="h-nota" rows="2" maxlength="300">${esc(r ? r.nota : '')}</textarea></label>
      <p class="error" id="h-error" role="alert"></p>
      <button type="button" class="btn ok" data-a="h-hecho">Lo hice</button>
      <div class="dos-btn"><button type="button" class="btn" data-a="h-no">No lo hice</button>${r ? '<button type="button" class="btn borde" data-a="h-borrar">Borrar marca</button>' : ''}</div>`;
  }
  function hojaMes() {
    const h = habito(hoja.id), a = M.diasDelAnio(h, D().registros, hoja.anio, hoy()).dias;
    const pre = `${hoja.anio}-${dos(hoja.m + 1)}`, cuenta = est => Object.keys(a).filter(f => f.startsWith(pre) && a[f] === est).length;
    return `<div class="titulo-fila"><h2>${cap(MESES[hoja.m])} ${hoja.anio}</h2><span class="sub num">${cuenta('hecho')} cumplidos · ${cuenta('fallado')} fallados</span></div>${mesGrande(h, hoja.anio, hoja.m, hoy())}${leyenda}`;
  }
  function hojaConfirma() {
    const h = habito(vista.id), m = spec(h);
    if (hoja.tipo === 'borrar') return `<h2>¿Borrar ${esc(h.nombre)}?</h2><p class="sub">Se borra con todo su historial y no se puede deshacer.</p><button type="button" class="btn peligro" data-a="borrar-si">Borrar hábito</button><button type="button" class="btn" data-a="h-cerrar">Cancelar</button>`;
    return `<h2>Terminar ${esc(h.nombre)}</h2><p class="sub">¿Qué pasa con ${esc(m.nombre)}?</p><button type="button" class="btn pri" data-a="fin" data-v="jardin">Se queda en el jardín</button><button type="button" class="btn borde" data-a="fin" data-v="liberado">Liberarlo</button><button type="button" class="btn" data-a="h-cerrar">Cancelar</button>`;
  }
  function hojaCopia() {
    if (hoja.tipo === 'exportar') return `<h2>Copia de seguridad</h2><p class="sub">Copiá este texto y guardalo donde quieras.</p><textarea id="texto-copia" class="copia" readonly aria-label="Copia de seguridad">${esc(JSON.stringify(real))}</textarea><button type="button" class="btn pri" data-a="copiar-texto">Copiar</button>`;
    return `<h2>Importar copia</h2><label>Pegá acá la copia<textarea id="texto-importar" class="copia"></textarea></label><p class="sub">Reemplaza todo lo que hay en este teléfono.</p><p class="error" id="h-error" role="alert"></p><button type="button" class="btn pri" data-a="importar">Reemplazar mis datos</button>`;
  }
  function pintarHoja() {
    let el = $('hoja-fondo');
    if (!hoja) { if (el) el.remove(); return; }
    const nueva = !el;
    if (nueva) { el = document.createElement('div'); el.id = 'hoja-fondo'; el.className = 'fondo'; el.dataset.a = 'hoja-fuera'; document.body.appendChild(el); }
    const cont = { detalle: hojaDetalle, mes: hojaMes, borrar: hojaConfirma, terminar: hojaConfirma, exportar: hojaCopia, importar: hojaCopia }[hoja.tipo]();
    el.innerHTML = `<div class="hoja" role="dialog" aria-modal="true"><i class="tirador"></i>${cont}</div>`;
    if (!nueva) { el.style.animation = 'none'; el.firstChild.style.animation = 'none'; }
    if (hoja.tipo === 'detalle' && habito(hoja.id).registro.tipo === 'numero') { const p = el.querySelector('input'); if (p) p.focus(); }
  }
  function guardarHoja(estado) {
    const h = habito(hoja.id), f = hoja.f, nota = ($('h-nota').value || '').trim();
    const valores = h.registro.tipo === 'numero' ? h.registro.campos.map((_, i) => ($(`h-valor${i}`).value || '').trim().replace(',', '.')) : undefined;
    if (estado === 'hecho' && valores && valores.some(v => v !== '' && isNaN(+v))) { $('h-error').textContent = 'Los datos tienen que ser números.'; return; }
    const antes = ((D().registros[h.id] || {})[f] || {}).estado, e = { estado };
    if (valores) e.valores = estado === 'hecho' ? valores : [];
    if (nota) e.nota = nota;
    M.marcar(D().registros, h.id, f, e);
    guardar(); hoja = null; pintarHoja(); refrescar();
    if (estado === 'hecho' && antes !== 'hecho') { saltar(h.id, 16); vibrar(20); }
  }
  function refrescar() { if (vista.p === 'jardin') { renderHoy(); renderJardin(); } else render(); }

  /* ---------- Crecimiento ---------- */
  function revisarCrecimiento() {
    if (cola.length || document.querySelector('.creció')) return;
    const H = hoy();
    for (const h of M.enJardin(D().habitos)) {
      const e = M.estado(h, D().registros, H), v = h.visto || { forma: 0, estrellas: 0 };
      if (e.forma > v.forma || e.estrellas > v.estrellas) cola.push({ id: h.id, forma: e.forma, estrellas: e.estrellas, subioForma: e.forma > v.forma });
      else if (e.forma < v.forma || e.estrellas < v.estrellas) h.visto = { forma: e.forma, estrellas: e.estrellas };
    }
    mostrarCrecimiento();
  }
  function mostrarCrecimiento() {
    const c = cola[0];
    if (!c) return;
    const h = habito(c.id), m = spec(h), el = document.createElement('div'), t = $('toast');
    if (t) t.remove();
    el.className = 'creció'; el.setAttribute('role', 'dialog');
    el.innerHTML = `<div class="destello"></div><p class="eyebrow">${esc(h.nombre)}</p><h2>${c.subioForma ? `¡Ahora es ${FORMS[c.forma].n}!` : '¡Sumó una estrella!'}</h2>${svg(m, c.forma, 'cr')}<p>${esc(m.nombre)}${c.estrellas ? ` · ★ ${c.estrellas}` : ''}</p><button type="button" class="btn" data-a="creció-ok">Seguir</button>`;
    document.body.appendChild(el);
    setTimeout(() => { const d = el.querySelector('.destello'); if (d) d.remove(); }, 800);
    chispas(innerWidth / 2, innerHeight / 2, 40, ['#2EE59D', '#FFFFFF', '#12B76A']);
    vibrar([30, 40, 60]);
  }

  /* ---------- Simulador ---------- */
  function cumplirSemana() {
    const H = hoy(), l = M.lunesDe(H);
    for (const h of D().habitos) {
      if (h.fin || M.enPausa(h, H)) continue;
      const meta = M.metaDeSemana(h, l), fr = M.frecuenciaEn(h, H);
      let hechos = 0;
      for (let i = 0; i < 7; i++) {
        const f = M.sumarDias(l, i);
        if (hechos >= meta) break;
        if (f < h.inicio || M.enPausa(h, f) || (fr.tipo === 'fijos' && !fr.dias.includes(i))) continue;
        M.marcar(D().registros, h.id, f, { estado: 'hecho', ...(h.registro.tipo === 'numero' ? { valores: h.registro.campos.map(() => '') } : {}) });
        hechos++;
      }
    }
  }

  /* ---------- Eventos ---------- */
  const ACCIONES = {
    'tab': b => { diaSel = null; ir(b.dataset.v); },
    'crear': () => abrirAsistente(null),
    'volver': () => ir(pestana),
    'ficha': b => ir('ficha', { id: b.dataset.id }),
    'tocar-mon': b => { saltar(b.dataset.id, 12); clearTimeout(ACCIONES._t); ACCIONES._t = setTimeout(() => ir('ficha', { id: b.dataset.id }), 460); },
    'dia': b => { diaSel = b.dataset.f; renderHoy(); },
    'marcar-si': b => {
      const { id, f } = b.dataset, r = (D().registros[id] || {})[f];
      if (r && r.estado === 'hecho') { M.marcar(D().registros, id, f, r.nota ? { estado: 'no', nota: r.nota } : null); guardar(); renderHoy(); return; }
      M.marcar(D().registros, id, f, { ...(r || {}), estado: 'hecho' }); guardar();
      chispasEn(b, 18);
      renderHoy(); saltar(id, 16); vibrar(20);
      const nuevo = document.querySelector(`.marca.si[data-id="${id}"]`); if (nuevo) nuevo.classList.add('pop-marca');
    },
    'marcar-no': b => {
      const { id, f } = b.dataset, r = (D().registros[id] || {})[f];
      M.marcar(D().registros, id, f, r && r.estado === 'no' ? null : { estado: 'no', ...(r && r.nota ? { nota: r.nota } : {}) });
      guardar(); renderHoy();
    },
    'detalle': b => { hoja = { tipo: 'detalle', id: b.dataset.id, f: b.dataset.f }; pintarHoja(); },
    'hoja-fuera': (b, ev) => { if (ev.target === b) { hoja = null; pintarHoja(); } },
    'h-cerrar': () => { hoja = null; pintarHoja(); },
    'h-hecho': () => guardarHoja('hecho'),
    'h-no': () => guardarHoja('no'),
    'h-borrar': () => { M.marcar(D().registros, hoja.id, hoja.f, null); guardar(); hoja = null; pintarHoja(); refrescar(); },
    'ficha-saltar': b => { b.classList.remove('jump'); void b.getBoundingClientRect(); b.classList.add('jump'); chispasEn(b, 14, ['#2EE59D', '#FFFFFF', '#12B76A']); vibrar(10); },
    'editar': () => abrirAsistente(habito(vista.id)),
    'pausar': () => { M.pausar(habito(vista.id), hoy()); guardar(); render(); },
    'reanudar': () => { M.reanudar(habito(vista.id), hoy()); guardar(); render(); },
    'preguntar-borrar': () => { hoja = { tipo: 'borrar' }; pintarHoja(); },
    'preguntar-fin': () => { hoja = { tipo: 'terminar' }; pintarHoja(); },
    'extender': b => { M.extender(habito(vista.id), +b.dataset.n); guardar(); render(); },
    'fin': b => { const h = habito(vista.id); if (h.fin) h.fin.destino = b.dataset.v; else M.terminar(h, b.dataset.v, hoy()); guardar(); hoja = null; pintarHoja(); ir('jardin'); },
    'borrar-si': () => { const d = D(), id = vista.id; d.habitos = d.habitos.filter(h => h.id !== id); delete d.registros[id]; guardar(); hoja = null; pintarHoja(); ir(pestana); aviso('Hábito borrado.'); },
    'ver-anio': () => { cal = { id: vista.id, anio: +hoy().slice(0, 4) }; ir('calendario'); },
    'cal-habito': b => { cal.id = b.dataset.id; const x = document.querySelector('.selector') ; const sl = x ? x.scrollLeft : 0; render(); const y = document.querySelector('.selector'); if (y) y.scrollLeft = sl; },
    'cal-anio': b => { cal.anio += +b.dataset.n; render(); },
    'mes': b => { hoja = { tipo: 'mes', id: cal.id, anio: cal.anio, m: +b.dataset.m }; pintarHoja(); },
    'creció-ok': () => {
      const c = cola.shift(), h = habito(c.id);
      h.visto = { forma: c.forma, estrellas: c.estrellas }; guardar();
      document.querySelector('.creció').remove();
      if (cola.length) mostrarCrecimiento(); else { renderJardin(); renderHoy(); }
    },
    'copiar-resumen': () => copiar(M.resumen(D().habitos, D().registros, hoy()), () => aviso('Resumen copiado. Pegámelo en el chat.'), () => aviso('No pude copiar el resumen en este navegador.')),
    'exportar': () => {
      hoja = { tipo: 'exportar' }; pintarHoja();
      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(real, null, 1)], { type: 'application/json' }));
        a.download = `jardin-${M.aFecha(new Date())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      } catch (e) { /* queda el texto para copiar */ }
    },
    'copiar-texto': () => copiar($('texto-copia').value, () => aviso('Copia guardada en el portapapeles.'), () => { $('texto-copia').select(); aviso('Seleccioné el texto: copialo a mano.'); }),
    'mostrar-importar': () => { hoja = { tipo: 'importar' }; pintarHoja(); },
    'importar': () => {
      try {
        const d = JSON.parse($('texto-importar').value);
        if (!d || !Array.isArray(d.habitos) || typeof d.registros !== 'object') throw new Error('formato');
        real = { v: 1, habitos: d.habitos, registros: d.registros || {} }; guardar(); hoja = null; pintarHoja(); ir('jardin'); aviso('Datos importados.');
      } catch (e) { $('h-error').textContent = 'Ese texto no es una copia válida. No cambié nada.'; }
    },
    'sim-entrar': () => { sim = { dias: 0, datos: JSON.parse(JSON.stringify(real)) }; diaSel = null; ir('jardin'); },
    'sim-salir': () => { sim = null; cola = []; const c = document.querySelector('.creció'); if (c) c.remove(); diaSel = null; hoja = null; pintarHoja(); ir('jardin'); },
    'sim-dia': () => { sim.dias += 1; diaSel = null; render(); },
    'sim-semana': () => { sim.dias += 7; diaSel = null; render(); },
    'sim-cumplir': () => { cumplirSemana(); render(); aviso('Semana cumplida. Avanzá una semana para verlo crecer.'); },
    'w-atras': () => { if (wiz.paso > 1) { wiz.paso--; wiz.error = ''; render(); } else { const id = wiz.id; wiz = null; id ? ir('ficha', { id }) : ir(pestana); } },
    'w-seguir': () => {
      wiz.error = validarPaso();
      if (wiz.error) { render(); return; }
      if (wiz.paso < 4) { wiz.paso++; render(true); window.scrollTo(0, 0); } else terminarAsistente();
    },
    'w-tipo': b => { wiz.tipo = b.dataset.v; wiz.error = ''; render(); },
    'w-campos': () => { if (wiz.campos.length < 2) wiz.campos.push({ nombre: '', unidad: '' }); else wiz.campos.length = 1; render(); },
    'w-frec': b => { wiz.frec = b.dataset.v; wiz.error = ''; render(); },
    'w-dia': b => { const v = +b.dataset.v; wiz.dias = wiz.dias.includes(v) ? wiz.dias.filter(d => d !== v) : [...wiz.dias, v]; wiz.error = ''; render(); },
    'w-meta': b => { wiz.meta = Math.min(6, Math.max(1, wiz.meta + +b.dataset.n)); render(); },
    'w-obj': b => { wiz.objetivo = b.dataset.v === '' ? null : +b.dataset.v; wiz.error = ''; render(); },
    'w-mon': b => { wiz.monstruo = b.dataset.v; wiz.error = ''; render(); }
  };
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-a]');
    if (!b || b.disabled) return;
    const fn = ACCIONES[b.dataset.a];
    if (fn) fn(b, ev);
  });
  document.addEventListener('input', ev => {
    if (!wiz) return;
    const t = ev.target;
    if (t.id === 'w-nombre') wiz.nombre = t.value;
    else if (t.dataset.c != null) wiz.campos[+t.dataset.c][t.dataset.k] = t.value;
    else if (t.id === 'w-otro') {
      const n = parseInt(t.value, 10);
      wiz.objetivo = isNaN(n) ? wiz.objetivo : n;
      document.querySelectorAll('.chip.on').forEach(c => c.classList.remove('on'));
      const libresList = M.libres(D().habitos, ELENCO, wiz.monstruo), m = libresList.find(x => x.id === wiz.monstruo) || libresList[0] || ELENCO[0];
      if (!isNaN(n) && n >= 4) {
        $('w-plan').innerHTML = rutaHtml(m, n);
        $('w-nota').textContent = n > 26 ? 'Las semanas cuentan cuando cumplís la meta. Desde la 26, suma una estrella por semana.' : 'Las semanas cuentan cuando cumplís la meta. Al terminar, se puede quedar en el jardín.';
      }
    }
  });
  // Al volver a la app otro día, el jardín se actualiza solo.
  document.addEventListener('visibilitychange', () => { if (!document.hidden && vista.p === 'jardin') { diaSel = null; render(); } });

  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* opcional */ }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  render();
})();
