// Planillas de juez en PDF (respaldo manual) generadas desde los datos de una publicación.
// Series: una hoja A4 horizontal por serie (5 partidas). Cruces: hojas A4 verticales de 7 cruces a 5 sets.
import { jsPDF } from 'jspdf';

const GREEN: [number, number, number] = [15, 107, 64];
const GRIS: [number, number, number] = [140, 140, 140];
const CLARO: [number, number, number] = [237, 242, 237];
const NEGRO: [number, number, number] = [0, 0, 0];

type Jug = { nombre?: string; club?: string; clubNombre?: string; ranking?: number | null; esSlot?: boolean } | null | undefined;

export type DatosPlanilla = {
  tipo: 'series' | 'cruces';
  titulo: string;      // PRIMER CIRCUITO · TORNEO NACIONAL
  fase: string;
  series?: { numero: number; sede: string; fecha: string; mesas: [string, string]; horas: [string, string]; partidas: [[Jug, Jug], [Jug, Jug]] }[];
  cruces?: { etiqueta: string; sede: string; fecha: string; mesa: string; hora: string; a: Jug; b: Jug }[];
};

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
export const fechaLargaPlanilla = (f: string): string => {
  const m = String(f ?? '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return String(f ?? '').toUpperCase();
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], 12));
  return `${DIAS[d.getUTCDay()]} ${+m[1]} DE ${MESES[+m[2] - 1]} DE ${m[3]}`;
};

const mesaTxt = (m: any) => (m === null || m === undefined || m === '' || m === 'libre') ? '' : String(m);

// Normaliza los datos de una publicación; devuelve null si la publicación no tiene partidos para planillar.
export function datosParaPlanilla(pub: any): DatosPlanilla | null {
  if (!pub) return null;
  const circ = String(pub.circuito ?? ''); const tor = String(pub.torneo ?? '');
  const mOrd = circ.match(/(primer|segundo|tercer|cuarto)\s+circuito/i);
  const titulo = (mOrd ? `${mOrd[0]} · ${/nacional/i.test(tor) ? 'Torneo Nacional' : tor}` : [circ, tor].filter(Boolean).join(' · ')).toUpperCase();
  const fase = String(pub.fase ?? '');

  if ((pub.tipo === 'series-nacional' || pub.tipo === 'inicial-nacional' || pub.tipo === 'series') && Array.isArray(pub.series)) {
    const series = pub.series.filter((s: any) => s.p1 || s.p2).map((s: any) => {
      const p1 = s.p1 ?? {}; const p2 = s.p2 ?? {};
      return {
        numero: s.numero, sede: p1.sede || p2.sede || '', fecha: p1.fecha || p2.fecha || '',
        mesas: [mesaTxt(p1.mesa), mesaTxt(p2.mesa)] as [string, string], horas: [p1.hora ?? '', p2.hora ?? ''] as [string, string],
        partidas: [[p1.jugadorA, p1.jugadorB], [p2.jugadorA, p2.jugadorB]] as [[Jug, Jug], [Jug, Jug]],
      };
    });
    return series.length ? { tipo: 'series', titulo, fase, series } : null;
  }

  const mk = (etiqueta: string, m: any, a: any, b: any) => ({ etiqueta, sede: m.sede ?? '', fecha: m.fecha ?? '', mesa: mesaTxt(m.mesa), hora: m.hora ?? '', a, b });
  if ((pub.tipo === 'cruces' || pub.tipo === 'reduccion') && Array.isArray(pub.cruces)) {
    const cruces = pub.cruces.map((c: any, i: number) => mk(String(c.numero ?? c.round ?? i + 1), c, c.jugadorA, c.jugadorB));
    return cruces.length ? { tipo: 'cruces', titulo, fase, cruces } : null;
  }
  if (pub.tipo === 'bracket-nacional') {
    const conv = (p: any, slot: any): Jug => p ? { nombre: p.nombre, club: p.club, clubNombre: p.clubNombre } : { nombre: slot ?? '—', esSlot: true };
    const cruces: any[] = [];
    const add = (arr: any[], pref: string) => (arr ?? []).forEach((m: any, i: number) => { if (m) cruces.push(mk(`${pref}${arr.length > 1 ? i + 1 : ''}`, m, conv(m.playerA, m.slotA), conv(m.playerB, m.slotB))); });
    add(pub.octavos, 'O'); add(pub.cuartos, 'C'); add(pub.semis, 'S'); if (pub.final) add([pub.final], 'F');
    return cruces.length ? { tipo: 'cruces', titulo, fase, cruces } : null;
  }
  return null;
}

