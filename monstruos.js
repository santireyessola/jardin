// Elenco del jardín: 20 monstruos, cada uno en 5 formas, dibujados en SVG por código.
// Monstruos.draw(spec, forma, id) devuelve el contenido de un <svg viewBox="0 0 400 400">.
(function (root) {
  const FK = [
    { n: 'Bebé', w: .6, h: .56, st: .4, er: .84, m: .44, a: .22, t: .3, d: 0, glow: 4, lg: .55 },
    { n: 'Niño', w: .72, h: .72, st: .64, er: .88, m: .62, a: .5, t: .55, d: 1, glow: 6, lg: .7 },
    { n: 'Joven', w: .85, h: .87, st: .86, er: .94, m: .81, a: .75, t: .8, d: 2, glow: 9, lg: .85 },
    { n: 'Adulto', w: 1, h: 1, st: 1, er: 1, m: 1, a: 1, t: 1, d: 3, glow: 12, lg: 1 },
    { n: 'Legendario', w: 1.09, h: 1.05, st: 1.04, er: 1.12, m: 1.12, a: 1.11, t: 1.3, d: 4, glow: 20, lg: 1.05, leg: true }
  ];
  const SPOTS = [[-.62, .2, .1], [.6, .22, .085], [-.25, .1, .07], [.18, .09, .06], [.72, .44, .07], [-.72, .47, .08], [-.34, .9, .06], [.36, .88, .055], [.66, .66, .055], [-.66, .68, .06]];

  // Hasta 26 semanas el plan se reparte en cuartos; con más, plan fijo y estrellas.
  const thresholds = T => T > 26 ? [2, 6, 12, 26] : [1, 2, 3, 4].map(k => Math.round(T * k / 4));
  const formIndex = (w, T) => thresholds(T).filter(x => w >= x).length;

  const r1 = n => Math.round(n * 10) / 10;
  const on = (o, c) => (o.from || 0) <= c.k.d;

  function context(s, i) {
    const k = FK[i], lg = s.leg ? s.leg.len * k.lg : 0, B = 342 - lg, w = s.w * k.w, h = s.h * k.h;
    return { s, k, w, h, B, T: B - h, px: x => 200 + x * w, py: y => B - y * h };
  }

  function blobPath(c) {
    const { w, h, B, T, s } = c, tw = s.tw == null ? .6 : s.tw, b = s.bot == null ? .8 : s.bot;
    return `M200 ${B}C${200 + w * b} ${B} ${200 + w} ${B - h * .18} ${200 + w} ${B - h * .46}C${200 + w} ${B - h * .78} ${200 + w * tw} ${T} 200 ${T}C${200 - w * tw} ${T} ${200 - w} ${B - h * .78} ${200 - w} ${B - h * .46}C${200 - w} ${B - h * .18} ${200 - w * b} ${B} 200 ${B}Z`;
  }
  function slimePath(c) {
    const { w, h, T } = c, L = 200 - w, R = 200 + w;
    return `M${200 - w * 1.25} 340C${200 - w * 1.05} 340 ${L} ${340 - h * .12} ${L} ${340 - h * .3}C${L} ${T + h * .25} ${200 - w * .7} ${T} 200 ${T}C${200 + w * .7} ${T} ${R} ${T + h * .25} ${R} ${340 - h * .3}C${R} ${340 - h * .12} ${200 + w * 1.05} 340 ${200 + w * 1.25} 340Q${200 + w * .9} 353 ${200 + w * .6} 345Q200 357 ${200 - w * .6} 345Q${200 - w * .9} 353 ${200 - w * 1.25} 340Z`;
  }
  function furPath(cx, cy, w, h, amp, N) {
    const pt = a => {
      const co = Math.cos(a), si = Math.sin(a), e = .8;
      return [cx + w * Math.sign(co) * Math.abs(co) ** e * (1 - .12 * Math.max(0, si)), cy - h * Math.sign(si) * Math.abs(si) ** e];
    };
    let d = '';
    for (let i = 0; i < N; i++) {
      const p = pt(i / N * 6.283), q = pt((i + 1) / N * 6.283);
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, nx = mx - cx, ny = my - cy, l = Math.hypot(nx, ny) || 1;
      const tip = [mx + nx / l * amp, my + ny / l * amp + amp * .35];
      d += `${i ? '' : `M${r1(p[0])} ${r1(p[1])}`}L${r1(tip[0])} ${r1(tip[1])}L${r1(q[0])} ${r1(q[1])}`;
    }
    return d + 'Z';
  }
  function bodyShape(c) {
    const s = c.s;
    if (s.shape === 'slime') return `<path d="${slimePath(c)}" fill="${s.c}"/>`;
    if (s.shape === 'fur') {
      const amp = (s.amp || 14) * (.6 + .4 * c.k.a), N = Math.round(18 + 12 * c.k.w);
      return `<path d="${furPath(200, c.B - c.h / 2, c.w, c.h / 2, amp, N)}" fill="${s.c}" stroke="${s.c}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    return `<path d="${blobPath(c)}" fill="${s.c}"/>`;
  }

  function eye(c, cx, cy, r, o, b) {
    const s = c.s, ring = o.ring || s.ring || s.dark, iris = o.iris || s.iris || '#2AA7C4', dir = (200 - cx) / 200 * r * .3;
    let lid = '';
    if (o.lid || s.lid) {
      const R = r + Math.max(3, r * .16) + 1, a = r * (cx < 200 ? .62 : .08), b = r * (cx < 200 ? .08 : .62);
      lid = `<path d="M${cx - Math.sqrt(R * R - a * a)} ${cy - a}A${R} ${R} 0 0 1 ${cx + Math.sqrt(R * R - b * b)} ${cy - b}Z" fill="${s.c}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r + Math.max(3, r * .16)}" fill="${ring}"/><g class="eye ${b ? 'b' : ''}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/><circle cx="${cx + dir}" cy="${cy + r * .05}" r="${r * .62}" fill="${iris}"/><circle cx="${cx + dir}" cy="${cy + r * .05}" r="${r * .34}" fill="#0A0D14"/><circle cx="${cx + dir + r * .16}" cy="${cy - r * .16}" r="${Math.max(1.5, r * .13)}" fill="#fff"/></g>${lid}`;
  }
  function stalks(c) {
    return c.s.eyes.filter(e => e.stalk && on(e, c)).map((e, i) => {
      const bx = c.px(e.x), by = c.T + c.h * .12 + Math.abs(e.x) * c.h * .2, side = Math.sign(e.x) || 0;
      const tx = bx + side * (e.lean == null ? .3 : e.lean) * e.stalk * c.k.st, ty = c.T - e.stalk * c.k.st;
      const sw = Math.max(9, (e.sw || .15) * c.w);
      return `<g class="sway ${i % 2 ? 'b' : ''}" style="transform-origin:${bx}px ${by}px"><path d="M${bx} ${by}Q${bx} ${(by + ty) / 2} ${tx} ${ty}" fill="none" stroke="${e.color || c.s.c}" stroke-width="${sw}" stroke-linecap="round"/>${eye(c, tx, ty, e.r * c.k.er, e, i % 2)}</g>`;
    }).join('');
  }
  const bodyEyes = c => c.s.eyes.filter(e => !e.stalk && on(e, c)).map((e, i) => eye(c, c.px(e.x), c.py(e.y), e.r * c.k.er, e, i % 2)).join('');

  function mouth(c) {
    const M = c.s.mouth, m = M.m * c.k.m, cx = c.px(M.x || 0), cy = c.py(M.y), col = M.color || '#43191F';
    if (M.type === 'fang') {
      const tw = Math.max(7, m * .3), dir = M.up ? -1 : 1, top = cy + m * .18 * .75;
      return `<path d="M${cx - m} ${cy}Q${cx} ${cy + m * .36} ${cx + m} ${cy}" fill="none" stroke="${col}" stroke-width="${Math.max(4, m * .13)}" stroke-linecap="round"/>` +
        [-.5, .5].map(x => `<path d="M${cx + x * m - tw / 2} ${top}L${cx + x * m + tw / 2} ${top}L${cx + x * m} ${top + dir * tw * 1.5}Z" fill="#fff"/>`).join('');
    }
    const d = m * (M.type === 'huge' ? 1.35 : M.type === 'grin' ? .62 : 1.1), n = Math.max(1, Math.round(M.t * c.k.t));
    const xs = n === 1 ? [0] : Array.from({ length: n }, (_, i) => -m * .62 + i * (m * 1.24) / (n - 1));
    const tw = Math.max(7, Math.min(m * .27, m * 1.5 / n));
    const teeth = xs.map((x, i) => {
      const top = cy + 4 * (1 - (x / m) ** 2), fang = c.k.leg && (i === 0 || i === n - 1), h = Math.min(tw * (fang ? 1.75 : 1.15), d * .55);
      return `<path d="M${cx + x - tw / 2} ${top}L${cx + x + tw / 2} ${top}L${cx + x} ${top + h}Z" fill="#fff"/>`;
    }).join('');
    const lower = M.lower && c.k.d >= 1 ? [-.36, 0, .36].map(x => {
      const by = cy + d * .86;
      return `<path d="M${cx + x * m - tw / 2.4} ${by}L${cx + x * m + tw / 2.4} ${by}L${cx + x * m} ${by - tw}Z" fill="#fff"/>`;
    }).join('') : '';
    const tongue = M.long
      ? `<path d="M${cx} ${cy + d * .55}Q${cx + m * .3} ${cy + d * 1.5} ${cx + m * .1} ${cy + d + 26 * c.k.a + 8}" fill="none" stroke="#F06A9B" stroke-width="${Math.max(9, m * .32)}" stroke-linecap="round"/>`
      : (M.tongue === false ? '' : `<ellipse cx="${cx}" cy="${cy + d * .8}" rx="${m * .45}" ry="${d * .18}" fill="${M.tcolor || '#E8584F'}"/>`);
    return `<path d="M${cx - m} ${cy}Q${cx} ${cy + 8} ${cx + m} ${cy}Q${cx + m * .9} ${cy + d} ${cx} ${cy + d}Q${cx - m * .9} ${cy + d} ${cx - m} ${cy}Z" fill="${col}"/>${tongue}${teeth}${lower}`;
  }

  function arm(c, side) {
    const A = c.s.arm;
    if (!A) return '';
    const a = A.len * c.k.a, col = A.color || c.s.c, sw = Math.max(9, (A.sw || 15) * (.75 + .25 * c.k.a)), sx = c.px(side * (A.x || .92)), sy = c.py(A.y || .5);
    if (a < 22) return `<ellipse cx="${sx + side * 5}" cy="${sy}" rx="${Math.max(10, c.w * .2)}" ry="${Math.max(8, c.w * .15)}" fill="${col}"/>`;
    const up = A.up == null ? .45 : A.up, ex = sx + side * a * .85, ey = sy - a * up;
    const fingers = [-.9, -.25, .4].map(o => {
      const r = Math.max(9, a * .2), ang = (up < 0 ? Math.PI / 4 : -Math.PI / 4) + o;
      return `<line x1="${ex}" y1="${ey}" x2="${ex + side * r * Math.cos(ang)}" y2="${ey + r * Math.sin(ang)}" stroke="${A.hand || col}" stroke-width="${Math.max(5, sw * .55)}" stroke-linecap="round"/>`;
    }).join('');
    return `<g class="${side < 0 ? 'wl' : 'wr'}" style="transform-origin:${sx}px ${sy}px"><path d="M${sx} ${sy}Q${sx + side * a * .5} ${sy + a * (A.bend == null ? .12 : A.bend)} ${ex} ${ey}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>${fingers}</g>`;
  }
  function legs(c) {
    const L = c.s.leg;
    if (!L) return '';
    const col = L.color || c.s.dark, fx = c.w * (L.x || .45), rx = Math.max(13, c.w * .3), ry = Math.max(9, 13 * c.k.lg);
    return [-1, 1].map(s => {
      const x = 200 + s * fx;
      const stem = L.type === 'stick' ? `<line x1="${x}" y1="${c.B - 6}" x2="${x}" y2="340" stroke="${col}" stroke-width="${Math.max(6, (L.sw || 9) * c.k.lg)}" stroke-linecap="round"/>` : '';
      const foot = `<ellipse cx="${x + s * 5}" cy="340" rx="${rx}" ry="${ry}" fill="${L.shoe || col}"/>`;
      const claws = L.claws && c.k.d >= 1 ? [-.55, 0, .55].map(o => {
        const t = x + s * 5 + o * rx, sz = Math.max(4, 7 * c.k.lg);
        return `<path d="M${t - sz} 340L${t + sz} 340L${t} ${340 + sz * 1.3}Z" fill="#fff"/>`;
      }).join('') : '';
      return stem + foot + claws;
    }).join('');
  }

  const grow = c => .35 + .65 * Math.min(1, c.k.d / 3);
  const FEATURES = {
    horns(c, o) {
      const L = o.L * grow(c), hw = Math.max(6, o.hw * c.k.w);
      return (o.center ? [0] : [-1, 1]).map(s => {
        const bx = c.px(s * (o.x || 0)), by = c.py(o.y), tx = bx + s * L * .4, ty = by - L;
        const forma = `M${bx - hw} ${by + 6}C${bx - hw} ${by - L * .5} ${tx - s * 4} ${ty + L * .3} ${tx} ${ty}C${tx + s * 2} ${ty + L * .4} ${bx + hw} ${by - L * .4} ${bx + hw} ${by + 6}Z`;
        const banda = (k, col) => `<path transform="translate(${tx} ${ty}) scale(${k}) translate(${-tx} ${-ty})" d="${forma}" fill="${col}"/>`;
        return `<path d="${forma}" fill="${o.color}"/>${o.stripe ? banda(.68, o.stripe) + banda(.5, o.color) + banda(.3, o.stripe) + banda(.14, o.color) : ''}`;
      }).join('');
    },
    ears(c, o) {
      const L = o.L * grow(c);
      return [-1, 1].map(s => {
        const bx = c.px(s * o.x), by = c.py(o.y);
        return `<path d="M${bx - s * 8} ${by + 26}Q${bx + s * L * .5} ${by + 4} ${bx + s * L} ${by - L * .42}Q${bx + s * L * .25} ${by - L * .55} ${bx - s * 18} ${by - 24}Z" fill="${o.color || c.s.c}"/>`;
      }).join('');
    },
    droop(c, o) {
      const L = o.L * grow(c);
      return [-1, 1].map(s => {
        const bx = c.px(s * o.x), by = c.py(o.y);
        return `<path d="M${bx - s * 14} ${by - 16}Q${bx + s * L * .8} ${by - 14} ${bx + s * L} ${by + L * .68}Q${bx + s * L * .35} ${by + L * .34} ${bx - s * 10} ${by + 24}Z" fill="${o.color || c.s.c}"/>`;
      }).join('');
    },
    crest(c, o) {
      const L = o.L * grow(c), n = o.n, sp = o.spread || 34, base = Math.max(9, c.w * .13), cx = c.px(o.x || 0);
      return Array.from({ length: n }, (_, i) => {
        const a = (n === 1 ? 0 : -sp + i * (2 * sp) / (n - 1)) * Math.PI / 180, bx = cx + Math.sin(a) * c.w * .42, by = c.T + c.h * .1 + Math.abs(Math.sin(a)) * c.h * .08;
        return `<path d="M${bx - base} ${by}L${bx + Math.sin(a) * L * 1.1} ${c.T - L * Math.cos(a) + Math.abs(Math.sin(a)) * c.h * .08}L${bx + base} ${by}Z" fill="${o.color}" stroke="${o.color}" stroke-width="3" stroke-linejoin="round"/>`;
      }).join('');
    },
    hairs(c, o) {
      const L = o.L * grow(c), n = Math.max(2, Math.round(o.n * (.45 + .55 * c.k.d / 3)));
      return Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0 : -1 + 2 * i / (n - 1), bx = 200 + t * c.w * .55, by = c.T + c.h * .08 + t * t * c.h * .12, tx = bx + t * L * .75, ty = by - L * (1 - .25 * t * t);
        return `<path d="M${bx} ${by}Q${bx + t * L * .15} ${(by + ty) / 2} ${tx} ${ty}Q${tx + (t >= 0 ? 8 : -8)} ${ty - 7} ${tx + (t >= 0 ? 15 : -15)} ${ty + 2}" fill="none" stroke="${o.color}" stroke-width="${o.sw || 4}" stroke-linecap="round"/>`;
      }).join('');
    },
    wings(c, o) {
      const L = o.L * c.k.a, H = o.H * c.k.a;
      return [-1, 1].map(s => {
        const sx = c.px(s * .68), sy = c.py(o.y), tx = sx + s * L, ty = sy - H;
        return `<g class="${s < 0 ? 'wr' : 'wl'}" style="transform-origin:${sx}px ${sy}px"><path d="M${sx} ${sy + 18 * c.k.a}L${sx} ${sy - 16 * c.k.a}Q${sx + s * L * .55} ${ty - 2} ${tx} ${ty}Q${tx - s * L * .1} ${sy - H * .3} ${tx - s * L * .08} ${sy + H * .32}Q${tx - s * L * .3} ${sy - H * .06} ${tx - s * L * .42} ${sy + H * .42}Q${tx - s * L * .62} ${sy + H * .05} ${sx} ${sy + 18 * c.k.a}Z" fill="${o.color}"/></g>`;
      }).join('');
    },
    spikes(c, o) {
      const n = Math.max(2, Math.round(o.n * (.4 + .6 * c.k.d / 3))), L = o.L * (.55 + .45 * c.k.a), cy = c.B - c.h * .46, rx = c.w, ry = c.h * .54;
      return Array.from({ length: n }, (_, i) => {
        const a = (68 - i * 88 / Math.max(1, n - 1)) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        const x = 200 + rx * ca, y = cy - ry * sa, tx = x + ca * L, ty = y - sa * L, dx = -sa * L * .55, dy = -ca * L * .55;
        return `<path d="M${x - ca * 6 + dx} ${y + sa * 6 + dy}L${tx} ${ty}L${x - ca * 6 - dx} ${y + sa * 6 - dy}Z" fill="${o.color}"/>`;
      }).join('');
    },
    tail(c, o) {
      const L = o.L * grow(c), s = o.side || 1, bx = 200 + s * c.w * .6, by = c.B - c.h * .1, tx = bx + s * L, ty = by - L * (o.rise == null ? .5 : o.rise);
      return `<path d="M${bx} ${by - c.h * .2}Q${bx + s * L * .6} ${by - 2} ${tx} ${ty}Q${bx + s * L * .5} ${by + 16 * c.k.a} ${bx - s * 8} ${by + 12}Z" fill="${o.color || c.s.c}"/>`;
    },
    fin(c, o) {
      const L = o.L * grow(c), s = o.side || 1, bx = 200 + s * c.w * .72, by = c.B - c.h * .22;
      return `<path d="M${bx - s * 8} ${by - 22}Q${bx + s * L * .6} ${by - 8} ${bx + s * L} ${by - L * .5}Q${bx + s * L * .72} ${by + 2} ${bx + s * L * .95} ${by + L * .34}Q${bx + s * L * .4} ${by + 22} ${bx - s * 8} ${by + 22}Z" fill="${o.color || c.s.c}"/>`;
    },
    mane(c, o) {
      return `<path d="${furPath(200, c.B - c.h * .58, c.w * o.scale, c.h * .52, (o.amp || 20) * (.55 + .45 * c.k.a), Math.round(16 + 10 * c.k.w))}" fill="${o.color}" stroke="${o.color}" stroke-width="3" stroke-linejoin="round"/>`;
    },
    antenna(c, o) {
      const bx = c.px(o.x), by = c.T + 10, tx = bx + (o.lean || 0) * c.k.st, ty = c.T - o.L * c.k.st;
      return `<g class="sway" style="transform-origin:${bx}px ${by}px"><path d="M${bx} ${by}Q${bx} ${(by + ty) / 2} ${tx} ${ty}" fill="none" stroke="${o.color || c.s.c}" stroke-width="7" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="${(o.r || 9) * c.k.er}" fill="${o.ball}"/></g>`;
    },
    head2(c, o) {
      const r = c.w * o.r, hx = c.px(o.x), hy = c.py(o.y);
      return `<g class="sway b" style="transform-origin:${c.px(.5)}px ${c.py(.7)}px"><path d="M${c.px(.45)} ${c.py(.6)}L${hx} ${hy}" stroke="${c.s.c}" stroke-width="${r * 1.1}" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="${r}" fill="${c.s.c}"/>${eye(c, hx, hy - r * .05, r * .62, {}, true)}</g>`;
    },
    collar(c, o) {
      const y = c.py(o.y), dy = c.h * .24;
      return `<path d="M${c.px(-.86)} ${y}Q200 ${y + dy * 1.25} ${c.px(.86)} ${y}Q200 ${y + dy * .55} ${c.px(-.86)} ${y}Z" fill="${o.color}"/>`;
    },
    stripes(c, o) {
      const n = Math.max(1, Math.round(o.n * (.4 + .6 * c.k.d / 3)));
      return Array.from({ length: n }, (_, i) => {
        const y = c.py(o.y - i * .055), hw = c.w * (.36 - i * .03);
        return `<path d="M${200 - hw} ${y}Q200 ${y + 7} ${200 + hw} ${y}" fill="none" stroke="${o.color}" stroke-width="${Math.max(3, 5 * c.k.lg)}" stroke-linecap="round"/>`;
      }).join('');
    }
  };
  const FRONT = new Set(['collar', 'stripes']);
  const extras = (c, front) => (c.s.x || []).filter(o => on(o, c) && FRONT.has(o.k) === front).map(o => FEATURES[o.k](c, o)).join('');

  function surface(c) {
    const s = c.s;
    const belly = s.belly ? `<ellipse cx="200" cy="${c.B - c.h * .2}" rx="${c.w * .6}" ry="${c.h * .17}" fill="${s.belly}"/>` : '';
    const count = Math.round((s.sp || 0) * (.25 + .75 * c.k.d / 3));
    const spots = SPOTS.slice(0, count).map(([x, y, r]) => `<circle cx="${c.px(x)}" cy="${c.py(y)}" r="${r * c.w}" fill="${s.spot || s.dark}"/>`).join('');
    let marks = '';
    if (s.shape === 'fur' && c.k.d >= 1) {
      marks = [[-.55, .32], [.5, .28], [-.2, .13], [.22, .16], [-.68, .6], [.66, .58]].slice(0, 2 + c.k.d).map(([x, y]) => {
        const X = c.px(x), Y = c.py(y), a = 7 * c.k.lg;
        return `<path d="M${X - a} ${Y - a}L${X} ${Y + a * .4}L${X + a} ${Y - a}" fill="none" stroke="${s.dark}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      }).join('');
    }
    return belly + spots + marks;
  }
  function crown(c) {
    const tops = c.s.eyes.filter(e => !e.stalk && on(e, c)).map(e => c.py(e.y) - e.r * c.k.er - 4);
    const y = Math.min(c.T + 12, ...tops), hairs = (c.s.x || []).some(o => o.k === 'horns' && o.center);
    if (hairs) return '';
    return `<path d="M172 ${y}L168 ${y - 30}L186 ${y - 14}L200 ${y - 38}L214 ${y - 14}L232 ${y - 30}L228 ${y}Z" fill="#E6FF6B"/><circle cx="200" cy="${y - 8}" r="5" fill="#2EE59D"/>`;
  }

  function draw(spec, i, id, sinBrillo) {
    const c = context(spec, i), k = c.k;
    const aura = k.leg ? `<defs><radialGradient id="${id}a"><stop offset="0" stop-color="#2EE59D" stop-opacity=".6"/><stop offset="1" stop-color="#2EE59D" stop-opacity="0"/></radialGradient></defs><circle class="aura" cx="200" cy="200" r="190" fill="url(#${id}a)"/>` : '';
    const orbit = k.leg ? `<g class="orbit">${[0, 60, 120, 180, 240, 300].map((d, n) => {
      const R = 176, a = d * Math.PI / 180;
      return `<circle cx="${200 + R * Math.cos(a)}" cy="${200 + R * Math.sin(a)}" r="${n % 2 ? 4 : 6.5}" fill="${n % 2 ? '#fff' : '#E6FF6B'}"/>`;
    }).join('')}</g>` : '';
    return `${aura}<ellipse cx="200" cy="352" rx="${c.w * 1.4}" ry="11" fill="#2EE59D" opacity=".28"/><g class="mon"${sinBrillo ? '' : ` style="filter:drop-shadow(0 0 ${k.glow}px #2EE59D99)"`}>${extras(c, false)}${arm(c, -1)}${arm(c, 1)}${stalks(c)}${legs(c)}${bodyShape(c)}${surface(c)}${extras(c, true)}${bodyEyes(c)}${mouth(c)}${k.leg ? crown(c) : ''}</g>${orbit}`;
  }

  const ORO = '#F2C230', NEGRO = '#17131F';
  const ELENCO = [
    { id: 'babosa-verde', nombre: 'Babosa verde', c: '#7CC142', dark: '#5A9A2B', belly: '#A9DB62', shape: 'slime', w: 108, h: 195, ring: '#4C8524', sp: 8,
      eyes: [{ stalk: 46, x: -.36, r: 32 }, { stalk: 46, x: .36, r: 32 }], mouth: { y: .6, m: 52, t: 4 }, arm: { len: 72, sw: 16 } },
    { id: 'verde-peludo', nombre: 'Verde peludo', c: '#4E9E3A', dark: '#2F7426', shape: 'fur', amp: 18, w: 100, h: 150, ring: ORO, iris: '#3B2A14', leg: { type: 'stick', len: 34, color: '#5B4BC4', shoe: '#5B4BC4', x: .32 },
      eyes: [{ x: -.34, y: .78, r: 30 }, { x: .34, y: .78, r: 30 }], mouth: { type: 'fang', up: true, y: .34, m: 44 }, x: [{ k: 'crest', n: 3, color: '#8CCB4A', L: 26, spread: 22 }] },
    { id: 'violeta-alto', nombre: 'Violeta alto', c: '#5B3FC4', dark: '#42299B', spot: '#E0476B', shape: 'blob', tw: .78, bot: .72, w: 70, h: 215, ring: ORO, sp: 7, leg: { type: 'stick', len: 28, color: '#2E2082', shoe: '#2230A8', x: .4 },
      eyes: [{ x: 0, y: .8, r: 36 }], mouth: { y: .46, m: 26, t: 2, color: '#2F6B1F', tcolor: '#7BC043' }, arm: { len: 105, sw: 9, y: .58, up: -.42, bend: -.15, color: '#4FA83D', x: .95 }, x: [{ k: 'crest', n: 3, color: '#E5344B', L: 34, spread: 18 }] },
    { id: 'violeta-antenas', nombre: 'Violeta de cinco ojos', c: '#4A39A8', dark: '#352780', spot: '#6D5AD0', shape: 'blob', tw: .82, bot: .86, w: 110, h: 135, ring: ORO, sp: 6, leg: { type: 'nub', len: 8, color: '#352780' },
      eyes: [{ stalk: 34, x: -.62, r: 20, from: 2, color: ORO, sw: .08 }, { stalk: 54, x: -.3, r: 21, from: 1, color: ORO, sw: .08 }, { stalk: 64, x: 0, r: 24, color: ORO, sw: .08 }, { stalk: 54, x: .3, r: 21, from: 1, color: ORO, sw: .08 }, { stalk: 34, x: .62, r: 20, from: 2, color: ORO, sw: .08 }],
      mouth: { type: 'grin', y: .54, m: 56, t: 6 }, x: [{ k: 'collar', y: .34, color: ORO, from: 1 }] },
    { id: 'turquesa-aletas', nombre: 'Turquesa con aletas', c: '#25B4C2', dark: '#178592', shape: 'blob', tw: .5, w: 104, h: 150, ring: '#178592', leg: { type: 'nub', len: 8, color: '#178592' },
      eyes: [{ x: 0, y: .74, r: 38 }], mouth: { type: 'grin', y: .42, m: 66, t: 8, tongue: false }, x: [{ k: 'ears', x: .68, y: .78, L: 58 }, { k: 'fin', L: 66, from: 1 }] },
    { id: 'magenta-pelos', nombre: 'Magenta de pelos negros', c: '#D91E63', dark: '#A81049', shape: 'blob', tw: .82, bot: .82, w: 92, h: 135, ring: ORO, leg: { type: 'stick', len: 34, color: NEGRO, x: .34, sw: 7 }, arm: { len: 72, sw: 7, up: .62, color: NEGRO },
      eyes: [{ x: 0, y: .66, r: 38 }], mouth: { type: 'grin', y: .36, m: 32, t: 3, tongue: false }, x: [{ k: 'hairs', n: 7, L: 48, color: NEGRO }, { k: 'tail', L: 62, color: '#EE4B63', from: 1 }] },
    { id: 'coral-ojos', nombre: 'Coral de cuatro ojos', c: '#F0553F', dark: '#C63B28', spot: ORO, shape: 'blob', tw: .78, bot: .86, w: 110, h: 150, ring: ORO, sp: 4, leg: { type: 'nub', len: 8, color: '#C63B28' }, arm: { len: 66, sw: 11, up: .25, hand: ORO, y: .55 },
      eyes: [{ stalk: 40, x: .12, r: 17, from: 2, lean: .4, ring: ORO }, { x: -.5, y: .86, r: 24 }, { x: 0, y: .94, r: 25, from: 1 }, { x: .5, y: .86, r: 24 }], mouth: { type: 'huge', y: .6, m: 62, t: 7, lower: true } },
    { id: 'babosa-dos-cabezas', nombre: 'Babosa de dos cabezas', c: '#5D4DBF', dark: '#443595', shape: 'slime', w: 98, h: 175, ring: ORO, sp: 0,
      eyes: [{ x: -.18, y: .78, r: 33 }], mouth: { type: 'grin', y: .42, m: 60, t: 6, color: '#7A1E4E', tcolor: '#F06A9B' }, x: [{ k: 'head2', x: .92, y: 1.0, r: .36, from: 2 }, { k: 'hairs', n: 4, L: 40, color: NEGRO, sw: 5 }] },
    { id: 'verde-orejas', nombre: 'Verde de orejas largas', c: '#2E7D32', dark: '#1E5A23', shape: 'slime', w: 112, h: 165, ring: '#1E5A23', iris: '#B9D431', lid: true, sp: 6,
      eyes: [{ x: -.3, y: .74, r: 26 }, { x: .3, y: .74, r: 26 }], mouth: { type: 'fang', y: .47, m: 34 }, x: [{ k: 'droop', x: .55, y: .82, L: 82 }, { k: 'hairs', n: 3, L: 26, color: NEGRO, sw: 4 }] },
    { id: 'violeta-alado', nombre: 'Violeta alado', c: '#4F3FB5', dark: '#352A8C', shape: 'blob', tw: .66, w: 86, h: 150, ring: ORO, leg: { type: 'nub', len: 8, color: '#2A2070', claws: true }, arm: { len: 42, sw: 13, up: .1 },
      eyes: [{ x: -.34, y: .76, r: 26 }, { x: .34, y: .76, r: 26 }], mouth: { y: .46, m: 44, t: 4, color: '#8E1F2C' }, x: [{ k: 'wings', y: .78, L: 104, H: 72, color: '#5E78DE', from: 1 }, { k: 'crest', n: 3, color: ORO, L: 32, spread: 16 }] },
    { id: 'turquesa-peludo', nombre: 'Turquesa peludo', c: '#1C9C93', dark: '#11736C', shape: 'fur', amp: 14, w: 100, h: 180, ring: '#F06A9B', leg: { type: 'nub', len: 4, color: '#11736C' },
      eyes: [{ stalk: 44, x: .4, r: 22, from: 1, color: '#2AC4B8', sw: .1 }, { x: -.28, y: .72, r: 20 }, { x: .22, y: .72, r: 20 }], mouth: { y: .44, m: 34, t: 3, tongue: false, long: true } },
    { id: 'naranja-orejas', nombre: 'Naranja orejudo', c: '#F26A1B', dark: '#C24E0D', shape: 'blob', tw: .68, w: 90, h: 170, ring: '#C24E0D', leg: { type: 'nub', len: 8, color: '#C24E0D' },
      eyes: [{ x: 0, y: .72, r: 40 }], mouth: { y: .36, m: 42, t: 3, color: '#6B1E0B' }, x: [{ k: 'ears', x: .62, y: .78, L: 62 }] },
    { id: 'fucsia-melena', nombre: 'Fucsia de melena violeta', c: '#E8227A', dark: '#B5125A', shape: 'fur', amp: 12, w: 92, h: 160, ring: '#2CC3D9', iris: '#2A9D4E', leg: { type: 'stick', len: 22, color: '#3F2C97', x: .36, sw: 11 }, arm: { len: 34, sw: 13, up: .4, color: '#E8227A' },
      eyes: [{ x: 0, y: .72, r: 36 }], mouth: { y: .38, m: 44, t: 3, color: '#2F6B1F', tcolor: '#7BC043' }, x: [{ k: 'mane', scale: 1.28, color: '#5B3FC4', from: 1 }, { k: 'horns', x: .55, y: .96, L: 46, hw: 11, color: '#F5479A', from: 2 }] },
    { id: 'violeta-cuernos', nombre: 'Violeta de cuernos naranjas', c: '#6C2C8F', dark: '#4F1D6C', shape: 'fur', amp: 15, w: 100, h: 165, ring: '#4F1D6C', leg: { type: 'nub', len: 8, color: '#3C1454', claws: true }, arm: { len: 52, sw: 20, up: .35 },
      eyes: [{ x: 0, y: .9, r: 20, from: 1 }, { x: -.36, y: .7, r: 23 }, { x: .36, y: .7, r: 23 }], mouth: { y: .42, m: 50, t: 5 }, x: [{ k: 'horns', x: .6, y: 1.02, L: 82, hw: 16, color: '#F08A24', stripe: '#FFE9B0' }] },
    { id: 'rojo-antena', nombre: 'Rojo con ojo en la antena', c: '#D9232E', dark: '#A8141D', shape: 'blob', tw: .74, bot: .78, w: 94, h: 190, ring: '#FFFFFF', leg: { type: 'nub', len: 8, color: '#8E0F17', claws: true }, arm: { len: 66, sw: 15, up: .5 },
      eyes: [{ stalk: 46, x: .1, r: 18, from: 1, lean: .5, sw: .09, color: '#5B2B86' }, { x: 0, y: .7, r: 38 }], mouth: { type: 'grin', y: .38, m: 40, t: 4, tongue: false }, x: [{ k: 'stripes', n: 3, y: .2, color: '#A8141D', from: 1 }] },
    { id: 'lima-dino', nombre: 'Lima con púas', c: '#BFD92B', dark: '#92AB14', belly: '#F3F08A', shape: 'blob', tw: .62, w: 90, h: 172, ring: '#6E3B1F', iris: '#6E3B1F', leg: { type: 'nub', len: 8, color: '#92AB14', claws: true }, arm: { len: 40, sw: 14, up: .35 },
      eyes: [{ x: -.32, y: .8, r: 23 }, { x: .32, y: .8, r: 23 }], mouth: { y: .56, m: 40, t: 4, color: '#5B1E1E' }, x: [{ k: 'tail', L: 100, rise: .45 }, { k: 'spikes', n: 6, L: 26, color: '#6E3B1F', from: 1 }, { k: 'horns', x: .55, y: .96, L: 54, hw: 13, color: '#4A2424', stripe: '#F08A24', from: 1 }] },
    { id: 'verde-azulado', nombre: 'Verde azulado de tres ojos', c: '#1FA68C', dark: '#14796A', belly: '#57D6B8', shape: 'blob', tw: .72, w: 96, h: 172, ring: '#14796A', leg: { type: 'nub', len: 8, color: '#14796A' }, arm: { len: 60, sw: 16, up: .6 },
      eyes: [{ x: -.36, y: .74, r: 22 }, { x: 0, y: .88, r: 21, from: 1 }, { x: .36, y: .74, r: 22 }], mouth: { y: .5, m: 40, t: 4, color: '#5B1E1E' }, x: [{ k: 'crest', n: 3, color: '#2B2350', L: 30, spread: 16 }] },
    { id: 'rosa-cuernos', nombre: 'Rosa peludo con cuernos', c: '#E65BB0', dark: '#C13C90', shape: 'fur', amp: 13, w: 100, h: 150, ring: '#C13C90', leg: { type: 'nub', len: 8, color: '#4A2A63', claws: true }, arm: { len: 58, sw: 18, up: .08, y: .52 },
      eyes: [{ x: -.34, y: .68, r: 22 }, { x: 0, y: .86, r: 19, from: 1 }, { x: .34, y: .68, r: 22 }], mouth: { y: .4, m: 42, t: 4 }, x: [{ k: 'horns', x: .56, y: 1.02, L: 80, hw: 16, color: '#3E3650', stripe: '#C9C4D6' }] },
    { id: 'gris-antenas', nombre: 'Gris con ojos en antenas', c: '#5A4F73', dark: '#40375A', belly: '#7B6F96', spot: '#7B6F96', shape: 'blob', tw: .55, w: 94, h: 160, ring: '#F4F2FA', sp: 6, leg: { type: 'nub', len: 8, color: '#2F2843', claws: true }, arm: { len: 66, sw: 14, up: .58 },
      eyes: [{ stalk: 56, x: -.4, r: 30, sw: .11 }, { stalk: 56, x: .4, r: 30, sw: .11 }], mouth: { type: 'grin', y: .58, m: 30, t: 2, tongue: false }  },
    { id: 'naranja-cuerno', nombre: 'Naranja peludo con cuerno', c: '#F58A1F', dark: '#C96A0B', shape: 'fur', amp: 15, w: 96, h: 165, ring: '#C96A0B', leg: { type: 'nub', len: 8, color: '#C96A0B' }, arm: { len: 54, sw: 19, up: .62 },
      eyes: [{ stalk: 38, x: -.42, r: 20, from: 1, sw: .1 }, { stalk: 38, x: .42, r: 20, from: 1, sw: .1 }, { x: 0, y: .62, r: 32 }], mouth: { y: .3, m: 32, t: 3, color: '#5B1E0B' }, x: [{ k: 'horns', center: true, y: 1.04, L: 66, hw: 15, color: '#7A3B8F', stripe: ORO, from: 1 }] }
  ];

  root.Monstruos = { FORMS: FK, ELENCO, draw, thresholds, formIndex };
})(typeof window !== 'undefined' ? window : globalThis);
