import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { NOTAS, publicadasNotas, BloqueNota, Nota, TEXTO_PENDIENTE } from '../config/notas';

const fmtFecha = (f: string | null) => {
  if (!f) return '';
  const [y, m, d] = f.split('-').map(Number);
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d} de ${meses[m - 1]} de ${y}`;
};

// Modo vista previa (?borrador=1): muestra tambien los borradores y conserva el modo al navegar
function useVista() {
  const [sp] = useSearchParams();
  const vista = sp.get('borrador') === '1';
  const q = vista ? '?borrador=1' : '';
  const lista = vista ? [...NOTAS] : publicadasNotas();
  return { vista, q, lista };
}

function noindex(activo: boolean) {
  if (!activo) return;
  const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
  return () => { m.remove(); };
}

// *cursiva* y **negrita**
function Texto({ s }: { s: string }) {
  const partes = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return <>{partes.map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong>
    : p.startsWith('*') ? <em key={i}>{p.slice(1, -1)}</em>
    : <span key={i}>{p}</span>)}</>;
}

function Marco({ children }: { children: React.ReactNode }) {
  const { q } = useVista();
  return (
    <div className="min-h-screen bg-carbon text-silver-light font-body">
      <header className="sticky top-0 z-40 bg-carbon/95 backdrop-blur border-b border-silver/15">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/portada" className="flex items-center gap-3 min-w-0">
            <img src="/logo-febiu.png" alt="Logo de la Federación de Billar del Uruguay" className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover" />
            <span className="font-display font-extrabold uppercase tracking-wide text-white text-xl md:text-2xl leading-tight">Federación de Billar del Uruguay</span>
          </Link>
          <nav aria-label="Principal" className="flex gap-1">
            <Link to="/portada" className="min-h-[44px] inline-flex items-center px-3 rounded-lg font-semibold text-sm text-silver-light hover:text-orange-light">Portada</Link>
            <Link to={`/portada/notas${q}`} className="min-h-[44px] inline-flex items-center px-3 rounded-lg font-semibold text-sm text-orange-light">Notas</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-silver/15 mt-10 py-8 text-center text-sm text-silver-dark px-4">
        Notas y entrevistas · Federación de Billar del Uruguay
      </footer>
    </div>
  );
}

function Indice() {
  const { vista, q, lista } = useVista();
  useEffect(() => { document.title = 'Notas y entrevistas | Federación de Billar del Uruguay'; return noindex(vista); }, [vista]);
  return (
    <Marco>
      <main className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
        <h1 className="font-display font-extrabold uppercase tracking-wide text-white text-4xl md:text-6xl leading-tight">Notas y entrevistas</h1>
        {lista.length === 0 ? (
          <div className="bg-carbon-100 border border-silver/15 rounded-2xl p-8 text-center text-silver-light">Muy pronto publicaremos las primeras notas.</div>
        ) : (
          <ol className="flex flex-col gap-4">
            {lista.map(n => (
              <li key={n.slug}>
                <Link to={`/portada/notas/${n.slug}${q}`} className="group flex flex-col sm:flex-row gap-4 bg-carbon-100 border border-silver/15 rounded-2xl overflow-hidden hover:border-orange-light/60">
                  <img src={n.imagen} alt={n.imagenAlt} loading="lazy" className="w-full sm:w-64 h-48 sm:h-auto object-cover" />
                  <div className="p-5 flex flex-col gap-2">
                    <span className="text-xs font-bold tracking-[.19em] uppercase text-orange-light">{n.tipo}{n.fecha ? ` · ${fmtFecha(n.fecha)}` : ''}{n.estado !== 'publicado' ? ' · BORRADOR' : ''}</span>
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight group-hover:text-orange-light">{n.titulo}</h2>
                    <p className="text-silver-light">{n.resumen}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </Marco>
  );
}

function Pieza({ b }: { b: BloqueNota }) {
  if (b.t === 'h2') return <h2 className="font-display font-extrabold uppercase tracking-wide text-white text-2xl md:text-4xl leading-tight mt-12 mb-4 pl-4 border-l-4 border-orange">{b.texto}</h2>;
  if (b.t === 'cita') return (
    <blockquote className="relative my-12 rounded-2xl bg-carbon-100 border border-silver/15 border-l-[6px] border-l-orange px-6 py-7 md:px-10 md:py-9">
      <span aria-hidden="true" className="absolute -top-5 left-5 font-display font-extrabold text-orange text-7xl leading-none select-none">“</span>
      <p className="font-display font-bold uppercase tracking-wide text-white text-2xl md:text-4xl leading-tight m-0"><Texto s={b.texto} /></p>
    </blockquote>
  );
  if (b.t === 'fig') return (
    <figure className={b.vertical ? 'my-8 w-fit max-w-full mx-auto' : 'my-8'}>
      <img src={b.src} alt={b.alt} loading="lazy" className={b.vertical ? 'block mx-auto w-auto max-w-full h-auto max-h-[520px] rounded-xl' : 'w-full block rounded-xl max-h-[620px] object-cover'} />
      {b.pie && <figcaption className="text-[15px] leading-relaxed text-silver-light pt-2"><Texto s={b.pie} /></figcaption>}
    </figure>
  );
  if (b.t === 'datos') return (
    <ul className="my-10 grid grid-cols-2 md:grid-cols-4 gap-3 list-none p-0">
      {b.items.map((d, k) => (
        <li key={k} className="bg-carbon-100 border border-silver/15 border-t-4 border-t-orange rounded-xl p-4 flex flex-col gap-1">
          <span className="font-display font-extrabold text-orange-light text-5xl leading-none">{d.valor}</span>
          <span className="text-sm leading-snug text-silver-light">{d.etiqueta}</span>
        </li>
      ))}
    </ul>
  );
  if (b.t === 'tabla') return (
    <div className="my-6 overflow-hidden rounded-xl border border-silver/20">
      <table className="w-full text-left text-base md:text-lg">
        <thead className="bg-carbon-50 text-xs font-semibold tracking-widest uppercase text-silver-dark">
          <tr>{b.columnas.map((c, k) => <th key={k} scope="col" className={`px-4 py-3 ${k === 0 ? 'w-[7.5rem] md:w-40' : ''}`}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {b.filas.map((f, r) => (
            <tr key={r} className="border-t border-silver/10 align-top">
              {f.map((c, k) => k === 0
                ? <th key={k} scope="row" className="px-4 py-3 font-display font-bold text-orange-light whitespace-nowrap">{c}</th>
                : <td key={k} className="px-4 py-3 text-white">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (b.t === 'video') return (
    <figure className="my-8">
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${b.youtubeId}`} title={b.pie ?? 'Video'} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      </div>
      {b.pie && <figcaption className="text-sm text-silver-dark pt-2"><Texto s={b.pie} /></figcaption>}
    </figure>
  );
  const pendiente = b.texto === TEXTO_PENDIENTE;
  return <p className={`mb-6 ${pendiente ? 'text-orange-light font-semibold' : ''}`}><Texto s={b.texto} /></p>;
}

