// Despues de compilar, genera una pagina HTML por cada entrega de "Memorias del Billar Uruguayo" (y para el indice),
// con titulo, descripcion y etiquetas Open Graph / Twitter Card en el HTML inicial, para que WhatsApp y Facebook las lean.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { transformSync } = require('esbuild');
const BASE = 'https://www.febiu.org';
const INSTITUCION = 'Federación de Billar del Uruguay (FEBIU)';
const SERIE = 'Memorias del Billar Uruguayo';

const js = transformSync(readFileSync('src/config/memorias.ts', 'utf8'), { loader: 'ts', format: 'esm' }).code;
const { ENTREGAS } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

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
    `<meta property="og:image:alt" content="${esc(SERIE)} · ${esc(INSTITUCION)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(titulo)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${imagen}" />`,
    tipo === 'article' ? `<meta property="article:publisher" content="${esc(INSTITUCION)}" />` : '',
  ].filter(Boolean).join('\n    ');
  return h.replace('</head>', `    ${tags}\n  </head>`);
}

const logo = `${BASE}/icons/web-512.png`;

// Indice de la serie
mkdirSync('dist/portada/memorias', { recursive: true });
writeFileSync('dist/portada/memorias/index.html', pagina({
  titulo: `${SERIE} | ${INSTITUCION}`,
  desc: 'Serie semanal de la Federación de Billar del Uruguay para reunir documentos, fotografías, resultados y testimonios sobre la historia del billar uruguayo.',
  url: `${BASE}/portada/memorias`, imagen: logo, tipo: 'website', borrador: !ENTREGAS.some(e => e.estado === 'publicado'),
}));

// Una pagina por entrega
for (const e of ENTREGAS) {
  const imagen = e.compartir.imagenAutorizada ? BASE + e.compartir.imagen : logo;
  mkdirSync(`dist/portada/memorias/${e.numero}`, { recursive: true });
  writeFileSync(`dist/portada/memorias/${e.numero}/index.html`, pagina({
    titulo: `${e.titulo} | ${SERIE}`, desc: e.compartir.descripcion,
    url: `${BASE}/portada/memorias/${e.numero}`, imagen, tipo: 'article', borrador: e.estado !== 'publicado',
  }));
}
console.log(`memorias: indice + ${ENTREGAS.length} entrega(s) generadas`);
