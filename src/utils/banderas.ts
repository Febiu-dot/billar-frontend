// src/utils/banderas.ts
// Utilidades compartidas de país: apócopes + banderas SVG inline.
// Usado por RankingFinalPage.tsx (tabla web) y, si se quiere, por otras vistas.
// Las banderas son SVG (data URI), nítidas a cualquier tamaño y sin dependencias.

// ── Apócopes de país ──────────────────────────────────────────────
export const APOC_PAIS: Record<string, string> = {
  Uruguay: 'URU', Argentina: 'ARG', Brasil: 'BRA', Brazil: 'BRA',
  Paraguay: 'PAR', Chile: 'CHI', Bolivia: 'BOL', Peru: 'PER', Perú: 'PER',
  Colombia: 'COL', Venezuela: 'VEN', Ecuador: 'ECU', Mexico: 'MEX', México: 'MEX',
  Espana: 'ESP', España: 'ESP',
};

export const apocPais = (pais?: string | null): string => {
  if (!pais) return '—';
  return APOC_PAIS[pais] ?? pais.slice(0, 3).toUpperCase();
};

// Normaliza el nombre de país a una clave de bandera conocida.
const normPais = (pais?: string | null): string => {
  if (!pais) return '';
  const k = pais.trim();
  if (k === 'Brazil') return 'Brasil';
  if (k === 'Perú') return 'Peru';
  if (k === 'México') return 'Mexico';
  if (k === 'España') return 'Espana';
  return k;
};

// ── Banderas SVG inline (viewBox 3:2) ─────────────────────────────
// Cada entrada es el markup SVG del paño. Se renderizan a 3:2.
const SVG_URU = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
  <rect width="900" height="600" fill="#fff"/>
  <g fill="#0038a8">
    <rect y="66.67" width="900" height="66.67"/>
    <rect y="200"   width="900" height="66.67"/>
    <rect y="333.33" width="900" height="66.67"/>
    <rect y="466.67" width="900" height="66.67"/>
  </g>
  <rect width="300" height="333.33" fill="#fff"/>
  <circle cx="150" cy="166.67" r="75" fill="#fcd116" stroke="#000" stroke-width="2"/>
  <circle cx="150" cy="166.67" r="42" fill="#fcd116" stroke="#000" stroke-width="2"/>
</svg>`.trim();

const SVG_ARG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
  <rect width="900" height="600" fill="#74acdf"/>
  <rect y="200" width="900" height="200" fill="#fff"/>
  <circle cx="450" cy="300" r="45" fill="#f6b40e" stroke="#85340a" stroke-width="3"/>
</svg>`.trim();

const SVG_BRA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 630">
  <rect width="900" height="630" fill="#009b3a"/>
  <path d="M450 67 833 315 450 563 67 315z" fill="#fedf00"/>
  <circle cx="450" cy="315" r="124" fill="#002776"/>
</svg>`.trim();

const SVG_GENERIC = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
  <rect width="900" height="600" fill="#9ca3af"/>
</svg>`.trim();

const SVG_POR_PAIS: Record<string, string> = {
  Uruguay: SVG_URU,
  Argentina: SVG_ARG,
  Brasil: SVG_BRA,
};

// data URI a partir del SVG (encodeURIComponent evita problemas con #, <, etc.)
const svgToDataUri = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// ── API pública ───────────────────────────────────────────────────

// Devuelve el data URI de la bandera del país (o una genérica gris si no se conoce).
export const banderaPais = (pais?: string | null): string => {
  const key = normPais(pais);
  return svgToDataUri(SVG_POR_PAIS[key] ?? SVG_GENERIC);
};

// true si tenemos bandera específica para ese país.
export const tieneBandera = (pais?: string | null): boolean =>
  !!SVG_POR_PAIS[normPais(pais)];
