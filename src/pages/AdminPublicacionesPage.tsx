import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui';

const CLUB_ABREV: Record<string, string> = {
  'CAPOLAVORO': 'CAP', 'FERIA FRANCA': 'FER', 'YATAY': 'YAT',
  'CABRERA': 'CAB', 'MODEL CENTER': 'MOD', 'NUEVO MALVIN': 'NM',
  'SPORTING UNION': 'SPO', 'CENTENARIO': 'CEN',
  'CASA DEL BILLAR': 'CDB', 'PIEDRA HONDA': 'PH',
};
const abrevClub = (club?: string) =>
  club ? (CLUB_ABREV[club.toUpperCase()] ?? club.slice(0, 3).toUpperCase()) : '';

const TEMAS: Record<string, { header: string; accent: string; light: string; badge: string }> = {
  clasificatorio:   { header: '#1a5c2a', accent: '#2d8a3e', light: '#edf7ef', badge: '#1a5c2a' },
  reduccion:        { header: '#1a5c2a', accent: '#388e3c', light: '#f1f8e9', badge: '#1a5c2a' },
  segunda:          { header: '#b83c00', accent: '#e64a19', light: '#fff4f0', badge: '#b83c00' },
  primera:          { header: '#014f86', accent: '#0277bd', light: '#e8f4fd', badge: '#014f86' },
  master:           { header: '#4a1070', accent: '#7b1fa2', light: '#f5eef8', badge: '#4a1070' },
  ranking:          { header: '#7c4d00', accent: '#b8860b', light: '#fffbf0', badge: '#7c4d00' },
  'ranking-final':  { header: '#1a3560', accent: '#1e40af', light: '#eff6ff', badge: '#1a3560' },
  acumulado:        { header: '#1a3a5c', accent: '#1565c0', light: '#e8f0fe', badge: '#1a3a5c' },
  'series-nacional':{ header: '#1a5c2a', accent: '#2d8a3e', light: '#edf7ef', badge: '#1a5c2a' },
  'bracket-nacional':{ header: '#135c1a', accent: '#f5d020', light: '#fffde7', badge: '#135c1a' },
};

// Colores del bracket nacional por categoría federal
const COLORES_CATEGORIA: Record<string, { bg: string; bg2: string; accent: string; gold: string }> = {
  primera: { bg: '#014f86', bg2: '#0277bd', accent: '#4fc3f7', gold: '#f5d020' },
  segunda: { bg: '#8b3a00', bg2: '#e64a19', accent: '#ffab91', gold: '#f5d020' },
  tercera: { bg: '#135c1a', bg2: '#1e8a28', accent: '#81c784', gold: '#f5d020' },
};
const getColoresCategoria = (cat?: string) => {
  const c = (cat ?? '').toLowerCase();
  return COLORES_CATEGORIA[c] ?? COLORES_CATEGORIA.tercera;
};

const SECCION_COLORES: Record<string, { bg: string; badge: string; light: string }> = {
  'MÁSTER':  { bg: '#4a1070', badge: '#7b1fa2', light: '#f5eef8' },
  'PRIMERA': { bg: '#014f86', badge: '#0277bd', light: '#e8f4fd' },
  'SEGUNDA': { bg: '#b83c00', badge: '#e64a19', light: '#fff4f0' },
  'TERCERA': { bg: '#1a5c2a', badge: '#2d8a3e', light: '#edf7ef' },
};

const getCatColor = (categoria: string | null): { text: string; badge: string; light: string } => {
  const c = categoria?.toLowerCase();
  if (c === 'master')  return { text: '#4a1070', badge: '#4a1070', light: '#f5eef8' };
  if (c === 'primera') return { text: '#014f86', badge: '#014f86', light: '#e8f4fd' };
  if (c === 'segunda') return { text: '#b83c00', badge: '#b83c00', light: '#fff4f0' };
  if (c === 'tercera') return { text: '#1a5c2a', badge: '#1a5c2a', light: '#edf7ef' };
  return { text: '#999', badge: '#aaa', light: '#f5f5f5' };
};

const getSeccionColor = (seccion: string): { text: string; badge: string; light: string } => {
  const s = SECCION_COLORES[seccion];
  if (!s) return { text: '#999', badge: '#aaa', light: '#f5f5f5' };
  return { text: s.bg, badge: s.badge, light: s.light };
};

const FASES = [
  { value: 'clasificatorio',    label: '🟢 Series Clasificatorio' },
  { value: 'reduccion',         label: '🟢 Reducción Clasificatorio' },
  { value: 'segunda',           label: '🟠 Series Segunda' },
  { value: 'primera',           label: '🔵 Cruces Primera' },
  { value: 'master',            label: '🟣 Fase Máster' },
  { value: 'ranking',           label: '🏅 Ranking del Circuito' },
  { value: 'ranking-final',     label: '🏆 Ranking Final' },
  { value: 'acumulado',         label: '📊 Ranking Acumulado' },
  { value: 'series-nacional',   label: '🎱 Series Nacional' },
  { value: 'bracket-nacional',  label: '🏟 Bracket Nacional' },
];

const F = 'Arial, Helvetica, sans-serif';