function Articulo({ n, vistaPrevia }: { n: Nota; vistaPrevia: boolean }) {
  const { q } = useVista();
  useEffect(() => { document.title = `${n.titulo} | Federación de Billar del Uruguay`; return noindex(n.estado !== 'publicado'); }, [n]);
  return (
    <Marco>
      {vistaPrevia && n.estado !== 'publicado' && (
        <div className="bg-orange text-carbon text-center font-bold py-2 px-4 text-sm">BORRADOR · Esta nota todavía no está publicada. Solo la ves vos con este enlace.</div>
      )}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article>
          <header className="flex flex-col gap-4">
            <p className="text-xs font-bold tracking-[.19em] uppercase text-orange-light">{n.tipo} · Federación de Billar del Uruguay{n.fecha ? ` · ${fmtFecha(n.fecha)}` : ''}</p>
            <h1 className="font-display font-extrabold uppercase tracking-wide text-white text-4xl md:text-6xl leading-[1.05]">{n.titulo}</h1>
            <p className="text-xl md:text-2xl leading-snug text-silver-light max-w-3xl">{n.bajada}</p>
            <p className="text-sm text-silver-dark">Por {n.autor}</p>
          </header>
          <figure className="mt-8">
            <img src={n.imagen} alt={n.imagenAlt} className="w-full block rounded-2xl max-h-[640px] object-cover" />
            {n.pieImagen && <figcaption className="text-sm text-silver-dark pt-2">{n.pieImagen}</figcaption>}
          </figure>
          <div className="max-w-[760px] mx-auto mt-10 text-[18px] md:text-[19px] leading-[1.75] text-silver-light">
            {n.cuerpo.map((b, k) => <Pieza key={k} b={b} />)}
            {n.aclaracion && <p className="mt-10 p-5 rounded-xl bg-carbon-100 border border-silver/15 text-base italic">{n.aclaracion}</p>}
            {n.fuentes.length > 0 && <section className="bg-carbon-100 border border-silver/15 rounded-2xl p-5 sm:p-8 my-10 text-[15px] leading-[1.7]">
              <h2 className="font-display font-bold uppercase tracking-wide text-2xl text-white mb-4">Fuentes y referencias periodísticas</h2>
              {n.fuentes.map((f, k) => (
                <p key={k} className="mb-4 last:mb-0">
                  <span className="whitespace-pre-line"><Texto s={f.texto} /></span>
                  {f.enlace && <><br /><a href={f.enlace.url} target="_blank" rel="noopener noreferrer" className="text-orange-light underline break-words">{f.enlace.etiqueta}</a></>}
                </p>
              ))}
            </section>}
          </div>
        </article>
        <nav aria-label="Notas" className="flex flex-wrap justify-between gap-3 mt-6">
          <Link to={`/portada/notas${q}`} className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-silver/40 text-white font-semibold hover:border-orange-light">← Todas las notas</Link>
          <Link to="/portada" className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-silver/40 text-white font-semibold hover:border-orange-light">Volver a la portada</Link>
        </nav>
      </main>
    </Marco>
  );
}

export default function NotasPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  if (!slug) return <Indice />;
  const n = NOTAS.find(x => x.slug === slug);
  const visible = n && (n.estado === 'publicado' || params.get('borrador') === '1');
  if (!n || !visible) {
    return (
      <Marco>
        <main className="max-w-3xl mx-auto px-4 py-16 text-center flex flex-col gap-4 items-center">
          <h1 className="font-display font-extrabold uppercase text-white text-3xl">Esta nota todavía no está disponible</h1>
          <Link to="/portada/notas" className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-silver/40 text-white font-semibold hover:border-orange-light">Ver todas las notas</Link>
        </main>
      </Marco>
    );
  }
  return <Articulo n={n} vistaPrevia={params.get('borrador') === '1'} />;
}
