// Despues de compilar, genera una pagina HTML por cada entrega de "Memorias del Billar Uruguayo" (y para el indice),
// con titulo, descripcion y etiquetas Open Graph / Twitter Card en el HTML inicial, para que WhatsApp y Facebook las lean.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { transformSync } = require('esbuild');
const BASE = 'https://www.febiu.org';
const INSTITUCION = 'Federación de Billar del Uruguay (FEBIU)';
const SERIE = 'Notas y entrevistas';

const js = transformSync(readFileSync('src/config/notas.ts', 'utf8'), { loader: 'ts', format: 'esm' }).code;
const { NOTAS } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const base = readFileSync('dist/index.html', 'utf8');

function pagina({ titulo, desc, url, imagen, tipo, borrador }) {
  let h = base;
  // Saca las etiquetas para compartir que trae la app (son las de FBU Torneos) para que no queden duplicadas
  h = h.replace(/\s*<meta\s+(?:property|name)="(?:og:|twitter:)[^"]*"[^>]*>/g, '');
  h = h.replace(/<title>.*?<\/title>/s, `<title>${esc(titulo)}</title>`);
  h = h.replace(/<meta name="description" content=".*?"\s*\/?>/s, `<meta name="description" content="${esc(desc)}" />`);
  const tags = [
    borrador ? `<meta name="robots" content="noindex, nofollow" />` : '',
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:locale" content="es_UY" />`,
    `<meta property="og:type" content="${tipo}" />`,
    `<meta property="og:site_name" content="${esc(INSTITUCION)}" />`,
    `<meta property="og:title" content="${esc(titulo)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${imagen}" />`,
    `<meta property="og:image:alt" content="${esc(titulo)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(titulo)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${imagen}" />`,
    tipo === 'article' ? `<meta property="article:publisher" content="${esc(INSTITUCION)}" />` : '',
  ].filter(Boolean).join('\n    ');
  return h.replace('</head>', `    ${tags}\n  </head>`);
}

const logo = `${BASE}/icons/web-512.png`;

// Indice
mkdirSync('dist/portada/notas', { recursive: true });
writeFileSync('dist/portada/notas/index.html', pagina({
  titulo: `Notas y entrevistas | ${INSTITUCION}`,
  desc: 'Notas y entrevistas de la Federación de Billar del Uruguay sobre jugadores, clubes y torneos del billar uruguayo.',
  url: `${BASE}/portada/notas`, imagen: logo, tipo: 'website', borrador: !NOTAS.some(n => n.estado === 'publicado'),
}));

// Una pagina por nota
for (const n of NOTAS) {
  const imagen = n.compartir.imagenAutorizada ? BASE + n.compartir.imagen : logo;
  mkdirSync(`dist/portada/notas/${n.slug}`, { recursive: true });
  writeFileSync(`dist/portada/notas/${n.slug}/index.html`, pagina({
    titulo: `${n.titulo} | ${INSTITUCION}`, desc: n.compartir.descripcion,
    url: `${BASE}/portada/notas/${n.slug}`, imagen, tipo: 'article', borrador: n.estado !== 'publicado',
  }));
}
console.log(`notas: indice + ${NOTAS.length} nota(s) generadas`);
