import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ENTREGAS, publicadas, Bloque, Entrega } from '../config/memorias';

const fmtFecha = (f: string | null) => {
  if (!f) return '';
  const [y, m, d] = f.split('-').map(Number);
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d} de ${meses[m - 1]} de ${y}`;
};

// *cursiva* y **negrita**
function Texto({ s }: { s: string }) {
  const partes = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return <>{partes.map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong>
    : p.startsWith('*') ? <em key={i}>{p.slice(1, -1)}</em>
    : <span key={i}>{p}</span>)}</>;
}

function Marco({ children }: { children: React.ReactNode }) {
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
            <Link to="/portada/memorias" className="min-h-[44px] inline-flex items-center px-3 rounded-lg font-semibold text-sm text-orange-light">Memorias</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-silver/15 mt-10 py-8 text-center text-sm text-silver-dark px-4">
        Memorias del Billar Uruguayo · Federación de Billar del Uruguay<br />
        Proyecto de recuperación y difusión del patrimonio deportivo
      </footer>
    </div>
  );
}

function Indice() {
  const lista = publicadas();
  useEffect(() => { document.title = 'Memorias del Billar Uruguayo — FEBIU'; }, []);
  return (
    <Marco>
      <main className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8">
        <div>
          <p className="text-xs font-bold tracking-[.19em] uppercase text-orange-light">Archivo histórico</p>
          <h1 className="font-display font-extrabold uppercase tracking-wide text-white text-4xl md:text-6xl leading-tight mt-2">Memorias del Billar Uruguayo</h1>
          <p className="text-lg md:text-xl text-silver-light mt-3 max-w-3xl">Una serie semanal de la Federación de Billar del Uruguay para reunir documentos, fotografías, resultados y testimonios sobre la historia de nuestro deporte.</p>
        </div>
        {lista.length === 0 ? (
          <div className="bg-carbon-100 border border-silver/15 rounded-2xl p-8 text-center text-silver-light">
            La primera entrega se publicará muy pronto.
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {lista.map(e => (
              <li key={e.numero}>
                <Link to={`/portada/memorias/${e.numero}`} className="group flex flex-col sm:flex-row gap-4 bg-carbon-100 border border-silver/15 rounded-2xl overflow-hidden hover:border-orange-light/60">
                  <img src={e.portada} alt={e.portadaAlt} loading="lazy" className="w-full sm:w-64 h-48 sm:h-auto object-cover" />
                  <div className="p-5 flex flex-col gap-2">
                    <span className="text-xs font-bold tracking-[.19em] uppercase text-orange-light">Entrega n.º {e.numero}{e.fecha ? ` · ${fmtFecha(e.fecha)}` : ''}</span>
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight group-hover:text-orange-light">{e.titulo}</h2>
                    <p className="text-silver-light">{e.resumen}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <div className="border-t border-silver/15 pt-6 text-silver-light">
          <p>¿Tenés recuerdos, recortes de prensa, fotografías o documentos del billar uruguayo? La Federación invita a clubes, jugadores y familias a colaborar con esta historia compartida.</p>
        </div>
      </main>
    </Marco>
  );
}

function Pieza({ b }: { b: Bloque }) {
  if (b.t === 'h2') return <h2 className="font-serif text-[1.6rem] md:text-[2.1rem] leading-snug text-[#173d32] mt-12 mb-4">{b.texto}</h2>;
  if (b.t === 'cita') return <blockquote className="border-l-4 border-[#b58c4a] my-8 py-2 pl-6 text-xl md:text-2xl text-[#173d32]"><Texto s={b.texto} /></blockquote>;
  if (b.t === 'fig') return (
    <figure className="my-8 -mx-2 sm:mx-0">
      <img src={b.src} alt={b.alt} loading="lazy" className="w-full block max-h-[660px] object-contain bg-[#e5e0d5]" />
      <figcaption className="font-sans text-sm leading-relaxed text-[#626b66] py-3 border-b border-[#d7d4c9]"><Texto s={b.pie} /></figcaption>
    </figure>
  );
  return <p className={`mb-6 ${b.inicial ? 'first-letter:float-left first-letter:text-7xl first-letter:leading-[.85] first-letter:pr-3 first-letter:pt-2 first-letter:text-[#173d32]' : ''}`}><Texto s={b.texto} /></p>;
}

function Articulo({ e, vistaPrevia }: { e: Entrega; vistaPrevia: boolean }) {
  const lista = publicadas();
  const i = lista.findIndex(x => x.numero === e.numero);
  const anterior = i >= 0 ? lista[i + 1] : undefined;
  const siguiente = i > 0 ? lista[i - 1] : undefined;
  useEffect(() => {
    document.title = `${e.titulo} | Memorias del Billar Uruguayo`;
    if (e.estado !== 'publicado') {
      const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
      return () => { m.remove(); };
    }
  }, [e]);
  return (
    <Marco>
      {vistaPrevia && e.estado !== 'publicado' && (
        <div className="bg-orange text-carbon text-center font-bold py-2 px-4 text-sm">BORRADOR · Esta entrega todavía no está publicada. Solo la ves vos con este enlace.</div>
      )}
      <main className="max-w-4xl mx-auto px-2 sm:px-4 py-8">
        <article className="bg-[#f8f6f0] text-[#202c28] rounded-2xl overflow-hidden">
          <div className="bg-[#173d32] text-white px-6 py-4 font-sans text-xs sm:text-sm font-semibold tracking-[.13em] uppercase">
            Federación de Billar del Uruguay <span className="text-[#dfc58e]">· Archivo histórico</span>
          </div>
          <section className="px-6 pt-12 pb-6 text-center">
            <p className="font-sans text-xs font-bold tracking-[.19em] uppercase text-[#80602f]">Memorias del Billar Uruguayo · Entrega n.º {e.numero}{e.fecha ? ` · ${fmtFecha(e.fecha)}` : ''}</p>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.12] my-5 text-[#173d32]">{e.titulo}</h1>
            <p className="font-serif text-xl md:text-2xl leading-snug max-w-2xl mx-auto text-[#53645b]">{e.bajada}</p>
            <div className="w-[75px] h-[3px] bg-[#b58c4a] mx-auto mt-7" />
          </section>
          <div className="max-w-[760px] mx-auto px-5 sm:px-6 pb-10 font-serif text-[17px] md:text-lg leading-[1.78]">
            {e.cuerpo.map((b, k) => <Pieza key={k} b={b} />)}
            <section className="bg-[#eae9df] rounded-md p-5 sm:p-8 my-12 font-sans text-[15px] leading-[1.7]">
              <h2 className="font-sans font-bold text-xl mb-4 text-[#173d32]">Fuentes y documentación</h2>
              {e.fuentes.map((f, k) => (
                <p key={k} className="mb-4 last:mb-0">
                  <Texto s={f.texto} />
                  {f.enlace && <><br /><a href={f.enlace.url} target="_blank" rel="noopener noreferrer" className="text-[#175543] underline break-words">{f.enlace.etiqueta}</a></>}
                </p>
              ))}
            </section>
            {e.proxima && <div className="border-t-2 border-[#b58c4a] pt-6 font-sans text-base"><strong>Próxima entrega:</strong> {e.proxima}</div>}
          </div>
        </article>
        <nav aria-label="Entregas" className="flex flex-wrap justify-between gap-3 mt-6">
          {anterior ? <Link to={`/portada/memorias/${anterior.numero}`} className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-silver/40 text-white font-semibold hover:border-orange-light">← N.º {anterior.numero}: {anterior.titulo}</Link> : <span />}
          <Link to="/portada/memorias" className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-silver/40 text-white font-semibold hover:border-orange-light">Todas las entregas</Link>
          {siguiente ? <Link to={`/portada/memorias/${siguiente.numero}`} className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-silver/40 text-white font-semibold hover:border-orange-light">N.º {siguiente.numero}: {siguiente.titulo} →</Link> : <span />}
        </nav>
      </main>
    </Marco>
  );
}

export default function MemoriasPage() {
  const { numero } = useParams();
  const [params] = useSearchParams();
  if (!numero) return <Indice />;
  const e = ENTREGAS.find(x => String(x.numero) === numero);
  const visible = e && (e.estado === 'publicado' || params.get('borrador') === '1');
  if (!e || !visible) {
    return (
      <Marco>
        <main className="max-w-3xl mx-auto px-4 py-16 text-center flex flex-col gap-4 items-center">
          <h1 className="font-display font-extrabold uppercase text-white text-3xl">Esta entrega todavía no está disponible</h1>
          <Link to="/portada/memorias" className="min-h-[48px] inline-flex items-center px-5 rounded-lg border border-silver/40 text-white font-semibold hover:border-orange-light">Ver todas las entregas</Link>
        </main>
      </Marco>
    );
  }
  return <Articulo e={e} vistaPrevia={params.get('borrador') === '1'} />;
}
