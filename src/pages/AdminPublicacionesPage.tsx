import React, { useEffect, useRef, useState, useCallback } from 'react';
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

// ── País / bandera (reutilizable en todas las plantillas panamericano) ──
const PAIS_APOCOPE_GLOBAL: Record<string, string> = {
  'Uruguay': 'URU', 'Argentina': 'ARG', 'Brasil': 'BRA', 'Brazil': 'BRA',
  'Paraguay': 'PAR', 'Chile': 'CHI', 'Bolivia': 'BOL', 'Peru': 'PER',
  'Perú': 'PER', 'Colombia': 'COL', 'Venezuela': 'VEN', 'Ecuador': 'ECU',
};
const apocPaisG = (pais?: string | null): string =>
  pais ? (PAIS_APOCOPE_GLOBAL[pais] ?? pais.slice(0, 3).toUpperCase()) : 'URU';
const banderaPaisG = (pais?: string | null): string | null => {
  const apoc = apocPaisG(pais);
  const M: Record<string, string> = { 'URU': FLAG_URU_B64, 'ARG': FLAG_ARG_B64, 'BRA': FLAG_BRA_B64 };
  return M[apoc] ?? null;
};

const TEMAS: Record<string, { header: string; accent: string; light: string; badge: string }> = {
  clasificatorio:   { header: '#1a5c2a', accent: '#2d8a3e', light: '#edf7ef', badge: '#1a5c2a' },
  reduccion:        { header: '#1a5c2a', accent: '#388e3c', light: '#f1f8e9', badge: '#1a5c2a' },
  segunda:          { header: '#6B2737', accent: '#8a3447', light: '#fbeef1', badge: '#6B2737' },
  primera:          { header: '#014f86', accent: '#0277bd', light: '#e8f4fd', badge: '#014f86' },
  master:           { header: '#4a1070', accent: '#7b1fa2', light: '#f5eef8', badge: '#4a1070' },
  ranking:          { header: '#7c4d00', accent: '#b8860b', light: '#fffbf0', badge: '#7c4d00' },
  'ranking-final':  { header: '#1a3560', accent: '#1e40af', light: '#eff6ff', badge: '#1a3560' },
  acumulado:        { header: '#1a3a5c', accent: '#1565c0', light: '#e8f0fe', badge: '#1a3a5c' },
  'series-nacional':  { header: '#06182f', accent: '#f4c430', light: '#0a223f', badge: '#014f86' },
  'inicial-nacional': { header: '#06182f', accent: '#f4c430', light: '#0a223f', badge: '#014f86' },
  'bracket-nacional': { header: '#135c1a', accent: '#f5d020', light: '#fffde7', badge: '#135c1a' },
  'cruces-nacional':  { header: '#06182f', accent: '#f4c430', light: '#0a223f', badge: '#014f86' },
};

// Colores del bracket nacional por categoría federal
const COLORES_CATEGORIA: Record<string, { bg: string; bg2: string; accent: string; gold: string }> = {
  primera: { bg: '#014f86', bg2: '#0277bd', accent: '#4fc3f7', gold: '#f5d020' },
  segunda: { bg: '#6B2737', bg2: '#8a3447', accent: '#d98ca0', gold: '#D4AF37' },
  tercera: { bg: '#135c1a', bg2: '#1e8a28', accent: '#81c784', gold: '#f5d020' },
};
const getColoresCategoria = (cat?: string) => {
  const c = (cat ?? '').toLowerCase();
  return COLORES_CATEGORIA[c] ?? COLORES_CATEGORIA.tercera;
};

