import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { LoadingSpinner } from '../components/ui';
import {
  YOUTUBE_EMBED_URL, CANAL_YOUTUBE_URL, CONTACTO, TRANSMISION_PRESENTADA_POR,
  AUSPICIANTE_PRINCIPAL, AUSPICIANTES_OFICIALES, VIDEOS, NOTAS,
  PANAMERICANO_PROXIMO, MUNDIAL, Auspiciante,
} from '../config/portadaConfig';

const CATEGORIAS: { key: string; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'master',  label: 'Máster' },
  { key: 'primera', label: 'Primera' },
  { key: 'segunda', label: 'Segunda' },
  { key: 'tercera', label: 'Tercera' },
];

const nombre = (p: any) => p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '—';

function contactoHref(asunto: string): string | null {
  if (CONTACTO.whatsapp) return `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(asunto)}`;
  if (CONTACTO.email) return `mailto:${CONTACTO.email}?subject=${encodeURIComponent(asunto)}`;
  return null;
}

function Logo({ a, className }: { a: Auspiciante; className?: string }) {
  const img = <img src={a.logo} alt={a.nombre} className={className ?? 'max-h-full max-w-full object-contain'} />;
  return a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full h-full">{img}</a> : <div className="flex items-center justify-center w-full h-full">{img}</div>;
}

const H2 = 'font-display font-extrabold uppercase tracking-wide text-white text-3xl md:text-4xl leading-tight';