const cargarHtml2Canvas = (): Promise<any> =>
  new Promise((resolve, reject) => {
    if ((window as any).html2canvas) { resolve((window as any).html2canvas); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve((window as any).html2canvas);
    script.onerror = () => reject(new Error('No se pudo cargar html2canvas'));
    document.head.appendChild(script);
  });

// ── Componentes base ──────────────────────────────────────────────────
function PubHeader({ data, tema }: { data: any; tema: any }) {
  return (
    <div style={{ background: tema.header, padding: '36px 50px 32px', display: 'flex', alignItems: 'center', gap: 36, fontFamily: F }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 6 }}>
        <img src="/logo-febiu.png" alt="FEBIU" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1.1 }}>{data.torneo}</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: 2, opacity: 0.9 }}>FEBIU · TEMPORADA {data.temporada}</div>
        <div style={{ fontSize: 32, fontWeight: 900, marginTop: 16, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1.1 }}>{data.fase}</div>
        {data.fechaPrincipal && <div style={{ fontSize: 20, marginTop: 8, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>{data.fechaPrincipal}</div>}
        {data.formato && <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 24px', display: 'inline-block', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>PARTIDAS A {data.formato.toUpperCase()}</div>}
      </div>
    </div>
  );
}

function PubFooter({ notas, tema }: { notas: string; tema: any }) {
  if (!notas.trim()) return null;
  return <div style={{ background: tema.light, borderTop: `4px solid ${tema.accent}`, padding: '20px 40px', fontSize: 20, color: tema.header, fontWeight: 600, lineHeight: 1.6, fontFamily: F }}>{notas}</div>;
}

function JRow({ j, tema, border }: { j: any; tema: any; border?: boolean }) {
  const cat = getCatColor(j.esSlot ? null : j.categoria);
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10, borderBottom: border ? `1px solid ${tema.light}` : 'none', minHeight: 48, fontFamily: F }}>
      {!j.esSlot && j.ranking !== null ? (
        <div style={{ width: 40, height: 32, background: cat.badge, color: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, flexShrink: 0 }}>{j.ranking}</div>
      ) : (
        <div style={{ width: 40, height: 32, background: '#e0e0e0', color: '#888', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>—</div>
      )}
      <div style={{ flex: 1, fontSize: 20, fontWeight: j.esSlot ? 400 : 700, color: j.esSlot ? '#aaa' : cat.text, fontStyle: j.esSlot ? 'italic' : 'normal', wordBreak: 'break-word' }}>{j.nombre}</div>
      {j.club && <div style={{ background: j.esSlot ? '#aaa' : cat.badge, color: '#fff', padding: '4px 10px', borderRadius: 4, fontSize: 16, fontWeight: 800, flexShrink: 0, letterSpacing: 1 }}>{j.club}</div>}
    </div>
  );
}

function InfoPartido({ p, tema, label }: { p: any; tema: any; label: string }) {
  return (
    <div style={{ background: tema.header, color: '#fff', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, fontFamily: F, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, opacity: 0.7, fontSize: 15, flexShrink: 0 }}>{label}</span>
      {p.hora ? <span>🕐 {p.hora}</span> : null}
      {p.fecha ? <span>📅 {p.fecha}</span> : null}
      {p.sede ? <span>📍 {p.sede}{p.mesa ? ` · Mesa ${p.mesa}` : ''}</span> : <span style={{ opacity: 0.5 }}>Sin asignar</span>}
      {p.resultado && <span style={{ marginLeft: 'auto', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '2px 12px', borderRadius: 4, fontSize: 19 }}>{p.resultado}</span>}
    </div>
  );
}

// ── Plantilla Series Departamental ────────────────────────────────────
function PlantillaSeries({ data, tema }: { data: any; tema: any }) {
  const series: any[] = data.series ?? [];
  const pares: any[][] = [];
  for (let i = 0; i < series.length; i += 2) pares.push([series[i], series[i + 1] ?? null]);
  return (
    <div style={{ padding: '20px 24px', background: '#f8f8f8', fontFamily: F }}>
      {pares.map((par, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          {par.map((s, si) => s ? (
            <div key={si} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ background: tema.accent, color: '#fff', padding: '8px 16px', fontSize: 18, fontWeight: 900, letterSpacing: 3, borderRadius: '6px 6px 0 0' }}>SERIE {s.numero}</div>
              {s.p1 && (<><div style={{ background: tema.light }}><JRow j={s.p1.jugadorA} tema={tema} border /><JRow j={s.p1.jugadorB} tema={tema} /></div><InfoPartido p={s.p1} tema={tema} label="P1" /></>)}
              {s.p2 && (<><div style={{ background: '#fff', borderTop: `2px solid ${tema.light}` }}><JRow j={s.p2.jugadorA} tema={tema} border /><JRow j={s.p2.jugadorB} tema={tema} /></div><InfoPartido p={s.p2} tema={tema} label="P2" /></>)}
            </div>
          ) : <div key={si} style={{ flex: 1 }} />)}
        </div>
      ))}
    </div>
  );
}

function PlantillaReduccion({ data, tema }: { data: any; tema: any }) {
  const cruces: any[] = data.cruces ?? [];
  const pares: any[][] = [];
  for (let i = 0; i < cruces.length; i += 2) pares.push([cruces[i], cruces[i + 1] ?? null]);
  return (
    <div style={{ padding: '20px 24px', background: '#f8f8f8', fontFamily: F }}>
      {pares.map((par, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
          {par.map((c, ci) => c ? (
            <div key={ci} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ background: tema.accent, color: '#fff', padding: '7px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '6px 6px 0 0' }}>
                <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: 1 }}>{c.esRepechaje ? 'REPECHAJE' : `CRUCE ${c.numero}`}</span>
                {c.resultado && <span style={{ fontWeight: 900, fontSize: 19 }}>{c.resultado}</span>}
              </div>
              <JRow j={c.jugadorA} tema={tema} border /><JRow j={c.jugadorB} tema={tema} />
              <div style={{ background: tema.light, padding: '7px 14px', fontSize: 16, color: tema.header, display: 'flex', gap: 12, fontWeight: 600, flexWrap: 'wrap' }}>
                {c.hora ? <span>🕐 {c.hora}</span> : null}{c.fecha ? <span>📅 {c.fecha}</span> : null}
                {c.sede ? <span>📍 {c.sede}{c.mesa ? ` M.${c.mesa}` : ''}</span> : <span style={{ opacity: 0.5 }}>Sin asignar</span>}
              </div>
            </div>
          ) : <div key={ci} style={{ flex: 1 }} />)}
        </div>
      ))}
    </div>
  );
}