async function cargarLogo(): Promise<string | null> {
  try {
    const img = new Image(); img.src = '/logo-febiu.png';
    await new Promise((ok, err) => { img.onload = ok; img.onerror = err; });
    const n = 400; const cv = document.createElement('canvas'); cv.width = n; cv.height = n;
    const ctx = cv.getContext('2d')!; ctx.beginPath(); ctx.arc(n / 2, n / 2, n / 2 - 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(img, 0, 0, n, n);
    return cv.toDataURL('image/png');
  } catch { return null; }
}

const txt = (d: jsPDF, t: string, x: number, y: number, o: { f?: 'normal' | 'bold'; s?: number; c?: [number, number, number]; a?: 'left' | 'center' | 'right'; maxW?: number } = {}) => {
  d.setFont('helvetica', o.f ?? 'normal'); let s = o.s ?? 9; d.setFontSize(s); d.setTextColor(...(o.c ?? NEGRO));
  if (o.maxW) { while (s > 5.5 && d.getTextWidth(t) > o.maxW) { s -= 0.5; d.setFontSize(s); } }
  d.text(t, x, y, { align: o.a ?? 'left' });
};

function paginaSerie(d: jsPDF, logo: string | null, tit: string, s: NonNullable<DatosPlanilla['series']>[number]) {
  const W = 841.89, H = 595.28; const K = 0.87;
  const ox = (W / 2) * (1 - K), oy = (H / 2) * (1 - K);
  // Coordenadas de diseño (A4 horizontal, origen arriba-izquierda) escaladas y centradas
  const X = (v: number) => ox + v * K, Y = (v: number) => oy + v * K, L = (v: number) => v * K;
  const ML = 22;
  d.setDrawColor(...GREEN); d.setLineWidth(2 * K); d.rect(X(ML - 8), Y(ML - 8), L(W - 2 * ML + 16), L(H - 2 * ML + 16));
  d.setLineWidth(0.6 * K); d.rect(X(ML - 4), Y(ML - 4), L(W - 2 * ML + 8), L(H - 2 * ML + 8));
  const top = ML + 4; const x0 = ML + 4, x1 = W - ML - 4, tw = x1 - x0;
  if (logo) d.addImage(logo, 'PNG', X(ML + 6), Y(top + 2), L(52), L(52));
  txt(d, tit, X(W / 2), Y(top + 20), { f: 'bold', s: 19 * K, c: GREEN, a: 'center', maxW: L(520) });
  txt(d, 'FEDERACIÓN DE BILLAR DEL URUGUAY', X(W / 2), Y(top + 37), { s: 11 * K, c: [50, 50, 50], a: 'center' });
  txt(d, fechaLargaPlanilla(s.fecha), X(W / 2), Y(top + 52), { f: 'bold', s: 10.5 * K, a: 'center' });
  txt(d, 'PLANILLA DE JUEZ', X(x1), Y(top + 20), { f: 'bold', s: 9 * K, c: GRIS, a: 'right' });
  txt(d, 'Respaldo manual', X(x1), Y(top + 32), { s: 8 * K, c: GRIS, a: 'right' });
  // Franja de datos
  let y = top + 60; const hh = 26;
  d.setFillColor(...GREEN); d.rect(X(x0), Y(y), L(tw), L(hh), 'F');
  const [m1, m2] = s.mesas; const [h1, h2] = s.horas;
  const ms = !m2 || m1 === m2 ? m1 : `${m1} / ${m2}`; const hs = h1 === h2 ? h1 : `${h1} / ${h2}`;
  let xs = x0 + 10;
  for (const [lab, val, wd] of [['SERIE', String(s.numero), 90], ['CLUB', s.sede, 200], ['MESA', ms, 90], ['HORARIO', hs, 130], ['JUEZ', '', 0]] as [string, string, number][]) {
    txt(d, lab, X(xs), Y(y + 9), { s: 6.5 * K, c: [215, 240, 215] });
    if (lab === 'JUEZ') { d.setDrawColor(255, 255, 255); d.setLineWidth(0.6 * K); d.line(X(xs), Y(y + hh - 6), X(x1 - 10), Y(y + hh - 6)); }
    else txt(d, val, X(xs), Y(y + hh - 6), { f: 'bold', s: 12 * K, c: [255, 255, 255], maxW: L(wd - 8) });
    xs += wd;
  }
  // Bloques
  const cols: [string, number][] = [['JUGADOR', 190], ['NOMBRE', 0], ['SET 1', 62], ['SET 2', 62], ['SET 3', 62], ['SETS', 50]];
  cols[1][1] = tw - cols.reduce((a, [, w]) => a + w, 0);
  const [a1, b1] = s.partidas[0]; const [a2, b2] = s.partidas[1];
  const bloques: { t: string; sub: string; par: [Jug, Jug] | null }[] = [
    { t: 'PRIMER PARTIDA', sub: `1º vs 4º del ranking · ${h1} · Mesa ${m1 || '__'}`, par: [a1, b1] },
    { t: 'SEGUNDA PARTIDA', sub: `2º vs 3º del ranking · ${h2} · Mesa ${m2 || '__'}`, par: [a2, b2] },
    { t: 'PARTIDA GANADORES', sub: 'Ganador 1ª vs Ganador 2ª', par: null },
    { t: 'PARTIDA PERDEDORES', sub: 'Perdedor 1ª vs Perdedor 2ª', par: null },
    { t: 'PARTIDA 2º PUESTO', sub: 'Ganador Perdedores vs Perdedor Ganadores', par: null },
  ];
  y += hh + 8; const bh = 64, rh = 21, gap = 5, hb = 17;
  for (const b of bloques) {
    d.setFillColor(...CLARO); d.rect(X(x0), Y(y), L(tw), L(hb), 'F');
    txt(d, b.t, X(x0 + 6), Y(y + 12.5), { f: 'bold', s: 9.5 * K, c: GREEN });
    d.setFont('helvetica', 'bold'); d.setFontSize(9.5 * K); const wt = d.getTextWidth(b.t) / K;
    txt(d, b.sub, X(x0 + 6 + wt + 10), Y(y + 12.5), { s: 8 * K, c: [90, 90, 90] });
    let xx = x0; const xl: [number, number, string][] = [];
    for (const [lab, wd] of cols) { xl.push([xx, wd, lab]); xx += wd; }
    for (const [xc, wd, lab] of xl.slice(2)) txt(d, lab, X(xc + wd / 2), Y(y + 12.5), { f: 'bold', s: 8 * K, c: [75, 75, 75], a: 'center' });
    d.setDrawColor(64, 64, 64); d.setLineWidth(0.8 * K);
    d.rect(X(x0), Y(y), L(tw), L(bh)); d.line(X(x0), Y(y + hb), X(x1), Y(y + hb)); d.line(X(x0), Y(y + hb + rh), X(x1), Y(y + hb + rh));
    xl.slice(1).forEach(([xc], i) => d.line(X(xc), Y(i >= 1 ? y : y + hb), X(xc), Y(y + bh)));
    if (b.par) {
      b.par.forEach((j, k) => {
        const ry = y + hb + rh * (k + 1) - 7;
        if (j?.esSlot) { txt(d, String(j.nombre ?? '').toUpperCase().includes('LIBRE') ? 'LIBRE (sin rival)' : String(j.nombre ?? ''), X(x0 + cols[0][1] + 6), Y(ry), { f: 'bold', s: 11 * K, c: GRIS, maxW: L(cols[1][1] - 12) }); return; }
        if (!j) return;
        if (j.ranking) txt(d, `#${j.ranking}`, X(x0 + 6), Y(ry), { f: 'bold', s: 9 * K, c: GRIS });
        txt(d, String(j.clubNombre || j.club || ''), X(x0 + 40), Y(ry), { s: 8.5 * K, c: [60, 60, 60], maxW: L(cols[0][1] - 46) });
        txt(d, String(j.nombre ?? ''), X(x0 + cols[0][1] + 6), Y(ry), { f: 'bold', s: 11.5 * K, maxW: L(cols[1][1] - 12) });
      });
    }
    y += bh + gap;
  }
  // Pie
  const fy = y + 4; const fh = (H - ML - 2) - fy; const bw = (tw / 2) * 1.15;
  d.setDrawColor(64, 64, 64); d.setLineWidth(0.8 * K); d.rect(X(x0), Y(fy), L(bw), L(fh));
  txt(d, 'CLASIFICACIÓN FINAL DE LA SERIE', X(x0 + 6), Y(fy + 11), { f: 'bold', s: 8.5 * K, c: GREEN });
  d.line(X(x0), Y(fy + 15), X(x0 + bw), Y(fy + 15));
  const cw = bw / 4;
  [['1º', 8], ['2º', 6], ['3º', 4], ['4º', 2]].forEach(([l, p], i) => {
    const cx = x0 + cw * i; if (i) d.line(X(cx), Y(fy + 15), X(cx), Y(fy + fh));
    txt(d, `${l}  (${p} pts)`, X(cx + 5), Y(fy + 26), { f: 'bold', s: 8 * K });
    d.line(X(cx + 5), Y(fy + fh - 7), X(cx + cw - 6), Y(fy + fh - 7));
  });
  const rx = x0 + bw + 8;
  txt(d, 'OBSERVACIONES', X(rx), Y(fy + 11), { f: 'bold', s: 8.5 * K, c: GREEN });
  d.setDrawColor(90, 90, 90); d.setLineWidth(0.6 * K);
  for (let k = 0; k < 4; k++) d.line(X(rx), Y(fy + fh - 7 - 14 * k), X(x1 - 190), Y(fy + fh - 7 - 14 * k));
  d.line(X(x1 - 180), Y(fy + fh - 9), X(x1), Y(fy + fh - 9));
  txt(d, 'Firma del juez', X(x1 - 180), Y(fy + fh - 1), { s: 7.5 * K, c: GRIS });
}

function paginaCruces(d: jsPDF, logo: string | null, tit: string, fase: string, lote: NonNullable<DatosPlanilla['cruces']>) {
  const W = 595.28, H = 841.89, ML = 26, NB = 7;
  d.setDrawColor(...GREEN); d.setLineWidth(2); d.rect(ML - 10, ML - 10, W - 2 * ML + 20, H - 2 * ML + 20);
  d.setLineWidth(0.6); d.rect(ML - 6, ML - 6, W - 2 * ML + 12, H - 2 * ML + 12);
  const x0 = ML, x1 = W - ML, tw = x1 - x0, top = ML + 2;
  if (logo) d.addImage(logo, 'PNG', x0 + 2, top + 2, 50, 50);
  txt(d, tit, W / 2, top + 18, { f: 'bold', s: 15.5, c: GREEN, a: 'center', maxW: 380 });
  txt(d, 'FEDERACIÓN DE BILLAR DEL URUGUAY', W / 2, top + 33, { s: 10, c: [50, 50, 50], a: 'center' });
  txt(d, 'PLANILLA DE CRUCES · 5 SETS', W / 2, top + 48, { f: 'bold', s: 10.5, a: 'center' });
  txt(d, 'Respaldo manual', x1, top + 18, { s: 8, c: GRIS, a: 'right' });
  let y = top + 58; const hh = 24;
  d.setFillColor(...GREEN); d.rect(x0, y, tw, hh, 'F');
  const salas = Array.from(new Set(lote.map(c => c.sede).filter(Boolean))).join(' / ');
  const fechas = Array.from(new Set(lote.map(c => c.fecha).filter(Boolean)));
  const campos: [string, string, number][] = [['FASE', fase, 190], ['SALA', salas, 170], ['FECHA', fechas.length === 1 ? fechas[0] : fechas.join(' / '), 0]];
  let xs = x0 + 8;
  for (const [lab, val, wd] of campos) {
    txt(d, lab, xs, y + 8.5, { s: 6.5, c: [215, 240, 215] });
    const ex = wd ? xs + wd - 10 : x1 - 8;
    d.setDrawColor(255, 255, 255); d.setLineWidth(0.6); d.line(xs, y + hh - 5, ex, y + hh - 5);
    if (val) txt(d, val, xs + 1, y + hh - 7, { f: 'bold', s: 9, c: [255, 255, 255], maxW: ex - xs - 2 });
    xs += wd;
  }
  const cols: [string, number][] = [['NOMBRE', 0], ['LIGA', 46], ['SET 1', 33], ['SET 2', 33], ['SET 3', 33], ['SET 4', 33], ['SET 5', 33], ['FIRMA', 90]];
  cols[0][1] = tw - cols.reduce((a, [, w]) => a + w, 0);
  y += hh + 8; const hb = 17, rh = 31, bh = hb + 2 * rh; const gap = (H - ML - 4 - y - NB * bh) / NB;
  for (let i = 0; i < NB; i++) {
    const c = lote[i];
    d.setFillColor(...CLARO); d.rect(x0, y, tw, hb, 'F');
    d.setDrawColor(64, 64, 64); d.setLineWidth(0.8); d.rect(x0, y, tw, bh); d.line(x0, y + hb, x1, y + hb); d.line(x0, y + hb + rh, x1, y + hb + rh);
    let xx = x0;
    cols.forEach(([lab, wd], k) => { if (k) { txt(d, lab, xx + wd / 2, y + 12, { f: 'bold', s: 7.5, c: [75, 75, 75], a: 'center' }); d.line(xx, y, xx, y + bh); } xx += wd; });
    txt(d, 'CRUCE N.º', x0 + 6, y + 12.2, { f: 'bold', s: 8.5, c: GREEN });
    d.setDrawColor(100, 100, 100); d.setLineWidth(0.5);
    d.line(x0 + 54, y + 14, x0 + 74, y + 14); d.line(x0 + 103, y + 14, x0 + 123, y + 14); d.line(x0 + 152, y + 14, x0 + 182, y + 14);
    txt(d, 'MESA', x0 + 80, y + 12.2, { f: 'bold', s: 7, c: [75, 75, 75] }); txt(d, 'HORA', x0 + 129, y + 12.2, { f: 'bold', s: 7, c: [75, 75, 75] });
    if (c) {
      txt(d, c.etiqueta, x0 + 64, y + 12, { f: 'bold', s: 8.5, a: 'center', maxW: 19 });
      txt(d, c.mesa, x0 + 113, y + 12, { f: 'bold', s: 8.5, a: 'center' });
      txt(d, c.hora, x0 + 167, y + 12, { f: 'bold', s: 8.5, a: 'center' });
      [c.a, c.b].forEach((j, k) => {
        if (!j) return; const ry = y + hb + rh * k + rh / 2 + 4;
        txt(d, String(j.nombre ?? ''), x0 + 6, ry, { f: 'bold', s: 10.5, c: j.esSlot ? GRIS : NEGRO, maxW: cols[0][1] - 12 });
        if (!j.esSlot && j.club) txt(d, String(j.club), x0 + cols[0][1] + cols[1][1] / 2, ry, { s: 9, a: 'center', c: [60, 60, 60] });
      });
    }
    y += bh + gap;
  }
  d.setLineWidth(0.8);
}

export async function generarPlanillaPDF(datos: DatosPlanilla): Promise<jsPDF> {
  const logo = await cargarLogo();
  const horiz = datos.tipo === 'series';
  const d = new jsPDF({ orientation: horiz ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  d.setProperties({ title: `Planillas de juez · ${datos.fase}`, author: 'FEBIU' });
  if (horiz) {
    datos.series!.forEach((s, i) => { if (i) d.addPage(); paginaSerie(d, logo, datos.titulo, s); });
  } else {
    const c = datos.cruces!;
    for (let i = 0; i < c.length; i += 7) { if (i) d.addPage(); paginaCruces(d, logo, datos.titulo, datos.fase, c.slice(i, i + 7)); }
  }
  return d;
}

export async function descargarPlanilla(datos: DatosPlanilla, nombre: string) {
  const d = await generarPlanillaPDF(datos); d.save(`${nombre}.pdf`);
}

export async function imprimirPlanilla(datos: DatosPlanilla) {
  const d = await generarPlanillaPDF(datos);
  d.autoPrint();
  const url = URL.createObjectURL(d.output('blob'));
  const w = window.open(url, '_blank');
  if (!w) { d.save('planilla-juez.pdf'); alert('El navegador bloqueó la ventana de impresión. Se descargó el PDF para que lo imprimas.'); }
}