export default function PortadaPage() {
  const [loading, setLoading] = useState(true);
  const [torneos, setTorneos] = useState<{ id: number; name: string }[]>([]);
  const [torneoSel, setTorneoSel] = useState<number | null>(null);
  const [enJuego, setEnJuego] = useState<any[]>([]);
  const [proximos, setProximos] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [rankingCargado, setRankingCargado] = useState(false);
  const [cat, setCat] = useState('general');
  const [catPartidos, setCatPartidos] = useState('todas');

  useEffect(() => { document.title = 'Federación de Billar del Uruguay'; }, []);

  const cargarPartidos = () => {
    Promise.all([
      api.get('/matches?status=en_juego'),
      api.get('/matches?status=asignado'),
      api.get('/matches?status=pendiente'),
      api.get('/publicaciones/circuitos').catch(() => ({ data: [] })),
    ]).then(([a, b, c, t]) => {
      setEnJuego(a.data);
      setProximos([...b.data, ...c.data]);
      const act = (t.data as any[]).filter(x => x.active === true).map(x => ({ id: x.id, name: x.name }));
      setTorneos(act);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    cargarPartidos();
    socket.emit('join:public');
    socket.on('match:updated', cargarPartidos);
    socket.on('table:updated', cargarPartidos);
    return () => { socket.off('match:updated', cargarPartidos); socket.off('table:updated', cargarPartidos); };
  }, []);

  // Torneo por defecto: el que tiene partidos en juego; si no, el primero activo.
  useEffect(() => {
    if (torneoSel != null || torneos.length === 0) return;
    const conJuego = enJuego.map(m => m?.phase?.circuit?.tournament?.id).find(id => torneos.some(t => t.id === id));
    setTorneoSel(conJuego ?? torneos[0].id);
  }, [torneos, enJuego, torneoSel]);

  useEffect(() => {
    if (torneoSel == null) return;
    setRankingCargado(false);
    api.get(`/acumulado/${torneoSel}`)
      .then(r => setRanking(r.data ?? []))
      .catch(() => setRanking([]))
      .finally(() => setRankingCargado(true));
  }, [torneoSel]);

  const torneoNombre = torneos.find(t => t.id === torneoSel)?.name ?? '';
  const delTorneo = (m: any) => torneoSel != null && m?.phase?.circuit?.tournament?.id === torneoSel;
  const delaCat = (m: any) => catPartidos === 'todas' ||
    m?.playerA?.category?.name === catPartidos;
  const enJuegoF = useMemo(() => enJuego.filter(delTorneo).filter(delaCat).slice(0, 6), [enJuego, torneoSel, catPartidos]);
  const proximosF = useMemo(() => proximos.filter(delTorneo).filter(delaCat).slice(0, 6), [proximos, torneoSel, catPartidos]);
  const rankingF = useMemo(() => ranking.filter(e => cat === 'general' || e.player?.category?.name === cat).slice(0, 10), [ranking, cat]);

  const hrefAuspiciar = contactoHref('Quiero auspiciar a la FEBIU');
  const hrefMundial = contactoHref('Quiero ser sponsor del Mundial de Billar 2027');
  const hayAuspiciantes = !!AUSPICIANTE_PRINCIPAL || AUSPICIANTES_OFICIALES.length > 0;

  if (loading) return <div className="min-h-screen bg-carbon flex items-center justify-center"><LoadingSpinner /></div>;

  const btnNav = 'min-h-[44px] inline-flex items-center px-3 rounded-lg font-semibold text-sm text-silver-light hover:text-orange-light';
  const card = 'bg-carbon-100 border border-silver/15 rounded-2xl';

  return (
    <div className="min-h-screen bg-carbon text-silver-light font-body">
      {/* Encabezado */}
      <header className="border-b border-silver/15">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/portada" className="flex items-center gap-3 min-w-0">
            <img src="/logo-febiu.png" alt="Logo de la Federación de Billar del Uruguay" className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover" />
            <span className="font-display font-extrabold uppercase tracking-wide text-white text-xl md:text-2xl leading-tight">Federación de Billar del Uruguay</span>
          </Link>
          <nav aria-label="Principal" className="flex flex-wrap gap-1">
            <a href="#en-vivo" className={btnNav}>En vivo</a>
            <a href="#temporada" className={btnNav}>Temporada</a>
            <a href="#ranking" className={btnNav}>Rankings</a>
            {VIDEOS.length > 0 && <a href="#videos" className={btnNav}>Videos</a>}
            {NOTAS.length > 0 && <a href="#notas" className={btnNav}>Notas</a>}
            <a href="#mundial" className={`${btnNav} !text-orange-light`}>Mundial 2027</a>
          </nav>
        </div>
      </header>

      {/* En vivo */}
      <section id="en-vivo" aria-labelledby="envivo" className="max-w-6xl mx-auto px-4 pt-6 pb-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:flex-[2] min-w-0 flex flex-col gap-4">
            <div className="relative w-full aspect-video bg-black border border-silver/15 rounded-2xl overflow-hidden">
              {YOUTUBE_EMBED_URL ? (
                <iframe
                  src={YOUTUBE_EMBED_URL}
                  title="Transmisión en vivo"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4">
                  <span className="text-silver text-lg">Próxima transmisión en vivo</span>
                  {CANAL_YOUTUBE_URL && <a href={CANAL_YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="min-h-[48px] inline-flex items-center px-5 rounded-lg bg-orange text-carbon font-bold">Ver canal de YouTube</a>}
                </div>
              )}
            </div>
            <div>
              <h1 id="envivo" className="font-display font-extrabold uppercase tracking-wide text-white text-3xl md:text-5xl leading-tight">{torneoNombre || 'Torneos FEBIU'}</h1>
              {enJuegoF.length > 0 && <p className="mt-1 text-lg text-silver-light">Partidos en juego ahora</p>}
            </div>
            {TRANSMISION_PRESENTADA_POR && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold tracking-widest uppercase text-silver-dark">Transmisión presentada por</span>
                <div className="w-[320px] max-w-full h-16"><Logo a={TRANSMISION_PRESENTADA_POR} /></div>
              </div>
            )}
          </div>

          <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4">
            <div className={`${card} p-4 flex flex-col gap-3`}>
              <div className="flex flex-col gap-1">
                <label htmlFor="sel-torneo" className="text-xs font-semibold tracking-widest uppercase text-silver-dark">Ver partidos de</label>
                <select id="sel-torneo" className="input w-full min-h-[52px] text-base font-semibold" value={torneoSel ?? ''} onChange={e => setTorneoSel(e.target.value ? Number(e.target.value) : null)}>
                  {torneos.length === 0 && <option value="">Sin torneos activos</option>}
                  {torneos.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sel-cat" className="text-xs font-semibold tracking-widest uppercase text-silver-dark">Categoría</label>
                <select id="sel-cat" className="input w-full min-h-[52px] text-base font-semibold" value={catPartidos} onChange={e => setCatPartidos(e.target.value)}>
                  <option value="todas">Todas las categorías</option>
                  {CATEGORIAS.filter(c => c.key !== 'general').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className={`${card} p-4`}>
              <h2 className="font-display font-bold uppercase tracking-wide text-white text-2xl mb-1">Partidos en juego</h2>
              {enJuegoF.length === 0 ? <p className="text-silver-dark py-3">No hay partidos en juego en este momento.</p> : enJuegoF.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 py-3 border-t border-silver/10">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-wider uppercase text-silver-dark">Mesa {m.table?.number ?? '—'}</div>
                    <div className="font-semibold text-white">{nombre(m.playerA)} <span className="text-silver-dark">vs</span> {nombre(m.playerB)}</div>
                  </div>
                  <div className="font-mono font-semibold text-orange-light text-lg whitespace-nowrap">{m.result ? `${m.result.setsA} – ${m.result.setsB}` : 'vs'}</div>
                </div>
              ))}
            </div>

            <div className={`${card} p-4`}>
              <h2 className="font-display font-bold uppercase tracking-wide text-white text-2xl mb-1">Próximos partidos</h2>
              {proximosF.length === 0 ? <p className="text-silver-dark py-3">No hay partidos programados.</p> : proximosF.map(m => (
                <div key={m.id} className="py-3 border-t border-silver/10">
                  <div className="text-xs font-semibold tracking-wider uppercase text-silver-dark">{m.table?.number ? `Mesa ${m.table.number}` : (m.phase?.name ?? '')}</div>
                  <div className="font-semibold text-white">{nombre(m.playerA)} <span className="text-silver-dark">vs</span> {nombre(m.playerB)}</div>
                </div>
              ))}
            </div>

            <Link to="/publico" className="min-h-[52px] flex items-center justify-center rounded-xl border border-silver/35 text-white font-semibold">Ver todos los partidos y resultados</Link>
          </div>
        </div>
      </section>

      {/* Temporada */}
      <section id="temporada" aria-labelledby="temporada-t" className="max-w-6xl mx-auto px-4 pb-10 flex flex-col gap-5">
        <h2 id="temporada-t" className={H2}>La temporada</h2>
        <div className="flex flex-wrap gap-4">
          {[
            { estado: 'En juego ahora', activo: true, titulo: 'Departamentales', sub: 'Todos los departamentos, circuito por circuito' },
            { estado: 'Próximamente', activo: false, titulo: 'Nacionales', sub: 'Los mejores de cada departamento' },
            { estado: PANAMERICANO_PROXIMO, activo: false, titulo: 'Panamericano', sub: 'Billar de todo el continente' },
          ].map(c => (
            <div key={c.titulo} className={`${card} flex-1 basis-[260px] min-w-0 p-5 flex flex-col gap-2 items-start`}>
              <span className={`inline-flex items-center min-h-[28px] px-3 rounded-full text-xs font-bold tracking-wider uppercase ${c.activo ? 'bg-orange text-carbon' : 'border border-silver/40 text-silver-light'}`}>{c.estado}</span>
              <h3 className="font-display font-bold text-3xl text-white leading-tight">{c.titulo}</h3>
              <span className="text-silver">{c.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Ranking */}
      <section id="ranking" aria-labelledby="ranking-t" className="bg-[#0e0e0e] border-y border-silver/15">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-5">
          <div>
            <h2 id="ranking-t" className={H2}>Ranking acumulado</h2>
            <p className="text-silver-dark mt-1">{torneoNombre ? `${torneoNombre} · suma de los circuitos jugados` : 'Suma de los circuitos de la temporada'}</p>
          </div>
          <div role="group" aria-label="Categoría" className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIAS.map(c => (
              <button key={c.key} type="button" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}
                className={`flex-none min-h-[46px] px-5 rounded-full border font-semibold text-[15px] ${cat === c.key ? 'bg-orange border-orange text-carbon font-bold' : 'border-silver/30 text-silver-light'}`}>{c.label}</button>
            ))}
          </div>
          <div className={`${card} overflow-hidden`}>
            {!rankingCargado ? <div className="p-6"><LoadingSpinner /></div> : rankingF.length === 0 ? (
              <p className="text-silver-dark p-6">El ranking se publica al terminar cada circuito.</p>
            ) : (
              <>
                <div className="grid grid-cols-[44px_minmax(0,1fr)_64px] gap-3 px-4 py-3 bg-carbon-50 text-xs font-semibold tracking-widest uppercase text-silver-dark">
                  <span>Pos.</span><span>Jugador</span><span className="text-right">Puntos</span>
                </div>
                {rankingF.map((e, i) => (
                  <div key={e.id} className="grid grid-cols-[44px_minmax(0,1fr)_64px] gap-3 px-4 py-3 border-t border-silver/10 items-center">
                    <span className="font-display font-extrabold text-2xl text-orange-light">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-white truncate">{e.player?.lastName} {e.player?.firstName}</span>
                      {e.player?.club && <span className="block text-sm text-silver truncate">{e.player.club}</span>}
                    </span>
                    <span className="text-right font-mono font-semibold text-white">{e.points}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <Link to="/ranking-final" className="min-h-[52px] flex items-center justify-center rounded-xl border border-silver/35 text-white font-semibold sm:w-fit sm:px-8">Ver ranking completo</Link>
        </div>
      </section>

      {/* Videos */}
      {VIDEOS.length > 0 && (
        <section id="videos" aria-labelledby="videos-t" className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-5">
          <h2 id="videos-t" className={H2}>Videos</h2>
          <div className="flex flex-wrap gap-5">
            {VIDEOS.map(v => (
              <article key={v.youtubeId} className={`${card} flex-1 basis-[260px] min-w-0 overflow-hidden`}>
                <div className="relative aspect-video bg-black">
                  <iframe src={`https://www.youtube.com/embed/${v.youtubeId}`} title={v.titulo} className="absolute inset-0 w-full h-full" loading="lazy" allowFullScreen />
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold tracking-widest uppercase text-orange-light">{v.tipo}</span>
                  <h3 className="font-display font-bold text-2xl text-white leading-tight">{v.titulo}</h3>
                  {v.fecha && <span className="text-sm text-silver-dark">{v.fecha}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Notas */}
      {NOTAS.length > 0 && (
        <section id="notas" aria-labelledby="notas-t" className="max-w-6xl mx-auto px-4 pb-10 flex flex-col gap-5">
          <h2 id="notas-t" className={H2}>Notas y entrevistas</h2>
          <div className="flex flex-wrap gap-5">
            {NOTAS.map(n => (
              <article key={n.titulo} className={`${card} flex-1 basis-[300px] min-w-0 overflow-hidden`}>
                {n.imagen && <img src={n.imagen} alt="" className="w-full h-44 object-cover" />}
                <div className="p-5 flex flex-col gap-2">
                  <span className="text-xs font-semibold tracking-widest uppercase text-orange-light">{n.tipo}</span>
                  <h3 className="font-display font-bold text-2xl text-white leading-tight">{n.titulo}</h3>
                  {n.resumen && <p className="text-silver">{n.resumen}</p>}
                  <span className="text-sm text-silver-dark">{[n.fecha, n.autor].filter(Boolean).join(' · ')}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Auspiciantes */}
      {(hayAuspiciantes || hrefAuspiciar) && (
        <section aria-labelledby="ausp-t" className="bg-[#0e0e0e] border-t border-silver/15">
          <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-5">
            {hayAuspiciantes && <h2 id="ausp-t" className={H2}>Nos acompañan</h2>}
            {AUSPICIANTE_PRINCIPAL && <div className="w-full max-w-[520px] h-[200px] md:h-[220px] self-center"><Logo a={AUSPICIANTE_PRINCIPAL} /></div>}
            {AUSPICIANTES_OFICIALES.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AUSPICIANTES_OFICIALES.map(a => <div key={a.nombre} className="h-[100px]"><Logo a={a} /></div>)}
              </div>
            )}
            {hrefAuspiciar && (
              <div className={`${card} p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-carbon-50`}>
                <div>
                  <h3 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight">¿Querés que tu marca esté en el billar uruguayo?</h3>
                  <p className="text-silver mt-1">Paquetes por torneo y por temporada, con presencia en la web, en las transmisiones y en las imágenes de resultados.</p>
                </div>
                <a href={hrefAuspiciar} target="_blank" rel="noopener noreferrer" className="min-h-[52px] inline-flex items-center justify-center px-7 rounded-xl bg-orange text-carbon font-bold text-lg whitespace-nowrap">Quiero auspiciar</a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Mundial 2027 (al final) */}
      <section id="mundial" aria-labelledby="mundial-t" className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-carbon-50 border border-silver/15 rounded-3xl p-6 md:p-10 flex flex-col gap-3 items-start">
          <div aria-hidden="true" className="flex gap-2">
            <span className="w-4 h-4 rounded-full" style={{ background: '#e02a2a' }} />
            <span className="w-4 h-4 rounded-full" style={{ background: '#f2f2f2' }} />
            <span className="w-4 h-4 rounded-full" style={{ background: '#f2d41a' }} />
          </div>
          <span className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-light">Se viene · Uruguay, país sede</span>
          <h2 id="mundial-t" className="font-display font-extrabold uppercase text-white text-5xl md:text-7xl leading-[0.98]">Mundial de Billar 2027</h2>
          <p className="text-lg text-silver-light">{[MUNDIAL.fecha, MUNDIAL.sede].filter(Boolean).join(' · ')}</p>
          {hrefMundial && <a href={hrefMundial} target="_blank" rel="noopener noreferrer" className="mt-2 min-h-[52px] inline-flex items-center justify-center px-7 rounded-xl bg-orange text-carbon font-bold text-lg">Quiero ser sponsor del Mundial</a>}
        </div>
      </section>

      {/* Pie */}
      <footer className="bg-carbon-100 border-t border-silver/15">
        <div className="max-w-6xl mx-auto px-4 py-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-febiu.png" alt="" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="font-display font-extrabold uppercase text-white text-lg leading-tight">Federación de Billar del Uruguay</div>
              <div className="text-sm text-silver-dark">© 2026 · Todos los derechos reservados</div>
            </div>
          </div>
          <nav aria-label="Secundario" className="flex flex-wrap gap-1">
            <Link to="/publico" className={btnNav}>Partidos</Link>
            <Link to="/ranking-final" className={btnNav}>Rankings</Link>
            {CANAL_YOUTUBE_URL && <a href={CANAL_YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={btnNav}>YouTube</a>}
          </nav>
        </div>
      </footer>
    </div>
  );
}