function PlantillaCruces({ data, tema }: { data: any; tema: any }) {
  const cruces: any[] = data.cruces ?? [];
  const porEtapa: Record<string, any[]> = {};
  for (const c of cruces) { const k = c.etapa ?? 'CRUCES'; if (!porEtapa[k]) porEtapa[k] = []; porEtapa[k].push(c); }
  const etapas = Object.keys(porEtapa);
  return (
    <div style={{ padding: '20px 24px', background: '#f8f8f8', fontFamily: F }}>
      {etapas.map(etapa => {
        const arr = porEtapa[etapa];
        const pares: any[][] = [];
        for (let i = 0; i < arr.length; i += 2) pares.push([arr[i], arr[i + 1] ?? null]);
        return (
          <div key={etapa} style={{ marginBottom: 20 }}>
            {etapas.length > 1 && <div style={{ background: tema.accent, color: '#fff', padding: '10px 18px', fontSize: 20, fontWeight: 900, letterSpacing: 3, borderRadius: '8px 8px 0 0', marginBottom: 8 }}>{etapa}</div>}
            {pares.map((par, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                {par.map((c, ci) => c ? (
                  <div key={ci} style={{ flex: 1, border: `2px solid ${tema.accent}`, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ background: tema.light, padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${tema.accent}`, borderRadius: '6px 6px 0 0', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontWeight: 900, fontSize: 17, color: tema.header, letterSpacing: 1 }}>CRUCE {c.round}</span>
                      <span style={{ fontSize: 16, color: tema.accent, fontWeight: 600 }}>{c.hora ? `🕐 ${c.hora}` : ''} {c.fecha ? `📅 ${c.fecha}` : ''}</span>
                      {c.resultado && <span style={{ fontWeight: 900, color: tema.header, fontSize: 20 }}>{c.resultado}</span>}
                    </div>
                    <JRow j={c.jugadorA} tema={tema} border /><JRow j={c.jugadorB} tema={tema} />
                    {c.sede && <div style={{ background: tema.header, color: '#fff', padding: '7px 14px', fontSize: 16, fontWeight: 600 }}>📍 {c.sede}{c.mesa ? ` · Mesa ${c.mesa}` : ''}</div>}
                  </div>
                ) : <div key={ci} style={{ flex: 1 }} />)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PlantillaRanking({ data, tema }: { data: any; tema: any }) {
  const jugadores: any[] = data.jugadores ?? [];
  const secciones = ['MÁSTER', 'PRIMERA', 'SEGUNDA', 'TERCERA'];
  const porSeccion: Record<string, any[]> = {};
  for (const j of jugadores) { if (!porSeccion[j.seccion]) porSeccion[j.seccion] = []; porSeccion[j.seccion].push(j); }
  return (
    <div style={{ padding: '20px 24px', background: '#f8f8f8', fontFamily: F }}>
      {secciones.filter(s => porSeccion[s]?.length > 0).map(seccion => {
        const secColor = SECCION_COLORES[seccion];
        const jugSec = porSeccion[seccion];
        const mitad = Math.ceil(jugSec.length / 2);
        const col1 = jugSec.slice(0, mitad);
        const col2 = jugSec.slice(mitad);
        return (
          <div key={seccion} style={{ marginBottom: 20 }}>
            <div style={{ background: secColor.bg, color: '#fff', padding: '10px 20px', fontSize: 22, fontWeight: 900, letterSpacing: 3, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>{seccion}</span>
              <span style={{ fontSize: 16, opacity: 0.8, fontWeight: 600 }}>({jugSec.length} jugadores · pos. {jugSec[0].posicion}–{jugSec[jugSec.length - 1].posicion})</span>
            </div>
            <div style={{ display: 'flex', gap: 0, background: '#fff', border: `2px solid ${secColor.bg}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
              {[col1, col2].map((col, ci) => (
                <div key={ci} style={{ flex: 1, borderLeft: ci === 1 ? `2px solid ${secColor.bg}` : 'none' }}>
                  <div style={{ display: 'flex', background: secColor.bg, padding: '6px 10px', gap: 8, opacity: 0.9 }}>
                    <span style={{ width: 44, fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }}>#</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Jugador</span>
                    <span style={{ width: 40, fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Club</span>
                    <span style={{ width: 44, fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'right' }}>Pts</span>
                  </div>
                  {col.map((j: any, idx: number) => {
                    const catColor = getSeccionColor(j.seccion);
                    return (
                      <div key={j.posicion} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', gap: 8, background: idx % 2 === 0 ? catColor.light : '#fff', borderBottom: '1px solid #eee' }}>
                        <div style={{ width: 44, height: 30, borderRadius: 4, flexShrink: 0, background: catColor.badge, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900 }}>{j.posicion}</div>
                        <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: catColor.text, wordBreak: 'break-word', lineHeight: 1.2 }}>{j.nombre}</div>
                        {j.club && <div style={{ width: 40, background: catColor.badge, color: '#fff', padding: '3px 4px', borderRadius: 3, fontSize: 13, fontWeight: 800, textAlign: 'center', flexShrink: 0 }}>{j.club}</div>}
                        <div style={{ width: 44, fontSize: 17, fontWeight: 900, color: catColor.text, textAlign: 'right', flexShrink: 0 }}>{j.puntos}</div>
                      </div>
                    );
                  })}
                  {ci === 1 && col.length < col1.length && Array.from({ length: col1.length - col.length }).map((_, i) => (
                    <div key={`e-${i}`} style={{ height: 47, background: (col.length + i) % 2 === 0 ? '#f9f9f9' : '#fff', borderBottom: '1px solid #eee' }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Plantilla Series Nacional ─────────────────────────────────────────
function PlantillaSeriesNacional({ data, tema }: { data: any; tema: any }) {
  const series: any[] = data.series ?? [];
  const VERDE = tema.header;
  const ACENTO = tema.accent;
  const LIGHT = tema.light;
  const F2 = F;

  const mkRow = (jugador: any, isWinner: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', gap: 8, background: isWinner ? '#d4edda' : 'transparent' }}>
      {jugador.ranking !== null ? (
        <div style={{ width: 32, height: 26, background: isWinner ? '#166a1e' : '#888', color: '#fff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{jugador.ranking}</div>
      ) : (
        <div style={{ width: 32, height: 26, background: '#ccc', borderRadius: 3, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, fontSize: 16, fontWeight: isWinner ? 800 : 500, color: isWinner ? '#135c1a' : '#333', wordBreak: 'break-word', lineHeight: 1.2, fontFamily: F2 }}>
        {jugador.esSlot ? <span style={{ color: '#aaa', fontStyle: 'italic' }}>{jugador.nombre}</span> : jugador.nombre}
      </div>
      {jugador.club && !jugador.esSlot && (
        <div style={{ background: isWinner ? '#166a1e' : '#888', color: '#fff', padding: '2px 6px', borderRadius: 3, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{jugador.club}</div>
      )}
    </div>
  );

  const PartidoRow = ({ p, label }: { p: any; label: string }) => {
    if (!p) return null;
    const winA = p.resultado && p.resultado.split('-')[0] > p.resultado.split('-')[1];
    const winB = p.resultado && p.resultado.split('-')[1] > p.resultado.split('-')[0];
    return (
      <div style={{ borderTop: `1px solid ${LIGHT}`, fontFamily: F2 }}>
        <div style={{ background: VERDE, color: '#fff', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span style={{ fontWeight: 700, opacity: 0.85 }}>{label}</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{p.hora ? `🕐 ${p.hora}` : ''} {p.sede ? `📍 ${p.sede}` : ''}</span>
          {p.resultado && <span style={{ fontWeight: 900, background: 'rgba(255,255,255,0.25)', padding: '1px 8px', borderRadius: 3, fontSize: 15 }}>{p.resultado}</span>}
        </div>
        {mkRow(p.jugadorA, winA)}<div style={{ height: 1, background: LIGHT }} />{mkRow(p.jugadorB, winB)}
      </div>
    );
  };

  const pares: any[][] = [];
  for (let i = 0; i < series.length; i += 2) pares.push([series[i], series[i + 1] ?? null]);

  return (
    <div style={{ padding: '16px 20px', background: '#f5f5f5', fontFamily: F }}>
      {pares.map((par, pi) => (
        <div key={pi} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {par.map((s, si) => s ? (
            <div key={si} style={{ flex: 1, border: `2px solid ${ACENTO}`, borderRadius: 8, background: '#fff', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              {/* Serie header */}
              <div style={{ background: ACENTO, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>SERIE {s.numero}</span>
                {s.completa && <span style={{ background: 'rgba(255,255,255,0.3)', padding: '2px 10px', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>✓ COMPLETA</span>}
              </div>
              {/* Partidos */}
              <PartidoRow p={s.p1} label="P1 — Partido 1" />
              <PartidoRow p={s.p2} label="P2 — Partido 2" />
              <PartidoRow p={s.p3} label="P3 — Por el 1°" />
              <PartidoRow p={s.p4} label="P4 — Por el 4°" />
              <PartidoRow p={s.p5} label="P5 — Por el 2° y 3°" />
              {/* Clasificación final si está completa */}
              {s.completa && (
                <div style={{ background: LIGHT, borderTop: `2px solid ${ACENTO}`, padding: '8px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: VERDE, marginBottom: 4 }}>CLASIFICACIÓN FINAL</div>
                  {[['🥇 1°', s.primero], ['🥈 2°', s.segundo], ['🥉 3°', s.tercero], ['4°', s.cuarto]].map(([lbl, jug]: any) =>
                    jug ? (
                      <div key={lbl} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 2 }}>
                        <span style={{ width: 28, fontWeight: 700 }}>{lbl}</span>
                        <span style={{ fontWeight: 600 }}>{jug.nombre}</span>
                        {jug.ranking && <span style={{ background: ACENTO, color: '#fff', padding: '1px 6px', borderRadius: 3, fontSize: 12, fontWeight: 800 }}>#{jug.ranking}</span>}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          ) : <div key={si} style={{ flex: 1 }} />)}
        </div>
      ))}
    </div>
  );
}

// ── Plantilla Bracket Nacional ────────────────────────────────────────
function PlantillaBracketNacional({ data, sala, fechaBracket, horasOctavos }:
  { data: any; sala: string; fechaBracket: string; horasOctavos: string[] }) {
  const oct  = data.octavos ?? Array(8).fill(null);
  const cua  = data.cuartos ?? Array(4).fill(null);
  const sem  = data.semis   ?? Array(2).fill(null);
  const fin  = data.final;
  const camp = data.campeon;

  // Colores según categoría federal que llega del backend
  const C = getColoresCategoria(data.categoriaFederal);
  const BG     = C.bg;       // fondo principal
  const BG2    = C.bg2;      // tono cajas
  const ACCENT = C.accent;   // líneas / acentos
  const GOLD   = C.gold;     // dorado
  const WHITE  = '#ffffff';
  const INK    = '#16222e';

  const getName = (m: any, side: 'A' | 'B'): string => {
    if (!m) return '';
    const p = side === 'A' ? m.playerA : m.playerB;
    if (p?.nombre) return p.nombre;
    const slot = side === 'A' ? m.slotA : m.slotB;
    if (slot) { const x = slot.match(/#(\d+)/); return x ? `#${x[1]}` : slot; }
    return '';
  };

  const getSeed = (m: any, side: 'A' | 'B'): string => {
    if (!m) return '';
    const slot = side === 'A' ? m.slotA : m.slotB;
    if (slot) { const x = slot.match(/#(\d+)/); if (x) return x[1]; }
    return '';
  };

  const isWin = (m: any, side: 'A' | 'B'): boolean => {
    if (!m?.winnerId) return false;
    const pid = side === 'A' ? m.playerAId : m.playerBId;
    return m.winnerId === pid;
  };

  // ── Caja de OCTAVOS (sin mostrar semillas en el header, hora editable) ──
  const OctBox = ({ m, hora, seedLeft }: { m: any; hora: string; seedLeft: boolean }) => {
    const wA = isWin(m, 'A'), wB = isWin(m, 'B');
    const SeedBadge = ({ side }: { side: 'A' | 'B' }) => {
      const s = getSeed(m, side);
      if (!s) return <div style={{ width: 22, flexShrink: 0 }} />;
      return (
        <div style={{ width: 22, height: 22, background: GOLD, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, borderRadius: 4, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>{s}</div>
      );
    };
    const Row = ({ side }: { side: 'A' | 'B' }) => {
      const win = side === 'A' ? wA : wB;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: win ? 'rgba(255,255,255,0.22)' : 'transparent', borderTop: side === 'B' ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
          {seedLeft && <SeedBadge side={side} />}
          <div style={{ flex: 1, background: WHITE, height: 22, borderRadius: 4, padding: '0 7px', fontSize: 11.5, fontWeight: win ? 800 : 500, color: win ? BG : '#2b2b2b', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {getName(m, side) || <span style={{ color: '#c4c4c4' }}>—</span>}
          </div>
          {!seedLeft && <SeedBadge side={side} />}
        </div>
      );
    };
    return (
      <div style={{ background: BG2, borderRadius: 8, marginBottom: 6, overflow: 'hidden', fontFamily: F, boxShadow: '0 2px 6px rgba(0,0,0,0.22)' }}>
        <div style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD}dd)`, color: INK, padding: '4px 8px', fontSize: 11, fontWeight: 900, letterSpacing: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>OCTAVOS</span>
          <span style={{ fontWeight: 700, fontSize: 10 }}>🕐 {hora && hora.trim() ? hora : 'Hora: ___'}</span>
        </div>
        <Row side="A" /><Row side="B" />
      </div>
    );
  };

  // ── Caja de etapas (cuartos / semis / final) ──
  const StageBox = ({ m, label }: { m: any; label: string }) => {
    const wA = isWin(m, 'A'), wB = isWin(m, 'B');
    const Row = ({ side }: { side: 'A' | 'B' }) => {
      const win = side === 'A' ? wA : wB;
      return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', background: win ? 'rgba(255,255,255,0.22)' : 'transparent', borderTop: side === 'B' ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
          <div style={{ flex: 1, background: WHITE, height: 22, borderRadius: 4, padding: '0 7px', fontSize: 11.5, fontWeight: win ? 800 : 500, color: win ? BG : '#2b2b2b', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {getName(m, side) || <span style={{ color: '#c4c4c4' }}>—</span>}
          </div>
          {m?.resultado && <span style={{ fontSize: 11, fontWeight: 900, color: win ? GOLD : 'rgba(255,255,255,0.4)', marginLeft: 4, flexShrink: 0 }}>
            {m.resultado.split('-')[side === 'A' ? 0 : 1]}
          </span>}
        </div>
      );
    };
    return (
      <div style={{ background: BG2, borderRadius: 8, overflow: 'hidden', fontFamily: F, boxShadow: '0 2px 8px rgba(0,0,0,0.28)' }}>
        <div style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD}dd)`, color: INK, padding: '4px 8px', fontSize: 11, fontWeight: 900, letterSpacing: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{label}</span>
          {m?.hora && <span style={{ fontWeight: 700, fontSize: 10 }}>🕐{m.hora}</span>}
        </div>
        <Row side="A" /><Row side="B" />
      </div>
    );
  };

  const conn = (side: 'left' | 'right', pos: 'top' | 'bottom') =>
    ({ flex: 1,
       [`border${side === 'left' ? 'Right' : 'Left'}`]: `2px solid ${ACCENT}`,
       [`border${pos === 'top' ? 'Bottom' : 'Top'}`]: `2px solid ${ACCENT}` } as any);

  return (
    <div style={{ width: 1080, background: `linear-gradient(160deg, ${BG} 0%, ${BG2} 100%)`, boxSizing: 'border-box', fontFamily: F, borderRadius: 14, overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: `3px solid ${GOLD}`, gap: 14, background: 'rgba(0,0,0,0.18)' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, color: '#222', minWidth: 175, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <span style={{ color: '#888', fontSize: 10, letterSpacing: 1 }}>SALA</span><br />
          <span style={{ color: '#222' }}>{sala || '___________'}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: GOLD, letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.45)', lineHeight: 1.05 }}>{data.torneo}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: WHITE, letterSpacing: 3, marginTop: 4, opacity: 0.9 }}>{data.fase}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, color: '#222', minWidth: 175, textAlign: 'right', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          <span style={{ color: '#888', fontSize: 10, letterSpacing: 1 }}>FECHA</span><br />
          <span style={{ color: '#222' }}>{fechaBracket || '___________'}</span>
        </div>
      </div>

      {/* ── BRACKET ── */}
      <div style={{ display: 'flex', padding: '14px 10px 16px', alignItems: 'stretch', gap: 0 }}>

        {/* LEFT OCTAVOS */}
        <div style={{ width: 158, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <OctBox m={oct[0]} hora={horasOctavos[0]} seedLeft={true} />
          <OctBox m={oct[1]} hora={horasOctavos[1]} seedLeft={true} />
          <OctBox m={oct[2]} hora={horasOctavos[2]} seedLeft={true} />
          <OctBox m={oct[3]} hora={horasOctavos[3]} seedLeft={true} />
        </div>

        {/* Connector oct→cua left */}
        <div style={{ width: 12, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          <div style={conn('left', 'top')} />
          <div style={conn('left', 'bottom')} />
          <div style={conn('left', 'top')} />
          <div style={conn('left', 'bottom')} />
        </div>

        {/* LEFT CUARTOS */}
        <div style={{ width: 142, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 4 }}>
          <StageBox m={cua[0]} label="CUARTOS" />
          <StageBox m={cua[1]} label="CUARTOS" />
        </div>

        {/* Connector cua→semi left */}
        <div style={{ width: 12, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 2, borderRight: `2px solid ${ACCENT}`, borderBottom: `2px solid ${ACCENT}` }} />
          <div style={{ flex: 2, borderRight: `2px solid ${ACCENT}`, borderTop: `2px solid ${ACCENT}` }} />
          <div style={{ flex: 4 }} />
        </div>

        {/* LEFT SEMI */}
        <div style={{ width: 128, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '18%' }}>
          <StageBox m={sem[0]} label="SEMIFINAL" />
        </div>

        {/* Connector semi→final left */}
        <div style={{ width: 12, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 3, borderRight: `2px solid ${ACCENT}`, borderBottom: `2px solid ${ACCENT}` }} />
          <div style={{ flex: 5 }} />
        </div>

        {/* CENTER */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 6px' }}>
          <img src="/logo-febiu.png" alt="FEBIU" crossOrigin="anonymous"
            style={{ width: 100, height: 100, borderRadius: '50%', border: `4px solid ${GOLD}`, objectFit: 'contain', background: WHITE, boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }} />
          <div style={{ color: GOLD, fontSize: 15, fontWeight: 900, letterSpacing: 4, textAlign: 'center', marginTop: 4 }}>FINAL</div>
          <StageBox m={fin} label="FINAL" />
          <div style={{ color: GOLD, fontSize: 15, fontWeight: 900, letterSpacing: 3, marginTop: 6 }}>🏆 CAMPEÓN</div>
          <div style={{
            background: camp ? `linear-gradient(90deg, ${GOLD}, ${GOLD}cc)` : 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '8px 10px', fontSize: 13, fontWeight: 900,
            textAlign: 'center', width: '100%',
            color: camp ? INK : 'rgba(255,255,255,0.3)',
            minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: camp ? '0 3px 10px rgba(0,0,0,0.3)' : 'none'
          }}>
            {camp ? camp.nombre : '—'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, letterSpacing: 1 }}>FEBIU · {data.temporada}</div>
        </div>

        {/* Connector final→semi right */}
        <div style={{ width: 12, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 5 }} />
          <div style={{ flex: 3, borderLeft: `2px solid ${ACCENT}`, borderBottom: `2px solid ${ACCENT}` }} />
        </div>

        {/* RIGHT SEMI */}
        <div style={{ width: 128, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '18%' }}>
          <StageBox m={sem[1]} label="SEMIFINAL" />
        </div>

        {/* Connector semi→cua right */}
        <div style={{ width: 12, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 4 }} />
          <div style={{ flex: 2, borderLeft: `2px solid ${ACCENT}`, borderBottom: `2px solid ${ACCENT}` }} />
          <div style={{ flex: 2, borderLeft: `2px solid ${ACCENT}`, borderTop: `2px solid ${ACCENT}` }} />
        </div>

        {/* RIGHT CUARTOS */}
        <div style={{ width: 142, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 4 }}>
          <StageBox m={cua[2]} label="CUARTOS" />
          <StageBox m={cua[3]} label="CUARTOS" />
        </div>

        {/* Connector cua→oct right */}
        <div style={{ width: 12, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          <div style={conn('right', 'top')} />
          <div style={conn('right', 'bottom')} />
          <div style={conn('right', 'top')} />
          <div style={conn('right', 'bottom')} />
        </div>

        {/* RIGHT OCTAVOS */}
        <div style={{ width: 158, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <OctBox m={oct[4]} hora={horasOctavos[4]} seedLeft={false} />
          <OctBox m={oct[5]} hora={horasOctavos[5]} seedLeft={false} />
          <OctBox m={oct[6]} hora={horasOctavos[6]} seedLeft={false} />
          <OctBox m={oct[7]} hora={horasOctavos[7]} seedLeft={false} />
        </div>

      </div>
    </div>
  );
}


// ── Dispatcher principal ──────────────────────────────────────────────
function PubContenido({ data, tema, notas, sala, fechaBracket, horasOctavos }:
  { data: any; tema: any; notas: string; sala: string; fechaBracket: string; horasOctavos: string[] }) {
  if (data.tipo === 'bracket-nacional') {
    return <PlantillaBracketNacional data={data} sala={sala} fechaBracket={fechaBracket} horasOctavos={horasOctavos} />;
  }
  return (
    <>
      <PubHeader data={data} tema={tema} />
      {data.tipo === 'series'          && <PlantillaSeries          data={data} tema={tema} />}
      {data.tipo === 'reduccion'       && <PlantillaReduccion       data={data} tema={tema} />}
      {data.tipo === 'cruces'          && <PlantillaCruces          data={data} tema={tema} />}
      {data.tipo === 'ranking'         && <PlantillaRanking         data={data} tema={tema} />}
      {data.tipo === 'series-nacional' && <PlantillaSeriesNacional  data={data} tema={tema} />}
      <PubFooter notas={notas} tema={tema} />
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────
export default function AdminPublicacionesPage() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';

  const [torneos, setTorneos]       = useState<any[]>([]);
  const [circuitId, setCircuitId]   = useState('');
  const [tipoFase, setTipoFase]     = useState('clasificatorio');
  const [pubData, setPubData]       = useState<any>(null);
  const [loading, setLoading]       = useState(false);
  const [exportando, setExportando] = useState(false);
  const [vaciando, setVaciando]     = useState(false);
  const [notas, setNotas]           = useState('');
  const [sala, setSala]             = useState('');
  const [fechaBracket, setFechaBracket] = useState('');
  const [horasOctavos, setHorasOctavos] = useState<string[]>(['', '', '', '', '', '', '', '']);
  const [error, setError]           = useState('');
  const exportRef  = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setHoraOct = (i: number, v: string) =>
    setHorasOctavos(prev => prev.map((h, idx) => (idx === i ? v : h)));
  const aplicarHoraGlobal = (v: string) =>
    setHorasOctavos(Array(8).fill(v));

  useEffect(() => {
    api.get('/publicaciones/circuitos').then(r => {
      setTorneos(r.data);
      if (r.data.length > 0 && r.data[0].circuits?.length > 0) {
        const circuits = r.data[0].circuits;
        const maxOrder = Math.max(...circuits.map((c: any) => c.order ?? 0));
        const ultimo = circuits.find((c: any) => c.order === maxOrder) ?? circuits[0];
        setCircuitId(String(ultimo.id));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (wrapperRef.current && exportRef.current) {
      const isBracket = pubData?.tipo === 'bracket-nacional';
      const scale = isBracket ? 0.42 : 0.5;
      const w = isBracket ? 1080 : 1080;
      wrapperRef.current.style.width  = `${Math.round(w * scale)}px`;
      wrapperRef.current.style.height = `${exportRef.current.scrollHeight * scale}px`;
    }
  }, [pubData, notas, sala, fechaBracket, horasOctavos]);

  const vaciarTodo = async () => {
    if (!confirm('⚠️ ¿Vaciar todos los reportes y ranking?\n\nEsta acción no se puede deshacer.')) return;
    setVaciando(true);
    try {
      const res = await api.delete('/publicaciones/reset');
      alert(`✅ ${res.data.message}`);
      setPubData(null);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al vaciar');
    } finally { setVaciando(false); }
  };

  const cargar = async () => {
    if (!circuitId) return;
    setLoading(true); setError(''); setPubData(null);
    try {
      if (tipoFase === 'ranking' || tipoFase === 'ranking-final') {
        const res = await api.get(`/publicaciones/${circuitId}/${tipoFase}`);
        setPubData(res.data); setNotas(''); setLoading(false); return;
      }

      if (tipoFase === 'acumulado') {
        const todosCircuitos = torneos.flatMap((t: any) =>
          (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name, torneoYear: t.year, torneoId: t.id }))
        );
        const circuito = todosCircuitos.find((c: any) => c.id === Number(circuitId));
        if (!circuito) { setError('Circuito no encontrado.'); setLoading(false); return; }
        const acumRes = await api.get(`/acumulado/${circuito.torneoId}`);
        if (!acumRes.data || acumRes.data.length === 0) {
          setError('No hay ranking acumulado disponible aún.'); setLoading(false); return;
        }
        const lastCircuitOrder = acumRes.data[0]?.lastCircuitOrder ?? 1;
        const circuitosIncluidos = acumRes.data[0]?.circuitosIncluidos ?? '';
        const jugadores = acumRes.data.map((e: any) => ({
          posicion: e.position ?? 0,
          nombre: `${e.player.lastName}, ${e.player.firstName}`,
          club: abrevClub(e.player.club),
          puntos: e.points,
          categoria: e.player?.category?.name ?? null,
          seccion: (e.position ?? 999) <= 8 ? 'MÁSTER' : (e.position ?? 999) <= 32 ? 'PRIMERA' : (e.position ?? 999) <= 64 ? 'SEGUNDA' : 'TERCERA',
        }));
        setPubData({ tipo: 'ranking', tipoFase: 'acumulado', torneo: circuito.torneoNombre, circuito: circuitosIncluidos, temporada: String(circuito.torneoYear), fase: `RANKING ACUMULADO — LUEGO DEL CIRCUITO ${lastCircuitOrder}`, formato: '', fechaPrincipal: `Incluye: ${circuitosIncluidos}`, jugadores });
        setNotas(''); setLoading(false); return;
      }

      const res = await api.get(`/publicaciones/${circuitId}/${tipoFase}`);
      setPubData(res.data); setNotas('');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al cargar los datos');
    } finally { setLoading(false); }
  };

  const exportar = async () => {
    if (!exportRef.current) return;
    setExportando(true);
    try {
      const h2c = await cargarHtml2Canvas();
      const canvas = await h2c(exportRef.current, {
        scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
        width: exportRef.current.scrollWidth, height: exportRef.current.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `${pubData?.fase ?? 'publicacion'} - ${pubData?.circuito ?? ''}.png`.replace(/[/\\?%*:|"<>]/g, '-');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (e: any) { alert(`Error al exportar: ${e.message}`); }
    finally { setExportando(false); }
  };

  const tema = TEMAS[tipoFase] ?? TEMAS.clasificatorio;
  const circuitos = torneos.flatMap((t: any) => (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name })));
  const esBracket = tipoFase === 'bracket-nacional';

  return (
    <div>
      {pubData && esAdmin && (
        <div ref={exportRef} style={{ position: 'absolute', left: '-9999px', top: 0, fontFamily: F, background: '#ffffff', lineHeight: 1.3 }}>
          <PubContenido data={pubData} tema={tema} notas={notas} sala={sala} fechaBracket={fechaBracket} horasOctavos={horasOctavos} />
        </div>
      )}

      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-gold">PUBLICACIONES</h1>
          <p className="text-chalk/50 text-sm mt-1">{esAdmin ? 'Generación y exportación de gráficos para difusión' : 'Gráficos del torneo'}</p>
        </div>
        {esAdmin && (
          <button className="py-1.5 px-4 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-40"
            onClick={vaciarTodo} disabled={vaciando}>
            {vaciando ? 'Vaciando...' : '🗑 Vaciar todo'}
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Circuito</label>
              <select className="input" value={circuitId} onChange={e => { setCircuitId(e.target.value); setPubData(null); }}>
                <option value="">Seleccionar circuito...</option>
                {circuitos.map((c: any) => <option key={c.id} value={c.id}>{c.torneoNombre} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Publicación</label>
              <select className="input" value={tipoFase} onChange={e => { setTipoFase(e.target.value); setPubData(null); }}>
                {FASES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-primary w-full" disabled={!circuitId || loading} onClick={cargar}>
                {loading ? 'Cargando...' : '👁 Ver publicación'}
              </button>
            </div>
          </div>

          {/* Campos extra para bracket */}
          {esAdmin && esBracket && (
            <div className="space-y-4 pt-1 border-t border-felt-light/10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Sala / Sede (aparece en el bracket)</label>
                  <input className="input" placeholder="Ej: Club Capolavoro" value={sala} onChange={e => setSala(e.target.value)} />
                </div>
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fecha (aparece en el bracket)</label>
                  <input className="input" placeholder="Ej: 14 de junio de 2026" value={fechaBracket} onChange={e => setFechaBracket(e.target.value)} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest">Horarios de octavos</label>
                  <input
                    className="input !w-40 !py-1 text-xs"
                    placeholder="Aplicar a todos…"
                    onChange={e => aplicarHoraGlobal(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {horasOctavos.map((h, i) => (
                    <input
                      key={i}
                      className="input !py-1 text-sm"
                      placeholder={`Oct ${i + 1}`}
                      value={h}
                      onChange={e => setHoraOct(i, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {esAdmin && pubData && (
            <>
              {!esBracket && (
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nota al pie (opcional)</label>
                  <textarea className="input w-full" rows={2} placeholder="Ej: Los ganadores pasan a la siguiente fase..." value={notas} onChange={e => setNotas(e.target.value)} />
                </div>
              )}
              <div className="flex items-center gap-4">
                <button className="btn-primary px-8" disabled={exportando} onClick={exportar}>
                  {exportando ? 'Exportando...' : '⬇ Exportar PNG'}
                </button>
                <span className="text-chalk/30 text-xs">Alta resolución · WhatsApp y redes</span>
              </div>
            </>
          )}
        </div>

        {error && <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
        {loading && <LoadingSpinner />}

        {pubData && !loading && (
          <div>
            <p className="text-chalk/40 text-xs uppercase tracking-widest mb-3">
              {pubData.tipo === 'ranking'         ? `${pubData.jugadores?.length ?? 0} jugadores`
               : pubData.tipo === 'series'        ? `${pubData.series?.length ?? 0} series`
               : pubData.tipo === 'series-nacional'? `${pubData.series?.length ?? 0} series`
               : pubData.tipo === 'bracket-nacional'? `Bracket 16 jugadores`
               : `${pubData.cruces?.length ?? 0} cruces`}
            </p>
            <div ref={wrapperRef} style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'inline-block' }}>
              <div style={{ width: '1080px', transform: 'scale(0.5)', transformOrigin: 'top left', fontFamily: F, background: '#ffffff', lineHeight: 1.3 }}>
                <PubContenido data={pubData} tema={tema} notas={notas} sala={sala} fechaBracket={fechaBracket} horasOctavos={horasOctavos} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