// Deriva la categoría REAL (para elegir paleta) desde el nombre de torneo + circuito,
// normalizando acentos. Master/Máxima/Primera → 'primera' (navy/gold), igual que el
// subtítulo dinámico del bracket. Se usa porque data.categoriaFederal del backend solo
// distingue primera/segunda/tercera y Máster/Máxima cae en 'primera' o 'tercera' por defecto.
const catPaletaFE = (data: any): 'primera' | 'segunda' | 'tercera' => {
  const norm = (s?: string | null) =>
    (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const t = `${norm(data?.torneo)} ${norm(data?.circuito)}`;
  if (/master|maxima|primera/.test(t)) return 'primera';
  if (/segunda/.test(t))              return 'segunda';
  if (/tercera/.test(t))              return 'tercera';
  const cf = (data?.categoriaFederal ?? '').toLowerCase();
  if (cf === 'segunda' || cf === 'tercera') return cf as 'segunda' | 'tercera';
  return 'primera';
};

const SECCION_COLORES: Record<string, { bg: string; badge: string; light: string }> = {
  'MÁSTER':  { bg: '#4a1070', badge: '#7b1fa2', light: '#f5eef8' },
  'PRIMERA': { bg: '#014f86', badge: '#0277bd', light: '#e8f4fd' },
  'SEGUNDA': { bg: '#6B2737', badge: '#8a3447', light: '#fbeef1' },
  'TERCERA': { bg: '#1a5c2a', badge: '#2d8a3e', light: '#edf7ef' },
};

const getCatColor = (categoria: string | null): { text: string; badge: string; light: string } => {
  const c = categoria?.toLowerCase();
  if (c === 'master')  return { text: '#4a1070', badge: '#4a1070', light: '#f5eef8' };
  if (c === 'primera') return { text: '#014f86', badge: '#014f86', light: '#e8f4fd' };
  if (c === 'segunda') return { text: '#6B2737', badge: '#6B2737', light: '#fbeef1' };
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
  { value: 'cruces-nacional',   label: '⚔️ Cruces Nacional' },
  { value: 'bracket-nacional',  label: '🏟 Bracket Nacional' },
];

const F = 'Arial, Helvetica, sans-serif';

const cargarHtmlToImage = (): Promise<any> =>
  new Promise((resolve, reject) => {
    if ((window as any).htmlToImage) { resolve((window as any).htmlToImage); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
    script.onload = () => resolve((window as any).htmlToImage);
    script.onerror = () => reject(new Error('No se pudo cargar html-to-image'));
    document.head.appendChild(script);
  });

// ── Componentes base ──────────────────────────────────────────────────
function PubHeader({ data, tema }: { data: any; tema: any }) {
  // En Panamericano, el subtítulo no debe repetir "TORNEO PANAMERICANO"
  // (ya figura arriba). Se reemplaza por "CATEGORÍA MÁXIMA".
  const catSubtitulo: string = (() => {
    const norm = (s?: string | null) =>
      (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const t = `${norm(data?.torneo)} ${norm(data?.circuito)}`;
    if (/master|maxima/.test(t)) return 'CATEGORÍA MÁXIMA';
    if (/femenin/.test(t))       return 'CATEGORÍA FEMENINO';
    if (/juvenil/.test(t))       return 'CATEGORÍA JUVENIL';
    if (/segunda/.test(t))       return 'CATEGORÍA SEGUNDA';
    if (/tercera/.test(t))       return 'CATEGORÍA TERCERA';
    if (/primera/.test(t))       return 'CATEGORÍA PRIMERA';
    return 'CATEGORÍA MÁXIMA';
  })();
  const faseMostrar: string = data.esPanamericano && typeof data.fase === 'string'
    ? data.fase.replace(/TORNEO\s+PANAMERICANO/gi, catSubtitulo)
    : data.fase;
  // Si es torneo nacional, usar paleta V2 premium
  if (data.categoriaFederal) {
    const CV2 = getCatV2(catPaletaFE(data));
    return (
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `
          radial-gradient(ellipse 160% 55% at 50% -10%, ${CV2.cyan}1a 0%, transparent 55%),
          radial-gradient(ellipse 120% 80% at 20% 60%, ${CV2.navy2}cc, transparent 55%),
          radial-gradient(ellipse 120% 80% at 80% 60%, ${CV2.petrol}88, transparent 55%),
          linear-gradient(180deg, ${CV2.petrol} 0%, ${CV2.navy} 40%, ${CV2.navyDeep} 100%)`,
        padding: '32px 48px 28px',
        display: 'flex', alignItems: 'center', gap: 36,
      }}>
        
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${CV2.cyan} 20%, ${CV2.goldBright} 50%, ${CV2.cyan} 80%, transparent)`,
          boxShadow: `0 0 18px ${CV2.cyan}77`,
        }} />
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',

        }} />
        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)',
        }} />
        {/* Logo halo */}
        <div style={{
          position: 'relative', width: 110, height: 110, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}>
          <div style={{
            position: 'absolute', inset: -14, borderRadius: '50%',
            background: `radial-gradient(circle, ${CV2.cyan}44, transparent 68%)`,
            filter: 'blur(4px)',
          }} />
          <div style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: `2px solid ${CV2.goldBright}88`,
            boxShadow: `0 0 10px ${CV2.goldDeep}88, inset 0 0 8px ${CV2.goldDeep}44`,
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `2px solid ${CV2.goldBright}55`,
            boxShadow: `inset 0 0 12px ${CV2.goldBright}22`,
            zIndex: 3,
          }} />
          <img src="/logo-febiu.png" alt="FEBIU" crossOrigin="anonymous" style={{
            width: 100, height: 100, borderRadius: '50%', objectFit: 'contain',
            position: 'relative', zIndex: 2,
            boxShadow: `0 6px 24px rgba(0,0,0,0.5)`,
          }} />
        </div>
        {/* Logo CPB (solo Panamericano) */}
        {data.esPanamericano && (
          <div style={{
            position: 'relative', width: 110, height: 110, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
          }}>
            <div style={{
              position: 'absolute', inset: -14, borderRadius: '50%',
              background: `radial-gradient(circle, ${CV2.cyan}44, transparent 68%)`,
              filter: 'blur(4px)',
            }} />
            <div style={{
              position: 'absolute', inset: -3, borderRadius: '50%',
              border: `2px solid ${CV2.goldBright}88`,
              boxShadow: `0 0 10px ${CV2.goldDeep}88, inset 0 0 8px ${CV2.goldDeep}44`,
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: `2px solid ${CV2.goldBright}55`,
              boxShadow: `inset 0 0 12px ${CV2.goldBright}22`,
              zIndex: 3,
            }} />
            <div style={{
              width: 100, height: 100, borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative', zIndex: 2, padding: 6,
              boxShadow: `0 6px 24px rgba(0,0,0,0.5)`,
            }}>
              <img src={`data:image/png;base64,${LOGO_CPB_B64}`} alt="CPB" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        )}
        {/* Texts */}
        <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif",
            letterSpacing: '0.55em', fontSize: 11, fontWeight: 600,
            color: CV2.cyanSoft, textIndent: '0.55em',
            marginBottom: 6, textTransform: 'uppercase', opacity: 0.85,
          }}>{data.esPanamericano ? `CONFEDERACIÓN PANAMERICANA DE BILLAR ${data.temporada}` : `FEBIU · TEMPORADA ${data.temporada}`}</div>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif",
            fontWeight: 900, fontSize: 44, lineHeight: 0.92,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: CV2.goldBright,
            textShadow: `0 0 40px ${CV2.goldDeep}88`,
          }}>{data.esPanamericano ? 'TORNEO PANAMERICANO' : data.torneo}</div>
          <div style={{
            fontFamily: "'Saira Condensed', sans-serif",
            fontWeight: 700, fontSize: 20, marginTop: 10,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.88)', textIndent: '0.28em',
          }}>{faseMostrar}</div>
          {data.fechaPrincipal && (
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 15, marginTop: 6, color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>{data.fechaPrincipal}</div>
          )}
          {data.formato && (
            <div style={{
              marginTop: 14, display: 'inline-block',
              background: `linear-gradient(135deg, ${CV2.goldBright}22, ${CV2.gold}18)`,
              border: `1px solid ${CV2.goldDeep}88`,
              borderRadius: 8, padding: '7px 22px',
              minWidth: 340, textAlign: 'center', boxSizing: 'border-box',
              fontFamily: "'Saira Condensed', sans-serif",
              fontSize: 13, fontWeight: 800, letterSpacing: '0.08em',
              color: CV2.goldBright,
              boxShadow: `0 0 16px ${CV2.goldDeep}44`,
              whiteSpace: 'nowrap',
            }}>PARTIDAS A {data.formato.toUpperCase()}</div>
          )}
        </div>
        {/* Bottom rule */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${CV2.goldDeep} 15%, ${CV2.goldBright} 50%, ${CV2.goldDeep} 85%, transparent)`,
          boxShadow: `0 0 12px ${CV2.goldDeep}66`,
        }} />
      </div>
    );
  }

  // Header departamental (original)
  return (
    <div style={{ background: tema.header, padding: '36px 50px 32px', display: 'flex', alignItems: 'center', gap: 36, fontFamily: F }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 6 }}>
        <img src="/logo-febiu.png" alt="FEBIU" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1.1 }}>{data.esPanamericano ? 'TORNEO PANAMERICANO' : data.torneo}</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: 2, opacity: 0.9 }}>{data.esPanamericano ? `CONFEDERACIÓN PANAMERICANA DE BILLAR ${data.temporada}` : `FEBIU · TEMPORADA ${data.temporada}`}</div>
        <div style={{ fontSize: 32, fontWeight: 900, marginTop: 16, letterSpacing: 4, textTransform: 'uppercase', lineHeight: 1.1 }}>{faseMostrar}</div>
        {data.fechaPrincipal && <div style={{ fontSize: 20, marginTop: 8, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>{data.fechaPrincipal}</div>}
        {data.formato && <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 24px', display: 'inline-block', fontSize: 20, fontWeight: 700, letterSpacing: 2, whiteSpace: 'nowrap' }}>PARTIDAS A {data.formato.toUpperCase()}</div>}
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

function PlantillaRankingNacional({ data }: { data: any }) {
  const jugadores: any[] = [...(data.jugadores ?? [])].sort((a, b) => a.posicion - b.posicion);
  const CV2 = getCatV2(catPaletaFE(data));
  const CLASIFICAN = 16;
  const mitad = Math.ceil(jugadores.length / 2);
  const col1 = jugadores.slice(0, mitad);
  const col2 = jugadores.slice(mitad);

  const Fila = ({ j, index }: { j: any; index: number }) => {
    const clasifica = j.posicion <= CLASIFICAN;
    const esTop3    = j.posicion <= 3;
    const medalColor = j.posicion === 1 ? '#ffd700' : null;
    return (
      <div style={{
        display:'flex', alignItems:'center', padding:'8px 14px', gap:10,
        background: clasifica
          ? (index%2===0 ? 'rgba(255,255,255,0.072)' : 'rgba(255,255,255,0.036)')
          : (index%2===0 ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.10)'),
        borderBottom:`1px solid rgba(255,255,255,${clasifica?'0.07':'0.03'})`,
        borderLeft: clasifica
          ? `3px solid ${esTop3 && medalColor ? medalColor : CV2.goldBright}`
          : '3px solid rgba(255,255,255,0.08)',
        position:'relative', overflow:'hidden',
      }}>
        {/* shimmer line for top3 */}
        {esTop3 && (
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:`linear-gradient(100deg,transparent 30%,${medalColor ?? CV2.goldBright}14 50%,transparent 70%)`,
          }} />
        )}
        {/* Posición badge */}
        <div style={{
          width:38, height:30, borderRadius:6, flexShrink:0,
          background: esTop3 && medalColor
            ? `linear-gradient(145deg, ${medalColor}, ${medalColor}99)`
            : clasifica
              ? `linear-gradient(145deg, ${CV2.goldBright}, ${CV2.goldDeep})`
              : 'rgba(255,255,255,0.07)',
          color: esTop3 ? '#1a1200' : clasifica ? CV2.navyDeep : 'rgba(255,255,255,0.4)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, fontWeight:900,
          fontFamily:"'Saira Condensed', sans-serif",
          boxShadow: clasifica ? `0 2px 10px ${CV2.goldDeep}55,inset 0 1px 0 rgba(255,255,255,0.35)` : 'none',
          letterSpacing:'0.02em', position:'relative', zIndex:1,
        }}>{j.posicion}</div>

        {/* Nombre */}
        <div style={{
          flex:1, fontSize:clasifica?17:15, fontWeight:clasifica?700:500,
          color: clasifica ? '#ffffff' : 'rgba(255,255,255,0.5)',
          wordBreak:'break-word', lineHeight:1.2,
          fontFamily:"'Rajdhani', sans-serif",
          letterSpacing:'0.01em', position:'relative', zIndex:1,
        }}>{j.nombre}</div>

        {/* País+bandera (panamericano) ó Club badge (nacional) */}
        {data.esPanamericano ? (
          <div style={{
            display:'flex', alignItems:'center', gap:5, flexShrink:0,
            background: clasifica ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)',
            color: clasifica ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
            padding:'2px 8px', borderRadius:4,
            border:`1px solid ${clasifica?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.07)'}`,
            position:'relative', zIndex:1,
          }}>
            {banderaPaisG(j.pais) && (
              <img src={`data:image/png;base64,${banderaPaisG(j.pais)}`} alt={apocPaisG(j.pais)}
                style={{ width:18, height:12, borderRadius:1, display:'block', flexShrink:0 }} />
            )}
            <span style={{ fontSize:11, fontWeight:800, fontFamily:"'Saira Condensed', sans-serif", letterSpacing:'0.08em' }}>{apocPaisG(j.pais)}</span>
          </div>
        ) : j.club ? (
          <div style={{
            background: clasifica ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)',
            color: clasifica ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
            padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:800,
            fontFamily:"'Saira Condensed', sans-serif",
            letterSpacing:'0.08em', flexShrink:0,
            border:`1px solid ${clasifica?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.07)'}`,
            position:'relative', zIndex:1,
          }}>{j.club}</div>
        ) : null}

        {/* Diferencia de sets (G - P) */}
        {(() => {
          const dif = j.difSets != null
            ? j.difSets
            : (j.setsGanados != null && j.setsPerdidos != null ? j.setsGanados - j.setsPerdidos : null);
          return (
            <div style={{
              width:44, fontSize:clasifica?15:13, fontWeight:700,
              color: dif == null
                ? 'rgba(255,255,255,0.25)'
                : (dif >= 0 ? 'rgba(150,230,170,0.9)' : 'rgba(255,160,160,0.85)'),
              textAlign:'right', flexShrink:0,
              fontFamily:"'Saira Condensed', sans-serif",
              position:'relative', zIndex:1,
            }}>{dif == null ? '—' : `${dif >= 0 ? '+' : ''}${dif}`}</div>
          );
        })()}

        {/* Promedio */}
        <div style={{
          width:50, fontSize:clasifica?15:13, fontWeight:700,
          color: clasifica ? 'rgba(120,220,255,0.9)' : 'rgba(120,220,255,0.25)',
          textAlign:'right', flexShrink:0,
          fontFamily:"'Saira Condensed', sans-serif",
          position:'relative', zIndex:1,
        }}>{j.promedio != null ? j.promedio : '—'}</div>

        {/* Puntos */}
        <div style={{
          width:44, fontSize:clasifica?18:14, fontWeight:900,
          color: clasifica ? CV2.goldBright : 'rgba(255,255,255,0.3)',
          textAlign:'right', flexShrink:0,
          fontFamily:"'Saira Condensed', sans-serif",
          letterSpacing:'0.02em', position:'relative', zIndex:1,
          textShadow: clasifica ? `0 0 16px ${CV2.goldDeep}88` : 'none',
        }}>{j.puntos}</div>
      </div>
    );
  };

  const ColHeader = () => (
    <div style={{
      display:'flex', alignItems:'center', padding:'7px 14px', gap:10,
      background:`linear-gradient(90deg, ${CV2.petrol}, ${CV2.navy2} 60%, ${CV2.navy})`,
      borderBottom:`2px solid ${CV2.goldDeep}`,
    }}>
      <span style={{width:38,fontSize:11,fontWeight:800,color:CV2.goldBright,textAlign:'center',fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.12em'}}>#</span>
      <span style={{flex:1,fontSize:11,fontWeight:800,color:CV2.goldBright,fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.12em'}}>JUGADOR</span>
      <span style={{fontSize:11,fontWeight:800,color:CV2.cyanSoft,fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.08em',marginRight:6}}>{data.esPanamericano ? 'PAÍS' : 'CLUB'}</span>
      <span style={{width:44,fontSize:11,fontWeight:800,color:CV2.goldBright,textAlign:'right',fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.10em'}}>DIF</span>
      <span style={{width:50,fontSize:11,fontWeight:800,color:CV2.cyanSoft,textAlign:'right',fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.08em'}}>PROM.</span>
      <span style={{width:44,fontSize:11,fontWeight:800,color:CV2.goldBright,textAlign:'right',fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.12em'}}>PTS</span>
    </div>
  );

  return (
    <div style={{
      padding:'24px 28px 32px',
      background:`
        radial-gradient(ellipse 160% 60% at 50% -5%, ${CV2.cyan}18 0%, transparent 55%),
        radial-gradient(ellipse 120% 80% at 20% 50%, ${CV2.navy2}cc, transparent 60%),
        radial-gradient(ellipse 120% 80% at 80% 50%, ${CV2.petrol}88, transparent 60%),
        linear-gradient(180deg, ${CV2.navy} 0%, ${CV2.navyDeep} 50%, #020d1a 100%)`,
      fontFamily:"'Rajdhani', sans-serif",
      position:'relative', overflow:'hidden',
    }}>
      



      {/* Top accent line */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:3, zIndex:2,
        background:`linear-gradient(90deg, transparent, ${CV2.cyan} 20%, ${CV2.goldBright} 50%, ${CV2.cyan} 80%, transparent)`,
        boxShadow:`0 0 20px ${CV2.cyan}88`,
      }} />

      {/* Clasificados banner */}
      <div style={{
        position:'relative', zIndex:2,
        display:'flex', alignItems:'center', gap:14, marginBottom:18,
        padding:'12px 18px',
        background:`linear-gradient(90deg, ${CV2.goldDeep}44, ${CV2.goldBright}18, transparent)`,
        border:`1px solid ${CV2.goldDeep}88`,
        borderRadius:10,
        boxShadow:`0 0 32px ${CV2.goldDeep}44, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}>
        <div style={{
          background:`linear-gradient(135deg, ${CV2.goldBright}, ${CV2.gold}, ${CV2.goldDeep})`,
          color:CV2.navyDeep, borderRadius:6, padding:'4px 12px',
          fontSize:13, fontWeight:900,
          fontFamily:"'Saira Condensed', sans-serif",
          letterSpacing:'0.06em',
          boxShadow:`0 3px 12px ${CV2.goldDeep}99, inset 0 1px 0 rgba(255,255,255,0.4)`,
        }}>1–{CLASIFICAN}</div>
        <span style={{
          fontSize:16, fontWeight:800, color:CV2.goldBright,
          fontFamily:"'Saira Condensed', sans-serif",
          letterSpacing:'0.20em', textTransform:'uppercase',
          textShadow:`0 0 20px ${CV2.goldDeep}88`,
        }}>CLASIFICAN A LA ETAPA DE CRUCES</span>
        <div style={{flex:1, height:1, background:`linear-gradient(90deg, ${CV2.goldDeep}66, transparent)`}} />
        <span style={{
          fontSize:11, color:CV2.cyanSoft, fontFamily:"'Saira Condensed', sans-serif",
          letterSpacing:'0.18em', opacity:0.7,
        }}>TOP {CLASIFICAN}</span>
      </div>

      {/* Tabla */}
      <div style={{
        position:'relative', zIndex:2,
        display:'flex', gap:12,
        border:`1px solid rgba(255,255,255,0.10)`,
        borderRadius:12, overflow:'hidden',
        boxShadow:`0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)`,
      }}>
        {[col1, col2].map((col, ci) => (
          <div key={ci} style={{flex:1, borderLeft:ci===1?`1px solid rgba(255,255,255,0.09)`:'none'}}>
            <ColHeader />
            {col.map((j:any, idx:number) => <Fila key={j.posicion} j={j} index={idx} />)}
            {ci===1 && col.length<col1.length && Array.from({length:col1.length-col.length}).map((_,i)=>(
              <div key={`e-${i}`} style={{height:47, background:'rgba(0,0,0,0.15)', borderBottom:'1px solid rgba(255,255,255,0.025)'}} />
            ))}
          </div>
        ))}
      </div>

      {/* ── BLOQUE CLASIFICADOS ── */}
      {(() => {
        const top16: any[] = data.top16 ?? [];
        if (top16.length === 0 || ocultarResultados) return null;
        const clasificados = top16;
        const mitad = Math.ceil(clasificados.length / 2);
        const col1 = clasificados.slice(0, mitad);
        const col2 = clasificados.slice(mitad);
        return (
          <div style={{position:'relative', zIndex:2, marginTop:20}}>
            {/* Header clasificados */}
            <div style={{
              display:'flex', alignItems:'center', gap:14, marginBottom:14, padding:'13px 20px',
              background:`linear-gradient(90deg, ${GOLDD}44, ${GOLDB}18, transparent)`,
              border:`1px solid ${GOLDD}88`, borderRadius:10,
              boxShadow:`0 0 32px ${GOLDD}33, inset 0 1px 0 rgba(255,255,255,0.07)`,
            }}>
              <span style={{fontSize:24}}>🏆</span>
              <div>
                <div style={{
                  fontFamily:"'Saira Condensed', sans-serif", fontWeight:900, fontSize:20,
                  color:GOLDB, letterSpacing:'0.18em', textTransform:'uppercase',
                  textShadow:`0 0 20px ${GOLDD}88`,
                }}>CLASIFICADOS A OCTAVOS DE FINAL</div>
                <div style={{
                  fontFamily:"'Rajdhani', sans-serif", fontSize:13, color:'rgba(255,255,255,0.5)',
                  letterSpacing:'0.08em', marginTop:1,
                }}>{clasificados.length} jugadores · Top 2 de cada serie</div>
              </div>
              <div style={{flex:1, height:1, background:`linear-gradient(90deg, ${GOLDD}55, transparent)`}} />
              <div style={{
                background:`linear-gradient(135deg, ${GOLDB}, ${GOLD}, ${GOLDD})`,
                color:INK, borderRadius:6, padding:'4px 14px',
                fontFamily:"'Saira Condensed', sans-serif", fontSize:18, fontWeight:900,
                boxShadow:`0 3px 12px ${GOLDD}88`,
              }}>{clasificados.length}</div>
            </div>
            {/* Tabla dos columnas */}
            <div style={{
              display:'flex', gap:10,
              border:`1px solid rgba(255,255,255,0.09)`, borderRadius:10, overflow:'hidden',
              boxShadow:`0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`,
            }}>
              {[col1, col2].map((col, ci) => (
                <div key={ci} style={{flex:1, borderLeft:ci===1?`1px solid rgba(255,255,255,0.07)`:'none'}}>
                  {/* col header */}
                  <div style={{
                    display:'flex', gap:8, padding:'7px 14px', alignItems:'center',
                    background:`linear-gradient(90deg, ${PETROL}ee, ${NAVY2}cc, ${NAVY}aa)`,
                    borderBottom:`2px solid ${GOLDD}`,
                  }}>
                    <span style={{width:28,fontSize:10,fontWeight:800,color:GOLDB,fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.1em'}}>S.</span>
                    <span style={{width:26,fontSize:10,fontWeight:800,color:GOLDB,fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.1em'}}>#</span>
                    <span style={{flex:1,fontSize:10,fontWeight:800,color:GOLDB,fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.1em'}}>JUGADOR</span>
                    <span style={{fontSize:10,fontWeight:800,color:CYANSOFT,fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.07em',marginRight:4}}>CLUB</span>
                  </div>
                  {col.map((c, idx) => (
                    <div key={idx} style={{
                      display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                      background: c.posicion<=8
                        ? (idx%2===0 ? `linear-gradient(90deg, ${GOLDB}13, transparent)` : `linear-gradient(90deg, ${GOLDB}0b, transparent)`)
                        : (idx%2===0 ? 'rgba(255,255,255,0.048)' : 'rgba(0,0,0,0.10)'),
                      borderBottom:`1px solid rgba(255,255,255,0.045)`,
                      borderLeft:c.posicion<=8?`3px solid ${GOLDB}`:`3px solid rgba(255,255,255,0.08)`,
                    }}>
                      {/* posicion badge */}
                      <div style={{
                        width:34, height:26, borderRadius:5, flexShrink:0,
                        background: `linear-gradient(135deg, ${GOLDB}, ${GOLDD})`,
                        color: INK,
                        fontSize:13, fontWeight:900,
                        fontFamily:"'Saira Condensed', sans-serif",
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow: `0 1px 8px ${GOLDD}88`,
                      }}>{c.posicion}</div>
                      {/* nombre */}
                      <div style={{
                        flex:1, fontSize:14, fontWeight: c.posicion<=8 ? 700 : 500,
                        color: c.posicion<=8 ? '#fff' : 'rgba(255,255,255,0.65)',
                        fontFamily:"'Rajdhani', sans-serif", letterSpacing:'0.01em',
                        wordBreak:'break-word', lineHeight:1.2,
                      }}>{c.nombre}</div>
                      {/* club */}
                      {c.club && (
                        <div style={{
                          background:'rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.7)',
                          padding:'1px 6px', borderRadius:3, fontSize:10, fontWeight:800, flexShrink:0,
                          fontFamily:"'Saira Condensed', sans-serif", letterSpacing:'0.07em',
                          border:'1px solid rgba(255,255,255,0.08)',
                        }}>{c.club}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Footer rule */}
      <div style={{position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:12, marginTop:16}}>
        <div style={{flex:1, height:1, background:`linear-gradient(90deg, transparent, ${CV2.cyanSoft}44, transparent)`}} />
        <div style={{flex:1, height:1, background:`linear-gradient(90deg, transparent, ${CV2.cyanSoft}44, transparent)`}} />
      </div>
    </div>
  );
}

function PlantillaRanking({ data, tema }: { data: any; tema: any }) {
  // Variante nacional (todo en color de la categoría, top 16 destacado)
  if (data.categoriaFederal) return <PlantillaRankingNacional data={data} />;

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
  const ocultarResultados = data.ocultarResultados ?? false;
  const series: any[] = data.series ?? [];
  const CV2 = data.categoriaFederal ? getCatV2(catPaletaFE(data)) : null;
  const NAVY   = CV2 ? CV2.navy     : tema.header;
  const NAVY2  = CV2 ? CV2.navy2    : tema.accent;
  const NAVYD  = CV2 ? CV2.navyDeep : '#06182f';
  const PETROL = CV2 ? CV2.petrol   : NAVY;
  const GOLD   = CV2 ? CV2.gold     : '#f5d020';
  const GOLDB  = CV2 ? CV2.goldBright : '#ffd95a';
  const GOLDD  = CV2 ? CV2.goldDeep   : '#c9962a';
  const CYAN   = CV2 ? CV2.cyan       : '#5fd4ff';
  const CYANSOFT = CV2 ? CV2.cyanSoft : '#8fe3ff';
  const INK    = CV2 ? CV2.ink        : '#0a1a2e';

  /* ── jugador row ── */
  const PAIS_APOCOPE_FE: Record<string, string> = {
    'Uruguay': 'URU', 'Argentina': 'ARG', 'Brasil': 'BRA', 'Brazil': 'BRA',
    'Paraguay': 'PAR', 'Chile': 'CHI', 'Bolivia': 'BOL', 'Peru': 'PER',
    'Perú': 'PER', 'Colombia': 'COL', 'Venezuela': 'VEN', 'Ecuador': 'ECU',
  };
  const apocPaisFE = (pais?: string | null): string =>
    pais ? (PAIS_APOCOPE_FE[pais] ?? pais.slice(0, 3).toUpperCase()) : 'URU';
  const FLAG_POR_APOC: Record<string, string> = {
    'URU': FLAG_URU_B64, 'ARG': FLAG_ARG_B64, 'BRA': FLAG_BRA_B64,
  };
  const banderaPaisFE = (pais?: string | null): string | null => {
    const apoc = apocPaisFE(pais);
    return FLAG_POR_APOC[apoc] ?? null;
  };
  const badgeJugador = (jugador: any): string | null => {
    if (data.esPanamericano) return apocPaisFE(jugador.pais);
    return jugador.club ?? null;
  };const mkRow = (jugador: any, isWinner: boolean) => (
    <div style={{
      display:'flex', alignItems:'center', padding:'9px 14px', gap:10,
      background: isWinner && !ocultarResultados
        ? `linear-gradient(90deg, ${GOLDB}15, ${GOLD}08, transparent)`
        : 'rgba(0,0,0,0.10)',
      borderLeft: isWinner && !ocultarResultados
        ? `3px solid ${GOLDB}`
        : `3px solid rgba(255,255,255,0.06)`,
      position:'relative', overflow:'hidden',
    }}>
      {isWinner && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:`linear-gradient(100deg, transparent 40%, ${GOLDB}0a 60%, transparent 80%)`,
        }} />
      )}
      {jugador.ranking !== null ? (
        <div style={{
          width:32, height:26, borderRadius:5, flexShrink:0,
          background: isWinner
            ? `linear-gradient(135deg, ${GOLDB}, ${GOLDD})`
            : 'rgba(255,255,255,0.09)',
          color: isWinner ? INK : 'rgba(255,255,255,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:12, fontWeight:900,
          fontFamily:"'Saira Condensed', sans-serif",
          boxShadow: isWinner ? `0 1px 8px ${GOLDD}88, inset 0 1px 0 rgba(255,255,255,0.4)` : 'none',
          position:'relative', zIndex:1,
        }}>{jugador.ranking}</div>
      ) : (
        <div style={{width:32,height:26,borderRadius:5,flexShrink:0,background:'rgba(255,255,255,0.04)'}} />
      )}
      <div style={{
        flex:1, fontSize:15, fontWeight: isWinner ? 700 : 500,
        color: isWinner ? '#ffffff' : 'rgba(255,255,255,0.58)',
        wordBreak:'break-word', lineHeight:1.2,
        fontFamily:"'Rajdhani', sans-serif",
        letterSpacing:'0.01em', position:'relative', zIndex:1,
      }}>
        {jugador.esSlot
          ? <span style={{color:'rgba(255,255,255,0.22)',fontStyle:'italic'}}>{jugador.nombre}</span>
          : jugador.nombre}
      </div>
      {badgeJugador(jugador) && !jugador.esSlot && (
        <div style={{
          display:'flex', alignItems:'center', gap:5, flexShrink:0,
          position:'relative', zIndex:1,
        }}>
          {data.esPanamericano && banderaPaisFE(jugador.pais) && (
            <img
              src={`data:image/png;base64,${banderaPaisFE(jugador.pais)}`}
              alt={apocPaisFE(jugador.pais)}
              crossOrigin="anonymous"
              style={{
                height:14, width:'auto', borderRadius:2, display:'block',
                boxShadow:'0 0 0 1px rgba(255,255,255,0.18)',
              }}
            />
          )}
          <div style={{
            background: isWinner ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.06)',
            color: isWinner ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.32)',
            padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:800,
            fontFamily:"'Saira Condensed', sans-serif", letterSpacing:'0.07em',
            border:`1px solid ${isWinner?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.07)'}`,
            whiteSpace:'nowrap',
          }}>{badgeJugador(jugador)}</div>
        </div>
      )}
    </div>
  );

  /* ── partido row ── */
  const PartidoRow = ({ p, label }: { p: any; label: string }) => {
    if (!p) return null;
    const parts = p.resultado ? p.resultado.split('-') : ['',''];
    const winA = !ocultarResultados && p.resultado && parseInt(parts[0])>parseInt(parts[1]);
    const winB = !ocultarResultados && p.resultado && parseInt(parts[1])>parseInt(parts[0]);
    return (
      <div style={{borderTop:'1px solid rgba(255,255,255,0.055)'}}>
        {/* partido header */}
        <div style={{
          background:`linear-gradient(90deg, ${PETROL}ee, ${NAVY2}cc, ${NAVY}aa)`,
          padding:'5px 14px',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          borderLeft:`3px solid ${CYAN}55`,
          gap:8,
        }}>
          <span style={{
            fontWeight:800, fontSize:10.5,
            fontFamily:"'Saira Condensed', sans-serif",
            letterSpacing:'0.16em', color:CYANSOFT, flexShrink:0,
            whiteSpace:'nowrap',
          }}>{label}</span>
          {(p.hora||p.sede) && (
            <span style={{
              fontSize:10, color:'rgba(255,255,255,0.45)',
              fontFamily:"'Rajdhani', sans-serif", letterSpacing:'0.04em',
              display:'flex', alignItems:'center', gap:5,
            }}>
              {p.hora && <><span style={{fontSize:11,opacity:0.7}}>⏱</span>{p.hora}</>}
              {p.hora && p.sede && <span style={{opacity:0.35}}>·</span>}
              {p.sede && <>{p.sede}</>}
            </span>
          )}
          {p.resultado && !ocultarResultados && (
            <span style={{
              fontWeight:900, fontSize:15,
              fontFamily:"'Saira Condensed', sans-serif",
              background:`linear-gradient(135deg, ${GOLDB}, ${GOLD}, ${GOLDD})`,
              color:INK, padding:'2px 12px', borderRadius:5, flexShrink:0,
              boxShadow:`0 2px 8px ${GOLDD}77, inset 0 1px 0 rgba(255,255,255,0.45)`,
              letterSpacing:'0.02em',
              whiteSpace:'nowrap', display:'inline-block',
              textAlign:'center', boxSizing:'border-box', minWidth:54,
            }}>{p.resultado}</span>
          )}
        </div>
        {mkRow(p.jugadorA, winA)}
        <div style={{height:1, background:'rgba(255,255,255,0.035)', marginLeft:14}} />
        {mkRow(p.jugadorB, winB)}
      </div>
    );
  };

  const pares: any[][] = [];
  for (let i=0; i<series.length; i+=2) pares.push([series[i], series[i+1]??null]);

  return (
    <div style={{
      padding:'20px 24px 28px',
      background:`
        radial-gradient(ellipse 160% 50% at 50% -5%, ${CYAN}14 0%, transparent 50%),
        radial-gradient(ellipse 100% 70% at 15% 60%, ${NAVY2}bb, transparent 55%),
        radial-gradient(ellipse 100% 70% at 85% 60%, ${PETROL}77, transparent 55%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVYD} 55%, #020d1a 100%)`,
      fontFamily:"'Rajdhani', sans-serif",
      position:'relative', overflow:'hidden',
    }}>
      

      {/* Top glow line */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:3, zIndex:2,
        background:`linear-gradient(90deg, transparent, ${CYAN} 20%, ${GOLDB} 50%, ${CYAN} 80%, transparent)`,
        boxShadow:`0 0 18px ${CYAN}77`,
      }} />



      {/* Series grid */}
      <div style={{position:'relative', zIndex:1}}>
        {pares.map((par, pi) => (
          <div key={pi} style={{display:'flex', gap:14, marginBottom:14}}>
            {par.map((s, si) => s ? (
              <div key={si} style={{
                flex:1,
                background:`linear-gradient(175deg, rgba(14,58,100,0.95) 0%, rgba(7,26,50,0.97) 100%)`,
                border:`1px solid rgba(95,212,255,0.18)`,
                borderRadius:12, overflow:'hidden',
                boxShadow:`0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
                position:'relative',
              }}>
                {/* Card top accent */}
                <div style={{
                  position:'absolute', top:0, left:0, right:0, height:2,
                  background:`linear-gradient(90deg, ${CYAN}66, ${GOLDB}99, ${CYAN}66)`,
                  zIndex:2,
                }} />

                {/* Serie header */}
                <div style={{
                  background:`linear-gradient(90deg, ${NAVY2}f0, ${PETROL}cc, ${NAVY}aa)`,
                  borderBottom:`1.5px solid ${GOLDD}88`,
                  padding:'11px 16px',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <span style={{
                      fontSize:16, fontWeight:900, letterSpacing:'0.04em',
                      fontFamily:"'Saira Condensed', sans-serif",
                      background:`linear-gradient(135deg, ${GOLDB}, ${GOLDD})`,
                      color: INK,
                      padding:'4px 28px 4px 18px', borderRadius:6,
                      boxShadow:`0 2px 10px ${GOLDD}66, inset 0 1px 0 rgba(255,255,255,0.4)`,
                      textTransform:'uppercase',
                      whiteSpace:'nowrap', display:'inline-block', lineHeight:1.3,
                      overflow:'visible',
                    }}>SERIE {s.numero}</span>
                  </div>
                  {s.completa && !ocultarResultados && (
                    <span style={{
                      background:`linear-gradient(135deg, ${GOLDD}44, ${GOLD}22)`,
                      border:`1.5px solid ${GOLDB}66`,
                      color:GOLDB, padding:'3px 14px', borderRadius:20,
                      fontSize:10, fontWeight:900,
                      fontFamily:"'Saira Condensed', sans-serif",
                      letterSpacing:'0.10em',
                      boxShadow:`0 0 12px ${GOLDD}44`,
                      whiteSpace:'nowrap', display:'inline-block',
                      textAlign:'center', boxSizing:'border-box',
                      minWidth:96, flexShrink:0, lineHeight:1.4, overflow:'visible',
                    }}>✓ COMPLETA</span>
                  )}
                </div>

                {/* Partidos */}
                <PartidoRow p={s.p1} label="PARTIDO 1" />
                <PartidoRow p={s.p2} label="PARTIDO 2" />

                {/* Clasificación final */}
                {s.completa && !ocultarResultados && (
                  <div style={{
                    borderTop:`1.5px solid ${GOLDD}55`,
                    padding:'10px 14px',
                    background:`linear-gradient(90deg, ${GOLD}0e, transparent 70%)`,
                  }}>
                    <div style={{
                      fontSize:10, fontWeight:900, color:GOLDB, marginBottom:8,
                      fontFamily:"'Saira Condensed', sans-serif",
                      letterSpacing:'0.22em', opacity:0.9,
                      display:'flex', alignItems:'center', gap:8,
                    }}>
                      <div style={{flex:0, width:24, height:1, background:`linear-gradient(90deg, transparent, ${GOLDB}55)`}} />
                      CLASIFICACIÓN FINAL
                      <div style={{flex:1, height:1, background:`linear-gradient(90deg, ${GOLDB}55, transparent)`}} />
                    </div>
                    {([
                      ['🥇','1°',s.primero,'#ffd700'],
                      ['🥈','2°',s.segundo,'#c0c8d8'],
                      ['🥉','3°',s.tercero,'#d4905a'],
                      ['·', '4°',s.cuarto, 'rgba(255,255,255,0.25)'],
                    ] as [string,string,any,string][]).map(([ico,lbl,jug,col]) =>
                      jug ? (
                        <div key={lbl} style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                          <span style={{fontSize:13,width:20,flexShrink:0}}>{ico}</span>
                          <span style={{
                            fontSize:11,fontWeight:900,color:col,width:22,
                            fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.04em',flexShrink:0,
                          }}>{lbl}</span>
                          <span style={{
                            flex:1,fontSize:13,fontWeight:600,
                            color:'rgba(255,255,255,0.85)',
                            fontFamily:"'Rajdhani', sans-serif",letterSpacing:'0.01em',
                          }}>{jug.nombre}</span>
                          {jug.ranking && (
                            <span style={{
                              background:'rgba(255,255,255,0.09)',color:CYANSOFT,
                              padding:'1px 7px',borderRadius:3,fontSize:10,fontWeight:800,
                              fontFamily:"'Saira Condensed', sans-serif",letterSpacing:'0.06em',flexShrink:0,
                            }}>#{jug.ranking}</span>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            ) : <div key={si} style={{flex:1}} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Plantilla Cruces Nacional ────────────────────────────────────────
function PlantillaCrucesNacional({ data }: { data: any }) {
  const CV2 = getCatV2(catPaletaFE(data));

  const octavos: any[] = data.octavos ?? [];
  const cuartos: any[] = data.cuartos ?? [];

  const PartidoCard = ({ p, rondaLabel }: { p: any; rondaLabel: string }) => {
    if (!p) return (
      <div style={{
        background:'rgba(0,0,0,0.18)', border:`1px solid rgba(255,255,255,0.06)`,
        borderRadius:10, padding:'14px 16px', opacity:0.4,
        fontFamily:"'Saira Condensed', sans-serif", color:'rgba(255,255,255,0.3)',
        fontSize:13, letterSpacing:'0.1em', textAlign:'center',
      }}>POR DEFINIR</div>
    );

    const jugA = p.jugadorA ?? { nombre: p.slotA ?? '?', club: null };
    const jugB = p.jugadorB ?? { nombre: p.slotB ?? '?', club: null };
    const winA = p.winA;
    const winB = p.winB;
    const jugado = !!p.resultado;

    const JugRow = ({ jug, isWinner }: { jug: any; isWinner: boolean }) => (
      <div style={{
        display:'flex', alignItems:'center', gap:9, padding:'9px 14px',
        background: isWinner
          ? `linear-gradient(90deg, ${CV2.goldBright}14, transparent)`
          : 'transparent',
        borderLeft: isWinner
          ? `3px solid ${CV2.goldBright}`
          : `3px solid rgba(255,255,255,0.06)`,
        position:'relative',
      }}>
        {isWinner && jugado && (
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:`linear-gradient(100deg,transparent 40%,${CV2.goldBright}08 60%,transparent 80%)`,
          }} />
        )}
        <div style={{
          flex:1, fontSize:15, fontWeight: isWinner ? 700 : 500,
          color: isWinner ? '#ffffff' : 'rgba(255,255,255,0.52)',
          fontFamily:"'Rajdhani', sans-serif", letterSpacing:'0.01em',
          wordBreak:'break-word', lineHeight:1.2, position:'relative', zIndex:1,
        }}>{jug.nombre}</div>
        {jug.pais && (
          <div style={{
            display:'flex', alignItems:'center', gap:5, flexShrink:0,
            position:'relative', zIndex:1,
          }}>
            {banderaPaisG(jug.pais) && (
              <img
                src={`data:image/png;base64,${banderaPaisG(jug.pais)}`}
                alt={apocPaisG(jug.pais)}
                style={{ width:22, height:14, objectFit:'cover', borderRadius:2, display:'block' }}
              />
            )}
            <span style={{
              background: isWinner ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.06)',
              color: isWinner ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
              padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:800,
              fontFamily:"'Saira Condensed', sans-serif", letterSpacing:'0.07em',
              border:`1px solid ${isWinner?'rgba(255,255,255,0.20)':'rgba(255,255,255,0.06)'}`,
            }}>{apocPaisG(jug.pais)}</span>
          </div>
        )}
        {jugado && (
          <div style={{
            width:22, height:22, borderRadius:4, flexShrink:0,
            background: isWinner
              ? `linear-gradient(135deg, ${CV2.goldBright}, ${CV2.goldDeep})`
              : 'rgba(255,255,255,0.06)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, position:'relative', zIndex:1,
          }}>{isWinner ? '✓' : '✗'}</div>
        )}
      </div>
    );

    return (
      <div style={{
        background:`linear-gradient(175deg, rgba(14,58,100,0.95), rgba(7,26,50,0.97))`,
        border:`1px solid rgba(95,212,255,0.15)`,
        borderRadius:10, overflow:'hidden',
        boxShadow:`0 6px 24px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.04)`,
        position:'relative',
      }}>
        {/* top accent */}
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${CV2.cyan}55,${CV2.goldBright}88,${CV2.cyan}55)`}} />
        {/* header */}
        <div style={{
          background:`linear-gradient(90deg,${CV2.navy2}f0,${CV2.petrol}cc,${CV2.navy}aa)`,
          borderBottom:`1.5px solid ${CV2.goldDeep}77`,
          padding:'8px 14px',
          display:'flex', justifyContent:'center', alignItems:'center', gap:8,
        }}>
          <span style={{
            fontFamily:"'Saira Condensed', sans-serif", fontWeight:800, fontSize:12,
            color:CV2.cyanSoft, letterSpacing:'0.16em', textTransform:'uppercase', textAlign:'center',
            whiteSpace:'nowrap',
          }}>{rondaLabel}</span>
        </div>
        <JugRow jug={jugA} isWinner={winA} />
        <div style={{height:1,background:'rgba(255,255,255,0.04)',marginLeft:14}} />
        <JugRow jug={jugB} isWinner={winB} />
      </div>
    );
  };

  const RondaHeader = ({ label, n }: { label: string; n: number }) => (
    <div style={{
      display:'flex', alignItems:'center', gap:12, marginBottom:12, marginTop:20,
    }}>
      <div style={{
        background:`linear-gradient(135deg,${CV2.goldBright},${CV2.goldDeep})`,
        color:CV2.ink, borderRadius:6, padding:'4px 14px',
        fontFamily:"'Saira Condensed', sans-serif", fontSize:15, fontWeight:900,
        letterSpacing:'0.08em', boxShadow:`0 2px 10px ${CV2.goldDeep}88`,
      }}>{n}</div>
      <span style={{
        fontFamily:"'Saira Condensed', sans-serif", fontWeight:900, fontSize:16,
        color:CV2.goldBright, letterSpacing:'0.10em', textTransform:'uppercase',
        textShadow:`0 0 20px ${CV2.goldDeep}66`, whiteSpace:'nowrap',
      }}>{label}</span>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg,${CV2.goldDeep}55,transparent)`}} />
    </div>
  );

  return (
    <div style={{
      padding:'20px 24px 32px',
      background:`
        radial-gradient(ellipse 160% 50% at 50% -5%, ${CV2.cyan}14 0%, transparent 50%),
        radial-gradient(ellipse 100% 70% at 15% 60%, ${CV2.navy2}bb, transparent 55%),
        radial-gradient(ellipse 100% 70% at 85% 60%, ${CV2.petrol}77, transparent 55%),
        linear-gradient(180deg, ${CV2.navy} 0%, ${CV2.navyDeep} 55%, #020d1a 100%)`,
      fontFamily:"'Rajdhani', sans-serif", position:'relative', overflow:'hidden',
    }}>
      
      {/* Top glow */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:3,zIndex:2,background:`linear-gradient(90deg,transparent,${CV2.cyan} 20%,${CV2.goldBright} 50%,${CV2.cyan} 80%,transparent)`,boxShadow:`0 0 18px ${CV2.cyan}77`}} />


      <div style={{position:'relative',zIndex:1}}>
        {/* Bracket de 16 muestra octavos; el de 8 (panamericano) arranca en cuartos */}
        {data.tamano !== 8 && (
          <>
            <RondaHeader label="OCTAVOS DE FINAL" n={8} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {octavos.map((p,i) => <PartidoCard key={`oct${i}`} p={p} rondaLabel={`OCT · PARTIDO ${i+1}`} />)}
            </div>
          </>
        )}

        {/* CUARTOS */}
        {cuartos.some((p:any) => p) && (
          <>
            <RondaHeader label="CUARTOS DE FINAL" n={4} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {cuartos.map((p,i) => <PartidoCard key={`cua${i}`} p={p} rondaLabel={`PARTIDO ${i+1}`} />)}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginTop:20}}>
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${CV2.cyanSoft}44,transparent)`}} />
          <div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${CV2.cyanSoft}44,transparent)`}} />
        </div>
      </div>
    </div>
  );
}

// ── Plantilla Bracket Nacional ────────────────────────────────────────
type HorasBracket = { oct: string[]; cua: string[]; sem: string[]; fin: string };

// ── Plantilla Bracket Nacional (diseño HTML importado) ─────────────────
const LOGO_FEBIU_B64 = "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";
const LOGO_CPB_B64 = "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";
const FLAG_URU_B64 = "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";
const FLAG_ARG_B64 = "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";
const FLAG_BRA_B64 = "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";

const COLORES_CATEGORIA_V2: Record<string, {
  navyDeep:string; navy:string; navy2:string; petrol:string;
  gold:string; goldBright:string; goldDeep:string;
  cyan:string; cyanSoft:string; ink:string;
}> = {
  primera: {
    navyDeep:'#06182f', navy:'#0a223f', navy2:'#0d2c52', petrol:'#0e3a5c',
    gold:'#f4c430', goldBright:'#ffd95a', goldDeep:'#c9962a',
    cyan:'#5fd4ff', cyanSoft:'#8fe3ff', ink:'#0a1a2e',
  },
  segunda: {
    navyDeep:'#2a0e16', navy:'#4a1626', navy2:'#6B2737', petrol:'#8a3447',
    gold:'#D4AF37', goldBright:'#e8c75a', goldDeep:'#b08d22',
    cyan:'#e09aac', cyanSoft:'#eab9c6', ink:'#1f0a10',
  },
  tercera: {
    navyDeep:'#061a0e', navy:'#0a2f1a', navy2:'#0d3d22', petrol:'#0e5c30',
    gold:'#f4c430', goldBright:'#ffd95a', goldDeep:'#c9962a',
    cyan:'#5fffa0', cyanSoft:'#8fffc0', ink:'#0a1a12',
  },
};
const getCatV2 = (cat?: string) =>
  COLORES_CATEGORIA_V2[(cat ?? '').toLowerCase()] ?? COLORES_CATEGORIA_V2.primera;

function PlantillaBracketNacional({ data, sala, fechaBracket, horas }:
  { data: any; sala: string; fechaBracket: string; horas: HorasBracket }) {
  const bracketRef = (window as any).__bracketRef ?? null;
  const stageRef = React.useRef<HTMLDivElement>(null);
  const svgRef   = React.useRef<SVGSVGElement>(null);

  const oct  = data.octavos ?? Array(8).fill(null);
  const cua  = data.cuartos ?? Array(4).fill(null);
  const sem  = data.semis   ?? Array(2).fill(null);
  const fin  = data.final;
  const camp = data.campeon;
  const C    = getCatV2(catPaletaFE(data));
  const es8  = data.tamano === 8; // ← bracket arranca en cuartos (8 jugadores)

  // Subtítulo dinámico del header: "Bracket Final · Categoría X".
  // Detectamos la categoría desde data.torneo y/o data.circuito (nombre del circuito),
  // normalizando para quitar acentos y así matchear máster/máxima/maxima/master indistintamente.
  const subtituloBracket: string = (() => {
    const norm = (s?: string | null) =>
      (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const t = `${norm(data.torneo)} ${norm(data.circuito)}`;
    let cat = '';
    if (/master|maxima/.test(t))   cat = 'Categoría Máxima';
    else if (/femenin/.test(t))    cat = 'Categoría Femenino';
    else if (/juvenil/.test(t))    cat = 'Categoría Juvenil';
    else if (/segunda/.test(t))    cat = 'Categoría Segunda';
    else if (/tercera/.test(t))    cat = 'Categoría Tercera';
    else if (/primera/.test(t))    cat = 'Categoría Primera';
    return cat ? `Bracket Final · ${cat}` : 'Bracket Final';
  })();

  const getName = (m: any, side: 'A' | 'B'): string => {
    if (!m) return '';
    const p = side === 'A' ? m.playerA : m.playerB;
    if (p?.nombre) return p.nombre;
    const slot = side === 'A' ? m.slotA : m.slotB;
    if (slot) { const x = slot.match(/#(\d+)/); return x ? `#${x[1]}` : slot; }
    return '';
  };
  const isWin = (m: any, side: 'A' | 'B'): boolean => {
    if (!m?.winnerId) return false;
    return m.winnerId === (side === 'A' ? m.playerAId : m.playerBId);
  };

  // Draw wires after render
  React.useEffect(() => {
    const stage = stageRef.current;
    const svg   = svgRef.current;
    if (!stage || !svg) return;
    const sr = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
    svg.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${C.cyan}" stop-opacity="0.9"/>
        <stop offset="1" stop-color="${C.cyanSoft}" stop-opacity="0.6"/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    svg.appendChild(defs);

    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left-sr.left, y: r.top-sr.top, w: r.width, h: r.height, cy: r.top-sr.top+r.height/2 };
    };
    const wire = (ax:number,ay:number,bx:number,by:number,px:number,py:number, dir:'ltr'|'rtl') => {
      const midX = dir==='ltr' ? (ax+px)/2 : (bx+px)/2;
      const d = `M ${ax} ${ay} H ${midX} V ${py} H ${px} M ${bx} ${by} H ${midX}`;
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d',d); p.setAttribute('fill','none');
      p.setAttribute('stroke','url(#wg)'); p.setAttribute('stroke-width','2');
      p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round');
      p.setAttribute('filter','url(#glow)'); p.setAttribute('opacity','0.85');
      svg.appendChild(p);
    };
    const singleWire = (fromX:number,fromY:number,toX:number,toY:number) => {
      const midX = (fromX+toX)/2;
      const d = `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`;
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d',d); p.setAttribute('fill','none');
      p.setAttribute('stroke','url(#wg)'); p.setAttribute('stroke-width','2');
      p.setAttribute('filter','url(#glow)'); p.setAttribute('stroke-linejoin','round');
      p.setAttribute('opacity','0.9');
      svg.appendChild(p);
    };

    const colBy = (k: string) => stage.querySelector(`.bk-col[data-bk="${k}"]`);
    const cLcua = colBy('Lcua'), cLsem = colBy('Lsem'), cFin = colBy('center');
    const cRsem = colBy('Rsem'), cRcua = colBy('Rcua');
    if (!cLcua || !cLsem || !cFin || !cRsem || !cRcua) return;
    const cLoct = colBy('Loct'), cRoct = colBy('Roct');
    const Loct = cLoct ? cLoct.querySelectorAll('.bk-match') : [];
    const Lcua = cLcua.querySelectorAll('.bk-match');
    const Lsem = cLsem.querySelectorAll('.bk-match');
    const finCard = cFin.querySelector('.bk-final-card');
    const Rsem = cRsem.querySelectorAll('.bk-match');
    const Rcua = cRcua.querySelectorAll('.bk-match');
    const Roct = cRoct ? cRoct.querySelectorAll('.bk-match') : [];

    if (Loct.length>=2 && Lcua.length>=1) {
      const a=rect(Loct[0]),b=rect(Loct[1]),t=rect(Lcua[0]);
      wire(a.x+a.w,a.cy,b.x+b.w,b.cy,t.x,t.cy,'ltr');
    }
    if (Loct.length>=4 && Lcua.length>=2) {
      const a=rect(Loct[2]),b=rect(Loct[3]),t=rect(Lcua[1]);
      wire(a.x+a.w,a.cy,b.x+b.w,b.cy,t.x,t.cy,'ltr');
    }
    if (Lcua.length>=2 && Lsem.length>=1) {
      const a=rect(Lcua[0]),b=rect(Lcua[1]),t=rect(Lsem[0]);
      wire(a.x+a.w,a.cy,b.x+b.w,b.cy,t.x,t.cy,'ltr');
    }
    if (Lsem.length>=1 && finCard) {
      const s=rect(Lsem[0]),f=rect(finCard);
      singleWire(s.x+s.w,s.cy,f.x,f.cy);
    }
    if (Roct.length>=2 && Rcua.length>=1) {
      const a=rect(Roct[0]),b=rect(Roct[1]),t=rect(Rcua[0]);
      wire(a.x,a.cy,b.x,b.cy,t.x+t.w,t.cy,'rtl');
    }
    if (Roct.length>=4 && Rcua.length>=2) {
      const a=rect(Roct[2]),b=rect(Roct[3]),t=rect(Rcua[1]);
      wire(a.x,a.cy,b.x,b.cy,t.x+t.w,t.cy,'rtl');
    }
    if (Rcua.length>=2 && Rsem.length>=1) {
      const a=rect(Rcua[0]),b=rect(Rcua[1]),t=rect(Rsem[0]);
      wire(a.x,a.cy,b.x,b.cy,t.x+t.w,t.cy,'rtl');
    }
    if (Rsem.length>=1 && finCard) {
      const s=rect(Rsem[0]),f=rect(finCard);
      singleWire(s.x,s.cy,f.x+f.w,f.cy);
    }
  });

  const cssVars = {
    '--navy-deep': C.navyDeep,
    '--navy': C.navy,
    '--navy-2': C.navy2,
    '--petrol': C.petrol,
    '--gold': C.gold,
    '--gold-bright': C.goldBright,
    '--gold-deep': C.goldDeep,
    '--cyan': C.cyan,
    '--cyan-soft': C.cyanSoft,
    '--ink': C.ink,
    '--white': '#ffffff',
    '--glass': 'rgba(255,255,255,0.94)',
  } as React.CSSProperties;

  const clockSvg = `<svg class="clock" viewBox="0 0 24 24" fill="none" stroke="${C.ink}" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
  const clockSvgLight = `<svg class="clock" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2.2" style="width:14px;height:14px"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;

  const getPais = (m: any, side: 'A' | 'B'): string | null => {
    if (!m) return null;
    const p = side === 'A' ? m.playerA : m.playerB;
    return p?.pais ?? null;
  };

  const Seat = ({ m, side, isPlaceholder }: { m: any; side: 'A'|'B'; isPlaceholder?: boolean }) => {
    const name = getName(m, side);
    const win  = isWin(m, side);
    const empty = !name;
    const pais  = getPais(m, side);
    const flag  = data.esPanamericano && !empty ? banderaPaisG(pais) : null;
    return (
      <div className={`bk-seat${isPlaceholder||empty ? ' bk-placeholder' : ''}${win ? ' bk-winner' : ''}`}>
        <span className="dot"></span>
        {flag && (
          <img className="bk-flag" src={`data:image/png;base64,${flag}`} alt={apocPaisG(pais)} />
        )}
        <span className="nm">{name || (isPlaceholder ? (side==='A'?m?.slotA:m?.slotB)||'—' : '—')}</span>
      </div>
    );
  };

  const RoundHead = ({ label, hora, right }: { label:string; hora:string; right?:boolean }) => (
    <div className={`bk-round-head${right?' bk-right':''}`}>
      <span className="rname">{label}</span>
      <span className="rtime">
        <svg className="clock" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.4}>
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
        </svg>
        {hora && hora.trim() ? hora : 'Hora: ___'}
      </span>
    </div>
  );

  const OctGroup = ({ m, hora, right, placeholder }: { m:any; hora:string; right?:boolean; placeholder?:boolean }) => (
    <div className="bk-group">
      <RoundHead label="Octavos" hora={hora} right={right} />
      <div className="bk-match">
        <Seat m={m} side="A" isPlaceholder={placeholder} />
        <Seat m={m} side="B" isPlaceholder={placeholder} />
      </div>
    </div>
  );

  const StageGroup = ({ m, label, hora, right, placeholder }: { m:any; label:string; hora:string; right?:boolean; placeholder?:boolean }) => (
    <div className="bk-group">
      <RoundHead label={label} hora={hora} right={right} />
      <div className="bk-match">
        <Seat m={m} side="A" isPlaceholder={placeholder} />
        <Seat m={m} side="B" isPlaceholder={placeholder} />
      </div>
    </div>
  );

  return (
    <div className="bk-stage" ref={stageRef} style={{ ...cssVars, width: '100%', maxWidth: 1440, margin: '0 auto', fontFamily: "'Rajdhani', sans-serif" } as React.CSSProperties}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Saira+Condensed:wght@600;700;800&family=Oswald:wght@500;600;700&display=swap');
        .bk-stage{position:relative;padding:20px 28px 22px;background:radial-gradient(120% 90% at 50% 8%,rgba(95,212,255,.10),rgba(95,212,255,0) 55%),radial-gradient(150% 120% at 50% 42%,${C.navy2} 0%,${C.navy} 38%,${C.navyDeep} 70%,#03101f 100%);overflow:hidden;color:#fff;-webkit-font-smoothing:antialiased;}
        .bk-stage::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);background-size:32px 32px;mask-image:radial-gradient(80% 70% at 50% 45%,#000 30%,transparent 85%);pointer-events:none;}
        .bk-stage::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 50%,transparent 55%,rgba(0,0,0,.55) 100%);pointer-events:none;}
        .bk-header{position:relative;z-index:5;margin-bottom:18px;max-width:1180px;margin-left:auto;margin-right:auto;}
        .bk-header-bar{position:relative;display:grid;grid-template-columns:200px 1fr 200px;align-items:center;gap:16px;padding:12px 18px 14px;}
        .bk-title-wrap{flex:1;text-align:center;}
        .bk-headlogos{display:flex;align-items:center;justify-content:center;gap:22px;}
        .bk-headtext{text-align:center;}
        .bk-hl{width:78px;height:78px;border-radius:50%;background:rgba(255,255,255,0.96);padding:5px;flex:none;box-shadow:0 6px 20px rgba(0,0,0,.45),0 0 18px rgba(95,212,255,.25);border:1.5px solid rgba(244,196,48,.5);object-fit:contain;}
        .bk-kicker{font-family:'Saira Condensed',sans-serif;letter-spacing:.30em;font-size:12px;font-weight:700;color:${C.cyanSoft};text-indent:.30em;margin-bottom:5px;text-transform:uppercase;opacity:.9;}
        .bk-h1{font-family:'Saira Condensed',sans-serif;font-weight:800;font-size:46px;line-height:.9;letter-spacing:.04em;text-transform:uppercase;color:${C.gold};}
        .bk-subtitle{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.35em;font-size:12px;color:rgba(255,255,255,.78);margin-top:8px;text-indent:.35em;text-transform:uppercase;}
        .bk-gold-rule{height:2px;width:100%;margin-top:12px;background:linear-gradient(90deg,transparent,${C.goldDeep} 12%,${C.goldBright} 50%,${C.goldDeep} 88%,transparent);box-shadow:0 0 12px rgba(244,196,48,.5);border-radius:2px;}
        .bk-meta-chip{width:200px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);border-radius:12px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.35);}
        .bk-meta-chip .lab{font-family:'Saira Condensed',sans-serif;letter-spacing:.34em;font-weight:700;font-size:11px;color:${C.goldBright};text-transform:uppercase;}
        .bk-meta-chip .val{margin-top:6px;height:20px;border-bottom:2px dashed rgba(255,255,255,.32);font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#fff;}
        .bk-meta-chip.right{text-align:right;}
        .bk-bracket{position:relative;z-index:4;display:grid;grid-template-columns:1.4fr 0.4fr 1fr 0.4fr 0.9fr 1.2fr 0.9fr 0.4fr 1fr 0.4fr 1.4fr;align-items:stretch;column-gap:0;row-gap:0;min-height:300px;max-width:1180px;margin-left:auto;margin-right:auto;}
        .bk-col{display:flex;flex-direction:column;justify-content:center;gap:14px;padding:0 8px;}
        .bk-col.bk-rail{padding:0;}
        .bk-round-head{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;padding:5px 10px 5px 9px;border-radius:8px;background:linear-gradient(160deg,${C.goldBright},${C.gold} 55%,${C.goldDeep});box-shadow:0 4px 12px rgba(201,150,42,.45),inset 0 1px 0 rgba(255,255,255,.55);margin-bottom:-8px;position:relative;z-index:3;}
        .bk-round-head .rname{font-family:'Saira Condensed',sans-serif;font-weight:800;letter-spacing:.1em;font-size:12px;color:${C.ink};text-transform:uppercase;line-height:1;}
        .bk-round-head .rtime{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:10px;color:#3a2c08;letter-spacing:.04em;display:flex;align-items:center;gap:3px;border-left:1px solid rgba(58,44,8,.3);padding-left:6px;}
        .bk-round-head.bk-right{align-self:flex-end;flex-direction:row-reverse;}
        .bk-round-head.bk-right .rtime{border-left:none;border-right:1px solid rgba(58,44,8,.3);padding-left:0;padding-right:6px;flex-direction:row-reverse;}
        .clock{width:10px;height:10px;flex:none;}
        .bk-match{position:relative;background:linear-gradient(165deg,rgba(11,38,68,0.96),rgba(7,26,50,0.96));border:1px solid rgba(95,212,255,0.22);border-radius:11px;padding:7px;box-shadow:0 8px 20px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.06);display:flex;flex-direction:column;gap:5px;}
        .bk-match::before{content:"";position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:3px;background:linear-gradient(180deg,${C.cyan},${C.goldBright});box-shadow:0 0 8px rgba(95,212,255,.55);}
        .bk-seat{display:flex;align-items:center;gap:8px;background:linear-gradient(180deg,rgba(255,255,255,0.97),rgba(238,245,252,0.93));border:1px solid rgba(255,255,255,0.6);border-radius:8px;padding:8px 10px 8px 9px;box-shadow:0 2px 7px rgba(0,0,0,.18);min-height:36px;}
        .bk-seat .dot{width:6px;height:18px;border-radius:2px;flex:none;background:linear-gradient(180deg,${C.navy2},${C.petrol});box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
        .bk-seat .bk-flag{width:20px;height:14px;flex:none;border-radius:2px;object-fit:cover;display:inline-block;box-shadow:0 0 0 1px rgba(0,0,0,.18),0 1px 2px rgba(0,0,0,.25);vertical-align:middle;}
        .bk-champ-name .bk-flag-champ{width:22px;height:15px;border-radius:2px;margin-right:8px;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 1px 3px rgba(0,0,0,.35);vertical-align:middle;}
        .bk-seat.bk-placeholder{background:linear-gradient(180deg,rgba(20,52,90,0.55),rgba(13,38,70,0.5));border:1px dashed rgba(143,227,255,0.35);box-shadow:none;}
        .bk-seat.bk-placeholder .dot{background:linear-gradient(180deg,${C.gold},${C.goldDeep});}
        .bk-seat .nm{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:.01em;color:${C.ink};line-height:1.1;flex:1;min-width:0;white-space:normal;word-break:break-word;}
        .bk-seat.bk-placeholder .nm{color:rgba(220,238,255,0.82);font-weight:600;font-size:12px;font-style:italic;letter-spacing:.02em;}
        .bk-seat.bk-winner .nm{font-weight:800;color:${C.navyDeep};}
        .bk-group{display:flex;flex-direction:column;}
        .bk-center{display:flex;flex-direction:column;align-items:center;gap:18px;padding:0 4px;}
        .bk-logo-halo{position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:2px;}
        .bk-logo-halo::before{content:"";position:absolute;inset:-18px;border-radius:50%;background:radial-gradient(circle,rgba(95,212,255,.30),rgba(95,212,255,0) 68%);filter:blur(3px);}
        .bk-logo-halo::after{content:"";position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(from 0deg,${C.goldBright},${C.cyan},${C.goldBright},${C.cyan},${C.goldBright});opacity:.6;filter:blur(1px);-webkit-mask:radial-gradient(circle,transparent 56px,#000 57px);mask:radial-gradient(circle,transparent 56px,#000 57px);}
        .bk-logo-halo img{width:110px;height:110px;border-radius:50%;position:relative;z-index:2;box-shadow:0 8px 28px rgba(0,0,0,.5);}
        .bk-logo-halo .ring{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(244,196,48,.55);z-index:3;box-shadow:inset 0 0 14px rgba(244,196,48,.25);}
        .bk-final-block{width:100%;display:flex;flex-direction:column;align-items:center;}
        .bk-final-label{font-family:'Saira Condensed',sans-serif;font-weight:800;letter-spacing:.4em;font-size:22px;text-indent:.4em;color:${C.goldBright};margin-bottom:8px;}
        .bk-final-card{width:100%;position:relative;background:linear-gradient(165deg,rgba(20,58,98,0.98),rgba(8,28,54,0.98));border:1.5px solid rgba(244,196,48,0.55);border-radius:14px;padding:10px;box-shadow:0 0 0 1px rgba(95,212,255,.12),0 16px 36px rgba(0,0,0,.55),0 0 28px rgba(244,196,48,.18);}
        .bk-final-head{display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 0 10px;}
        .bk-final-head .ft{font-family:'Saira Condensed',sans-serif;font-weight:800;letter-spacing:.12em;font-size:14px;color:${C.goldBright};text-transform:uppercase;}
        .bk-final-head .fh{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:11px;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:4px;border-left:1px solid rgba(255,255,255,.2);padding-left:8px;}
        .bk-final-card .bk-seat{padding:10px;min-height:40px;}
        .bk-final-card .bk-seat .nm{font-size:14px;}
        .bk-final-card .bk-seat.bk-placeholder .nm{font-size:12.5px;}
        .bk-champ{width:100%;display:flex;flex-direction:column;align-items:center;margin-top:4px;}
        .bk-trophy{font-size:28px;filter:drop-shadow(0 3px 10px rgba(244,196,48,.6));margin-bottom:2px;animation:floaty 3.6s ease-in-out infinite;}
        @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        .bk-champ-label{font-family:'Saira Condensed',sans-serif;font-weight:800;letter-spacing:.34em;font-size:18px;text-indent:.34em;color:${C.goldBright};margin:3px 0 8px;}
        .bk-champ-card{width:100%;height:52px;position:relative;border-radius:12px;background:linear-gradient(135deg,rgba(244,196,48,.16),rgba(95,212,255,.08)),linear-gradient(165deg,rgba(20,58,98,0.95),rgba(8,28,54,0.95));border:1.5px solid transparent;background-clip:padding-box;box-shadow:0 12px 32px rgba(0,0,0,.5),0 0 24px rgba(244,196,48,.2),inset 0 1px 0 rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;overflow:hidden;}
        .bk-champ-card::before{content:"";position:absolute;inset:0;border-radius:12px;padding:1.5px;background:linear-gradient(135deg,${C.goldBright},${C.cyan},${C.goldDeep});-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;}
        .bk-champ-card .shine{position:absolute;top:0;left:-60%;width:50%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.22),transparent);transform:skewX(-18deg);animation:shine 5s ease-in-out infinite;}
        @keyframes shine{0%{left:-60%}55%{left:130%}100%{left:130%}}
        .bk-champ-name{font-family:'Saira Condensed',sans-serif;font-weight:800;font-size:15px;color:${C.goldBright};letter-spacing:.06em;z-index:1;display:inline-flex;align-items:center;}
        .bk-foot{position:relative;z-index:4;text-align:center;margin-top:20px;font-family:'Saira Condensed',sans-serif;letter-spacing:.5em;font-size:11px;color:rgba(143,227,255,.5);text-indent:.5em;}
        #bk-wires{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;}
      `}</style>

      {/* HEADER */}
      <header className="bk-header">
        <div className="bk-header-bar">
          <div className="bk-meta-chip">
            <div className="lab">Sala</div>
            <div className="val">{sala || '___________'}</div>
          </div>
          <div className="bk-title-wrap">
            <div className="bk-headlogos">
              <img className="bk-hl" alt="FEBIU" src={`data:image/png;base64,${LOGO_FEBIU_B64}`} />
              <div className="bk-headtext">
                <div className="bk-kicker">{data.esPanamericano ? `Confederación Panamericana de Billar ${data.temporada}` : `FEBIU · Temporada ${data.temporada}`}</div>
                <h1 className="bk-h1">{data.esPanamericano ? 'Torneo Panamericano' : data.torneo}</h1>
                <div className="bk-subtitle">{subtituloBracket}</div>
              </div>
              {data.esPanamericano && (
                <img className="bk-hl" alt="CPB" src={`data:image/png;base64,${LOGO_CPB_B64}`} />
              )}
            </div>
          </div>
          <div className="bk-meta-chip right">
            <div className="lab">Fecha</div>
            <div className="val">{fechaBracket || '___________'}</div>
          </div>
        </div>
        <div className="bk-gold-rule"></div>
      </header>

      {/* BRACKET */}
      <div className="bk-bracket" style={es8 ? { gridTemplateColumns: '1fr 0.4fr 0.9fr 1.2fr 0.9fr 0.4fr 1fr' } : undefined}>

        {/* COL 0 — LEFT OCTAVOS (solo bracket de 16) */}
        {!es8 && (
        <div className="bk-col" data-bk="Loct">
          <OctGroup m={oct[0]} hora={horas.oct[0]} />
          <OctGroup m={oct[1]} hora={horas.oct[1]} />
          <OctGroup m={oct[2]} hora={horas.oct[2]} />
          <OctGroup m={oct[3]} hora={horas.oct[3]} />
        </div>
        )}

        {/* COL 1 — rail */}
        {!es8 && <div className="bk-col bk-rail"></div>}

        {/* COL 2 — LEFT CUARTOS */}
        <div className="bk-col" data-bk="Lcua">
          <StageGroup m={cua[0]} label="Cuartos" hora={horas.cua[0]} placeholder={!cua[0]?.playerAId} />
          <StageGroup m={cua[1]} label="Cuartos" hora={horas.cua[1]} placeholder={!cua[1]?.playerAId} />
        </div>

        {/* COL 3 — rail */}
        <div className="bk-col bk-rail"></div>

        {/* COL 4 — LEFT SEMIFINAL */}
        <div className="bk-col" data-bk="Lsem">
          <StageGroup m={sem[0]} label="Semifinal" hora={horas.sem[0]} placeholder={!sem[0]?.playerAId} />
        </div>

        {/* COL 5 — CENTER */}
        <div className="bk-col bk-center" data-bk="center">
          <div className="bk-final-block">
            <div className="bk-final-label">Final</div>
            <div className="bk-final-card bk-match">
              <div className="bk-final-head">
                <span className="ft">Final</span>
                <span className="fh">
                  <svg className="clock" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={2.2} style={{width:14,height:14}}>
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                  </svg>
                  {horas.fin && horas.fin.trim() ? horas.fin : 'Hora: ___'}
                </span>
              </div>
              <Seat m={fin} side="A" isPlaceholder={!fin?.playerAId} />
              <Seat m={fin} side="B" isPlaceholder={!fin?.playerBId} />
            </div>
          </div>
          <div className="bk-champ">
            <div className="bk-trophy">🏆</div>
            <div className="bk-champ-label">Campeón</div>
            <div className="bk-champ-card">
              <div className="shine"></div>
              {camp ? (
                <span className="bk-champ-name">
                  {data.esPanamericano && banderaPaisG(camp.pais) && (
                    <img className="bk-flag bk-flag-champ" src={`data:image/png;base64,${banderaPaisG(camp.pais)}`} alt={apocPaisG(camp.pais)} />
                  )}
                  {camp.nombre}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* COL 6 — RIGHT SEMIFINAL */}
        <div className="bk-col" data-bk="Rsem">
          <StageGroup m={sem[1]} label="Semifinal" hora={horas.sem[1]} right placeholder={!sem[1]?.playerAId} />
        </div>

        {/* COL 7 — rail */}
        <div className="bk-col bk-rail"></div>

        {/* COL 8 — RIGHT CUARTOS */}
        <div className="bk-col" data-bk="Rcua">
          <StageGroup m={cua[2]} label="Cuartos" hora={horas.cua[2]} right placeholder={!cua[2]?.playerAId} />
          <StageGroup m={cua[3]} label="Cuartos" hora={horas.cua[3]} right placeholder={!cua[3]?.playerAId} />
        </div>

        {/* COL 9 — rail (solo bracket de 16) */}
        {!es8 && <div className="bk-col bk-rail"></div>}

        {/* COL 10 — RIGHT OCTAVOS (solo bracket de 16) */}
        {!es8 && (
        <div className="bk-col" data-bk="Roct">
          <OctGroup m={oct[4]} hora={horas.oct[4]} right />
          <OctGroup m={oct[5]} hora={horas.oct[5]} right />
          <OctGroup m={oct[6]} hora={horas.oct[6]} right />
          <OctGroup m={oct[7]} hora={horas.oct[7]} right />
        </div>
        )}

      </div>

      {/* WIRES SVG OVERLAY */}
      <svg id="bk-wires" ref={svgRef}></svg>

    </div>
  );
}

// ── Dispatcher principal ──────────────────────────────────────────────
function PubContenido({ data, tema, notas, sala, fechaBracket, horas }:
  { data: any; tema: any; notas: string; sala: string; fechaBracket: string; horas: HorasBracket }) {
  if (data.tipo === 'bracket-nacional') {
    return <PlantillaBracketNacional data={data} sala={sala} fechaBracket={fechaBracket} horas={horas} />;
  }
  // Para tipos nacionales garantizar que categoriaFederal llegue a PubHeader y PlantillaSeriesNacional
  const tiposNacionales = ["series-nacional","inicial-nacional","cruces-nacional","ranking-final","ranking-acumulado-nacional"];
  const dataFinal = tiposNacionales.includes(data.tipo)
    ? { ...data, categoriaFederal: data.categoriaFederal || "primera" }
    : data;
  const temaUsado = (data.tipo === 'ranking' && data.categoriaFederal)
    ? (() => { const c = getColoresCategoria(catPaletaFE(data)); return { ...tema, header: c.bg, accent: c.bg2, light: c.bg }; })()
    : tema;
  return (
    <>
      <PubHeader data={dataFinal} tema={temaUsado} />
      {data.tipo === 'series'          && <PlantillaSeries          data={data} tema={temaUsado} />}
      {data.tipo === 'reduccion'       && <PlantillaReduccion       data={data} tema={temaUsado} />}
      {data.tipo === 'cruces'          && <PlantillaCruces          data={data} tema={temaUsado} />}
      {data.tipo === 'ranking'         && <PlantillaRanking         data={data} tema={temaUsado} />}
      {data.tipo === 'series-nacional'  && <PlantillaSeriesNacional  data={dataFinal} tema={temaUsado} />}
      {data.tipo === 'inicial-nacional' && <PlantillaSeriesNacional  data={{...dataFinal, ocultarResultados: true}} tema={temaUsado} />}
      {data.tipo === 'cruces-nacional'  && <PlantillaCrucesNacional  data={data} />}
      {data.tipo === 'ranking-final'      && <PlantillaRankingNacional data={data} />}
      <PubFooter notas={notas} tema={temaUsado} />
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────
const BUILD_TAG = 'pub-2026-06-29-titulo-pana-fijo';

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
  const [horas, setHoras] = useState<HorasBracket>({
    oct: ['', '', '', '', '', '', '', ''],
    cua: ['', '', '', ''],
    sem: ['', ''],
    fin: '',
  });
  const [error, setError]           = useState('');
  const exportRef  = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setHoraFase = (fase: 'oct' | 'cua' | 'sem', i: number, v: string) =>
    setHoras(prev => ({ ...prev, [fase]: prev[fase].map((h, idx) => (idx === i ? v : h)) }));
  const setHoraFinal = (v: string) => setHoras(prev => ({ ...prev, fin: v }));
  const aplicarHoraGlobal = (v: string) =>
    setHoras({ oct: Array(8).fill(v), cua: Array(4).fill(v), sem: Array(2).fill(v), fin: v });

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
      const contentW = isBracket ? 1440 : 1080;
      const scale = isBracket ? 0.46 : 0.5;
      wrapperRef.current.style.width  = `${Math.round(contentW * scale)}px`;
      wrapperRef.current.style.height = `${Math.round(exportRef.current.scrollHeight * scale)}px`;
    }
  }, [pubData, notas, sala, fechaBracket, horas]);

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

      if (tipoFase === 'ranking-acumulado-nacional') {
        const todosCircuitos2 = torneos.flatMap((t: any) =>
          (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name, torneoYear: t.year, torneoId: t.id }))
        );
        const circuito2 = todosCircuitos2.find((c: any) => c.id === Number(circuitId));
        if (!circuito2) { setError('Circuito no encontrado.'); setLoading(false); return; }
        const acumRes2 = await api.get(`/acumulado/${circuito2.torneoId}`);
        if (!acumRes2.data || acumRes2.data.length === 0) {
          setError('No hay ranking final disponible aún.'); setLoading(false); return;
        }
        const jugadoresAcum = acumRes2.data.map((e: any) => ({
          posicion: e.position ?? 0,
          nombre: `${e.player.lastName}, ${e.player.firstName}`,
          club: abrevClub(e.player.club),
          puntos: e.points,
          categoria: e.player?.category?.name ?? null,
          setsGanados: e.setsWon,
          setsPerdidos: e.setsLost,
          tantosFavor: e.pointsFor,
          tantosContra: e.pointsAgainst,
          promedio: e.matchesPlayed > 0 ? parseFloat((e.pointsFor / e.matchesPlayed).toFixed(2)) : 0,
        }));
        const cat = circuito2.torneoNombre?.toLowerCase().includes('primera') ? 'primera'
          : circuito2.torneoNombre?.toLowerCase().includes('segunda') ? 'segunda' : 'tercera';
        setPubData({
          tipo: 'ranking-final',
          tipoFase: 'ranking-acumulado-nacional',
          torneo: circuito2.torneoNombre,
          temporada: String(circuito2.torneoYear),
          fase: 'RANKING FINAL',
          categoriaFederal: cat,
          jugadores: jugadoresAcum,
        });
        setNotas(''); setLoading(false); return;
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

  // Ensure Google Fonts loaded for export
  React.useEffect(() => {
    const id = 'febiu-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Saira+Condensed:wght@600;700;800;900&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const exportar = async () => {
    if (!exportRef.current) return;
    setExportando(true);
    try {
      const hti = await cargarHtmlToImage();
      const isBracket = pubData?.tipo === 'bracket-nacional';
      const isNacional = pubData?.tipo === 'series-nacional' || pubData?.tipo === 'cruces-nacional' || pubData?.tipo === 'ranking-final' || pubData?.tipo === 'ranking' || pubData?.tipoFase === 'ranking-acumulado-nacional';
      const el = exportRef.current;
      const W = isBracket ? 1440 : 1080;
      const H = el.scrollHeight;
      const scale = isNacional ? 2 : 3;
      const opts = {
        width: W,
        height: H,
        pixelRatio: scale,
        backgroundColor: isBracket ? undefined : '#06182f',
        skipFonts: false,
        useCORS: true,
        style: {
          transform: 'none',
          position: 'static',
          top: '0',
          left: '0',
        },
        filter: (node: HTMLElement) => {
          if (node.tagName === 'SCRIPT') return false;
          return true;
        },
      };
      // html-to-image a veces necesita dos pasadas para cargar las fuentes
      await hti.toPng(el, opts);
      const dataUrl = await hti.toPng(el, opts);
      const link = document.createElement('a');
      link.download = `${pubData?.fase ?? 'publicacion'} - ${pubData?.circuito ?? ''}.png`.replace(/[/\\?%*:|"<>]/g, '-');
      link.href = dataUrl;
      link.click();
    } catch (e: any) { alert(`Error al exportar: ${e.message}`); }
    finally { setExportando(false); }
  };

  const exportarEnPartes = async () => {
    if (!exportRef.current) return;
    setExportando(true);
    try {
      const hti = await cargarHtmlToImage();
      const el = exportRef.current;
      const W = 1080;
      const H = el.scrollHeight;
      const mitad = Math.floor(H / 2);
      const scale = 1.5;
      const nombre = `${pubData?.fase ?? 'publicacion'} - ${pubData?.circuito ?? ''}`.replace(/[/\\?%*:|"<>]/g, '-');

      // Crear canvas completo
      await hti.toPng(el, { width: W, height: H, pixelRatio: scale, backgroundColor: '#06182f', skipFonts: false, useCORS: true, style: { transform: 'none', position: 'static', top: '0', left: '0' }, filter: (node: HTMLElement) => node.tagName !== 'SCRIPT' });
      const dataUrl = await hti.toPng(el, { width: W, height: H, pixelRatio: scale, backgroundColor: '#06182f', skipFonts: false, useCORS: true, style: { transform: 'none', position: 'static', top: '0', left: '0' }, filter: (node: HTMLElement) => node.tagName !== 'SCRIPT' });

      // Dividir en 2 usando canvas
      const img = new Image();
      await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = dataUrl; });

      const corte = mitad * scale;
      const totalH = H * scale;

      // Parte 1
      const c1 = document.createElement('canvas');
      c1.width = W * scale; c1.height = corte;
      c1.getContext('2d')!.drawImage(img, 0, 0, W * scale, corte, 0, 0, W * scale, corte);
      const url1 = c1.toDataURL('image/png');
      const a1 = document.createElement('a');
      a1.download = `${nombre} - Parte 1.png`; a1.href = url1; a1.click();

      // Esperar un momento entre descargas
      await new Promise(r => setTimeout(r, 800));

      // Parte 2
      const c2 = document.createElement('canvas');
      c2.width = W * scale; c2.height = totalH - corte;
      c2.getContext('2d')!.drawImage(img, 0, corte, W * scale, totalH - corte, 0, 0, W * scale, totalH - corte);
      const url2 = c2.toDataURL('image/png');
      const a2 = document.createElement('a');
      a2.download = `${nombre} - Parte 2.png`; a2.href = url2; a2.click();

    } catch (e: any) { alert(`Error al exportar: ${e.message}`); }
    finally { setExportando(false); }
  };

  const tema = TEMAS[tipoFase] ?? TEMAS.clasificatorio;
  // Ordenar: nacionales primero (por nombre torneo), luego departamentales; dentro de cada torneo por order
  const esNacionalTorneo = (nombre: string) => /nacional/i.test(nombre);
  const ordenTorneo = (nombre: string) => {
    if (/primera/i.test(nombre)) return 1;
    if (/segunda/i.test(nombre)) return 2;
    if (/tercera/i.test(nombre)) return 3;
    return 99;
  };
  const circuitos = torneos
    .flatMap((t: any) => (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name, esNacional: esNacionalTorneo(t.name) })))
    .sort((a: any, b: any) => {
      if (a.esNacional !== b.esNacional) return a.esNacional ? -1 : 1;
      const ot = ordenTorneo(a.torneoNombre) - ordenTorneo(b.torneoNombre);
      if (ot !== 0) return ot;
      if (a.torneoNombre !== b.torneoNombre) return a.torneoNombre.localeCompare(b.torneoNombre);
      return (a.order ?? 0) - (b.order ?? 0);
    });
  const esBracket = tipoFase === 'bracket-nacional';

  return (
    <div>
      {pubData && esAdmin && (
        <div ref={exportRef} style={{ position: 'absolute', top: '-9999px', left: 0, fontFamily: F, lineHeight: 1.3, width: pubData?.tipo === 'bracket-nacional' ? '1440px' : '1080px' }}>
          <PubContenido data={pubData} tema={tema} notas={notas} sala={sala} fechaBracket={fechaBracket} horas={horas} />
        </div>
      )}

      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-gold">PUBLICACIONES</h1>
          <p className="text-chalk/50 text-sm mt-1" data-build={BUILD_TAG}>{esAdmin ? 'Generación y exportación de gráficos para difusión' : 'Gráficos del torneo'}</p>
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
              <select className="input" value={circuitId} onChange={e => {
                const cId = e.target.value;
                const circ = circuitos.find((c: any) => String(c.id) === String(cId));
                const esNac = /nacional/i.test(circ?.torneoNombre ?? '') || /panamericano/i.test(circ?.torneoNombre ?? '');
                setCircuitId(cId);
                setTipoFase(esNac ? 'inicial-nacional' : 'clasificatorio');
                setPubData(null);
              }}>
                <option value="">Seleccionar circuito...</option>
                {circuitos.map((c: any) => <option key={c.id} value={c.id}>{c.torneoNombre} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Publicación</label>
              <select className="input" value={tipoFase} onChange={e => { setTipoFase(e.target.value); setPubData(null); }}>
                {(() => {
                  const circSelec = circuitos.find((c: any) => String(c.id) === String(circuitId));
                  const esNac = (circSelec?.esNacional ?? false) || /panamericano/i.test(circSelec?.torneoNombre ?? '');
                  const fasesNacional = ['inicial-nacional', 'series-nacional', 'ranking', 'cruces-nacional', 'bracket-nacional', 'ranking-acumulado-nacional'];
                  const fasesDep = FASES.filter(f => !['series-nacional','cruces-nacional','bracket-nacional','inicial-nacional'].includes(f.value));
                  const fasesNac = [
                    { value: 'inicial-nacional',           label: '📋 Inicial (fixture sin resultados)' },
                    { value: 'series-nacional',            label: '🎱 Series Nacional (con resultados)' },
                    { value: 'ranking',                    label: '🏅 Ranking del Circuito' },
                    { value: 'cruces-nacional',            label: '⚔️ Cruces Nacional' },
                    { value: 'bracket-nacional',           label: '🏟 Bracket Nacional' },
                    { value: 'ranking-acumulado-nacional', label: '🏆 Ranking Final' },
                  ];
                  return (esNac ? fasesNac : fasesDep).map(f => <option key={f.value} value={f.value}>{f.label}</option>);
                })()}
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest">Horarios por partido (campo vacío usa la hora del sistema)</label>
                  <input
                    className="input !w-44 !py-1 text-xs"
                    placeholder="Aplicar a todos…"
                    onChange={e => aplicarHoraGlobal(e.target.value)}
                  />
                </div>

                <div>
                  <span className="text-chalk/40 text-[11px] uppercase tracking-widest">Octavos</span>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {horas.oct.map((h, i) => (
                      <input
                        key={i}
                        className="input !py-1 text-sm"
                        placeholder={`Oct ${i + 1}`}
                        value={h}
                        onChange={e => setHoraFase('oct', i, e.target.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-chalk/40 text-[11px] uppercase tracking-widest">Cuartos</span>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {horas.cua.map((h, i) => (
                      <input
                        key={i}
                        className="input !py-1 text-sm"
                        placeholder={`Cuartos ${i + 1}`}
                        value={h}
                        onChange={e => setHoraFase('cua', i, e.target.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 items-end">
                  <div className="col-span-2">
                    <span className="text-chalk/40 text-[11px] uppercase tracking-widest">Semifinales</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {horas.sem.map((h, i) => (
                        <input
                          key={i}
                          className="input !py-1 text-sm"
                          placeholder={`Semi ${i + 1}`}
                          value={h}
                          onChange={e => setHoraFase('sem', i, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-chalk/40 text-[11px] uppercase tracking-widest">Final</span>
                    <div className="mt-1">
                      <input
                        className="input !py-1 text-sm w-full"
                        placeholder="Hora final"
                        value={horas.fin}
                        onChange={e => setHoraFinal(e.target.value)}
                      />
                    </div>
                  </div>
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
              <div className="flex items-center gap-4 flex-wrap">
                <button className="btn-primary px-8" disabled={exportando} onClick={exportar}>
                  {exportando ? 'Exportando...' : '⬇ Exportar PNG'}
                </button>
                {(pubData?.tipo === 'inicial-nacional' || pubData?.tipo === 'series-nacional') && (
                  <button className="btn-primary px-8" disabled={exportando} onClick={exportarEnPartes}
                    style={{ background: 'linear-gradient(135deg, #1a3560, #0a223f)', border: '1px solid #f4c43055' }}>
                    {exportando ? 'Exportando...' : '⬇ Exportar en 2 partes (WhatsApp)'}
                  </button>
                )}
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
               : pubData.tipo === 'bracket-nacional'? `Bracket ${pubData.tamano ?? 16} jugadores`
               : `${pubData.cruces?.length ?? 0} cruces`}
            </p>
            <div ref={wrapperRef} style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'inline-block' }}>
              <div style={{ width: esBracket ? '1440px' : '1080px', transform: esBracket ? 'scale(0.46)' : 'scale(0.5)', transformOrigin: 'top left', fontFamily: F, background: '#ffffff', lineHeight: 1.3 }}>
                <PubContenido data={pubData} tema={tema} notas={notas} sala={sala} fechaBracket={fechaBracket} horas={horas} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
