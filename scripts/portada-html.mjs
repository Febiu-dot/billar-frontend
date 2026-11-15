// Despues de compilar, genera dist/portada/index.html: la misma pagina pero con titulo, descripcion e imagen propios,
// para que al compartir el link /portada por WhatsApp se vea distinto al link de la app de torneos.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'https://billar-frontend-blue.vercel.app';
const TITULO = 'FEBIU Web — Federación de Billar del Uruguay';
const DESC = 'Transmisiones en vivo, torneos, rankings, clubes y jugadores del billar uruguayo.';

let h = readFileSync('dist/index.html', 'utf8');
// Saca las etiquetas para compartir de la app de torneos para que no queden duplicadas con las de la portada
h = h.replace(/\s*<meta\s+(?:property|name)="(?:og:|twitter:)[^"]*"[^>]*>/g, '');
h = h.replace(/<title>.*?<\/title>/s, `<title>${TITULO}</title>`);
h = h.replace(/<meta name="description" content=".*?"\s*\/?>/s, `<meta name="description" content="${DESC}" />`);
const og = [
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="FEBIU Web" />`,
  `<meta property="og:title" content="${TITULO}" />`,
  `<meta property="og:description" content="${DESC}" />`,
  `<meta property="og:url" content="${BASE}/portada" />`,
  `<meta property="og:image" content="${BASE}/icons/web-512.png" />`,
  `<meta name="twitter:card" content="summary" />`,
].join('\n    ');
h = h.replace('</head>', `    ${og}\n  </head>`);
mkdirSync('dist/portada', { recursive: true });
writeFileSync('dist/portada/index.html', h);
console.log('portada/index.html generado');
