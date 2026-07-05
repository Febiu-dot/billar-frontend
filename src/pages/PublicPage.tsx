// PUBLIC_BUILD = pub-public-2026-07-05-sala-fecha-publica
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, LoadingSpinner } from '../components/ui';
import BracketNacional from '../components/BracketNacional';

// ── Sección Nacional ──────────────────────────────────────────────────

// Apócopes de país (mismo dict que backend/publicaciones)
const PAIS_APOCOPE: Record<string, string> = {
  Uruguay: 'URU', Argentina: 'ARG', Brasil: 'BRA', Paraguay: 'PAR',
  Chile: 'CHI', Bolivia: 'BOL', Peru: 'PER', Colombia: 'COL',
  Venezuela: 'VEN', Ecuador: 'ECU', Mexico: 'MEX', Espana: 'ESP',
};
const apocPais = (pais?: string | null): string =>
  pais ? (PAIS_APOCOPE[pais] ?? pais.slice(0, 3).toUpperCase()) : 'URU';

// Detecta si un match pertenece a un torneo Panamericano (por nombre del torneo).
const matchEsPana = (m: any): boolean =>
  /panamericano/i.test(m?.phase?.circuit?.tournament?.name ?? '');

// Nombre del jugador en la portada pública: agrega apócope de país solo en Panamericano.
function nombrePublico(jug: any, esPana: boolean) {
  const nombre = jug ? `${jug.firstName} ${jug.lastName}` : '—';
  if (esPana && jug?.pais) {
    return (
      <>
        {nombre} <span className="text-silver-dark font-mono text-xs">({apocPais(jug.pais)})</span>
      </>
    );
  }
  return nombre;
}

function SeccionNacional() {
  const [torneos, setTorneos]         = useState<any[]>([]);
  const [circuitId, setCircuitId]     = useState('');
  const [torneoNombre, setTorneoNombre] = useState('');
  const [torneoId, setTorneoId]       = useState<number | null>(null);
  const [series, setSeries]           = useState<any[] | null>(null);
  const [cruces, setCruces]           = useState<any | null>(null);
  const [ranking, setRanking]         = useState<any[] | null>(null);
  const [rankingFinal, setRankingFinal] = useState<any[] | null>(null);
  const [tab, setTab]                 = useState<'fixture'|'clasificados'|'cruces'|'ranking-final'|'bracket'>('fixture');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [errorSeries, setErrorSeries] = useState('');
  const [errorRanking, setErrorRanking] = useState('');
  const [errorCruces, setErrorCruces] = useState('');
  const [errorRankingFinal, setErrorRankingFinal] = useState('');
  const [bracket, setBracket]                     = useState<any | null>(null);
  const [errorBracket, setErrorBracket]            = useState('');

  useEffect(() => {
    api.get('/publicaciones/circuitos').then(r => {
      const nac = (r.data as any[]).filter(t =>
        t.active === true && (/nacional/i.test(t.name) || /panamericano/i.test(t.name))
      );
      setTorneos(nac);
    }).catch(() => {});
  }, []);

  const cargar = async (cid: string, tId: number) => {
    if (!cid) return;
    setLoading(true);
    setError('');
    setErrorSeries('');
    setErrorRanking('');
    setErrorCruces('');
    setErrorRankingFinal('');
    setErrorBracket('');
    setSeries(null);
    setRanking(null);
    setCruces(null);
    setRankingFinal(null);
    setBracket(null);
    try {
      const [serRes, rkRes, crucesRes, acumRes, brkRes] = await Promise.allSettled([
        api.get(`/publicaciones/${cid}/series-nacional`),
        api.get(`/publicaciones/${cid}/ranking`),
        api.get(`/publicaciones/${cid}/cruces-nacional`),
        api.get(`/acumulado/${tId}`),
        api.get(`/publicaciones/${cid}/bracket-nacional`),
      ]);
      if (serRes.status === 'fulfilled') {
        setSeries(serRes.value.data.series ?? []);
      } else {
        setErrorSeries((serRes.reason as any)?.response?.data?.error ?? 'No hay series para este circuito.');
        setSeries([]);
      }
      if (rkRes.status === 'fulfilled') {
        setRanking(rkRes.value.data.jugadores ?? []);
      } else {
        setErrorRanking((rkRes.reason as any)?.response?.data?.error ?? 'No hay ranking para este circuito.');
        setRanking([]);
      }
      if (crucesRes.status === 'fulfilled') {
        setCruces(crucesRes.value.data);
      } else {
        setErrorCruces('No hay cruces disponibles aún.');
        setCruces(null);
      }
      if (acumRes.status === 'fulfilled' && acumRes.value.data?.length > 0) {
        setRankingFinal(acumRes.value.data);
      } else {
        setErrorRankingFinal('No hay ranking final disponible aún.');
        setRankingFinal([]);
      }
      if (brkRes.status === 'fulfilled') {
        setBracket(brkRes.value.data);
      } else {
        setErrorBracket('No hay bracket disponible aún.');
        setBracket(null);
      }
    } catch (e: any) {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const circuitos = torneos.flatMap((t: any) =>
    (t.circuits ?? []).map((c: any) => ({ id: c.id, label: `${t.name} — ${c.name}`, torneoNombre: t.name, torneoId: t.id }))
  );

  const handleCircuit = (cid: string) => {
    setCircuitId(cid);
    const found = circuitos.find(c => String(c.id) === cid);
    setTorneoNombre(found?.torneoNombre ?? '');
    setTorneoId(found?.torneoId ?? null);
    if (found) cargar(cid, found.torneoId);
  };

  const CLASIFICA = 16;

  // Construir lista de partidos de cruces en orden
  const partidosCruces = (() => {
    if (!cruces) return [];
    const partidos: any[] = [];
    const etapas = [
      { key: 'octavos',  label: 'Octavos de Final', items: cruces.octavos ?? [] },
      { key: 'cuartos',  label: 'Cuartos de Final', items: cruces.cuartos ?? [] },
      { key: 'semis',    label: 'Semifinales',       items: cruces.semis ?? [cruces.semi1, cruces.semi2].filter(Boolean) },
      { key: 'final',    label: 'Final',             items: [cruces.final].filter(Boolean) },
    ];
    for (const etapa of etapas) {
      if (etapa.items.length > 0) partidos.push({ esEncabezado: true, label: etapa.label });
      for (const p of etapa.items) partidos.push({ esEncabezado: false, partido: p });
    }
    return partidos;
  })();

  const hayCruces = cruces && (cruces.octavos?.length > 0 || cruces.cuartos?.length > 0 || cruces.semis?.length > 0 || cruces.semi1 || cruces.final);
  const esPana = /panamericano/i.test(torneoNombre);

  return (
    <section>
      <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
        Series y Rankings por Torneo
      </h2>

      <div className="card mb-4">
        <select
          className="input w-full"
          value={circuitId}
          onChange={e => handleCircuit(e.target.value)}
        >
          <option value="">Seleccionar torneo y circuito...</option>
          {circuitos.map(c => (
            <option key={c.id} value={String(c.id)}>{c.label}</option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="card text-red-400 text-sm text-center py-6">{error}</div>}

      {!loading && circuitId && (series !== null || ranking !== null) && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setTab('fixture')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'fixture' ? 'bg-orange text-carbon-100' : 'bg-carbon-50 text-silver-dark hover:text-silver-light'}`}
            >
              🎱 Fixture de Series
            </button>
            <button
              onClick={() => setTab('clasificados')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'clasificados' ? 'bg-orange text-carbon-100' : 'bg-carbon-50 text-silver-dark hover:text-silver-light'}`}
            >
              📋 Clasificados
            </button>
            {hayCruces && (
              <button
                onClick={() => setTab('cruces')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'cruces' ? 'bg-orange text-carbon-100' : 'bg-carbon-50 text-silver-dark hover:text-silver-light'}`}
              >
                ⚔️ Cruces
              </button>
            )}
            {(rankingFinal && rankingFinal.length > 0) && (
              <button
                onClick={() => setTab('ranking-final')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'ranking-final' ? 'bg-orange text-carbon-100' : 'bg-carbon-50 text-silver-dark hover:text-silver-light'}`}
              >
                🏆 Ranking Final
              </button>
            )}
            {bracket && (bracket.cuartos?.length > 0 || bracket.semis?.length > 0 || bracket.final) && (
              <button
                onClick={() => setTab('bracket')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'bracket' ? 'bg-orange text-carbon-100' : 'bg-carbon-50 text-silver-dark hover:text-silver-light'}`}
              >
                🏟 Bracket
              </button>
            )}
          </div>

          {/* Fixture de Series */}
          {tab === 'fixture' && (
            errorSeries
              ? <div className="card text-silver-dark text-sm text-center py-8">{errorSeries}</div>
              : !series || series.length === 0
              ? <div className="card text-silver-dark text-sm text-center py-8">No hay series generadas aún.</div>
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {series.map((s: any) => (
                  <div key={s.serieId} className="card space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-orange font-bold uppercase tracking-wide text-sm">
                        Serie {s.numero}
                      </span>
                      {s.completa && (
                        <span className="text-xs text-green-400 font-semibold">✓ Completa</span>
                      )}
                    </div>
                    {s.p1 && <PartidoRow p={s.p1} label="P1" />}
                    {s.p2 && <PartidoRow p={s.p2} label="P2" />}
                    {s.p3 && <PartidoRow p={s.p3} label="P3 · Final" />}
                    {s.p4 && <PartidoRow p={s.p4} label="P4 · 3°/4°" />}
                    {s.p5 && <PartidoRow p={s.p5} label="P5 · 2°/3°" />}
                    {s.completa && (
                      <div className="border-t border-silver-muted/10 pt-2 space-y-1">
                        {[['🥇', s.primero], ['🥈', s.segundo], ['🥉', s.tercero], ['4°', s.cuarto]].map(([lbl, jug]: any) =>
                          jug ? (
                            <div key={lbl} className="flex items-center gap-2 text-xs">
                              <span className="w-6">{lbl}</span>
                              <span className="text-silver-light font-semibold">{jug.nombre}</span>
                              {esPana
                                ? <span className="text-silver-dark">{apocPais(jug.pais)}</span>
                                : (jug.club && <span className="text-silver-dark">{jug.club}</span>)}
                            </div>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
          )}

          {/* Clasificados */}
          {tab === 'clasificados' && (
            errorRanking
              ? <div className="card text-silver-dark text-sm text-center py-8">{errorRanking}</div>
              : !ranking || ranking.length === 0
              ? <div className="card text-silver-dark text-sm text-center py-8">No hay ranking disponible aún.</div>
              : <div className="card overflow-hidden p-0">
                <div className="px-4 py-3 border-b border-silver-muted/10 flex items-center justify-between">
                  <span className="font-display text-silver-light font-bold uppercase tracking-wide text-sm">
                    Ranking — {torneoNombre}
                  </span>
                  <span className="text-xs text-green-400 font-semibold bg-green-900/20 px-2 py-0.5 rounded-full">
                    Top {CLASIFICA} clasifican a cruces
                  </span>
                </div>
                <div className="divide-y divide-silver-muted/10">
                  {ranking.map((j: any) => {
                    const clasifica = j.posicion <= CLASIFICA;
                    return (
                      <div
                        key={j.posicion}
                        className={`flex items-center gap-3 px-4 py-2.5 ${clasifica ? 'bg-orange/5' : ''}`}
                      >
                        <div className={`w-8 h-7 rounded flex items-center justify-center text-sm font-bold shrink-0 ${
                          clasifica ? 'bg-orange text-carbon-100' : 'bg-silver-muted/20 text-silver-dark'
                        }`}>
                          {j.posicion}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${clasifica ? 'text-silver-light' : 'text-silver-dark'}`}>
                            {j.nombre}
                          </p>
                        </div>
                        {esPana
                          ? <span className="text-xs text-silver-dark shrink-0">{apocPais(j.pais)}</span>
                          : (j.club && (
                          <span className="text-xs text-silver-dark shrink-0">{j.club}</span>
                        ))}
                        <span className={`text-sm font-mono font-bold shrink-0 ${clasifica ? 'text-orange' : 'text-silver-dark'}`}>
                          {j.puntos} pts
                        </span>
                        {clasifica && (
                          <span className="text-green-400 text-xs shrink-0">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2 border-t border-silver-muted/10 text-xs text-silver-dark text-center">
                  ✓ = Clasifica a la Etapa de Cruces
                </div>
              </div>
          )}

          {/* Cruces */}
          {tab === 'cruces' && (
            errorCruces
              ? <div className="card text-silver-dark text-sm text-center py-8">{errorCruces}</div>
              : !hayCruces
              ? <div className="card text-silver-dark text-sm text-center py-8">No hay cruces generados aún.</div>
              : <div className="space-y-4">
                {partidosCruces.map((item: any, idx: number) =>
                  item.esEncabezado
                    ? (
                      <h3 key={idx} className="font-display text-sm font-bold text-orange uppercase tracking-wide pl-1 mt-2">
                        {item.label}
                      </h3>
                    )
                    : (
                      <PartidoRow key={idx} p={item.partido} label={`R${item.partido?.round ?? ''}`} />
                    )
                )}
                {cruces.campeon && (
                  <div className="card border border-orange/30 bg-orange/5 text-center py-4">
                    <p className="text-silver-dark text-xs uppercase tracking-widest mb-1">🏆 Campeón</p>
                    <p className="text-orange font-bold text-lg font-display">{cruces.campeon.nombre}</p>
                    {esPana
                      ? <p className="text-silver-dark text-sm">{apocPais(cruces.campeon.pais)}</p>
                      : (cruces.campeon.club && <p className="text-silver-dark text-sm">{cruces.campeon.club}</p>)}
                  </div>
                )}
              </div>
          )}

          {/* Ranking Final */}
          {tab === 'ranking-final' && (
            errorRankingFinal
              ? <div className="card text-silver-dark text-sm text-center py-8">{errorRankingFinal}</div>
              : !rankingFinal || rankingFinal.length === 0
              ? <div className="card text-silver-dark text-sm text-center py-8">No hay ranking final disponible aún.</div>
              : <div className="card overflow-hidden p-0">
                <div className="px-4 py-3 border-b border-silver-muted/10 flex items-center justify-between">
                  <span className="font-display text-silver-light font-bold uppercase tracking-wide text-sm">
                    Ranking Final — {torneoNombre}
                  </span>
                </div>
                <div className="divide-y divide-silver-muted/10">
                  {rankingFinal.map((e: any) => {
                    const pos = e.position ?? 0;
                    const top3 = pos <= 3;
                    return (
                      <div
                        key={e.id}
                        className={`flex items-center gap-3 px-4 py-2.5 ${top3 ? 'bg-orange/8' : ''}`}
                      >
                        <div className={`w-8 h-7 rounded flex items-center justify-center text-sm font-bold shrink-0 ${
                          top3 ? 'bg-orange text-carbon-100' : pos <= 16 ? 'bg-silver-muted/30 text-silver-light' : 'bg-silver-muted/10 text-silver-dark'
                        }`}>
                          {pos}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${pos <= 16 ? 'text-silver-light' : 'text-silver-dark'}`}>
                            {e.player?.lastName}, {e.player?.firstName}
                          </p>
                          {esPana
                            ? <p className="text-silver-dark text-xs truncate">{apocPais(e.player?.pais)}</p>
                            : (e.player?.club && (
                            <p className="text-silver-dark text-xs truncate">{e.player.club}</p>
                          ))}
                        </div>
                        <span className={`text-sm font-mono font-bold shrink-0 ${top3 ? 'text-orange' : pos <= 16 ? 'text-silver-light' : 'text-silver-dark'}`}>
                          {e.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
          )}

          {tab === 'bracket' && bracket && (
            <div className="mt-2">
              <BracketNacional data={bracket} sala={bracket.salaPublica ?? ''} fechaBracket={bracket.fechaPublica ?? ''} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PartidoRow({ p, label }: { p: any; label: string }) {
  if (!p) return null;
  const hayResultado = !!p.resultado;
  const [sA, sB] = hayResultado ? p.resultado.split('-').map(Number) : [null, null];
  const winA = hayResultado && sA! > sB!;
  const winB = hayResultado && sB! > sA!;

  return (
    <div className="bg-carbon-100 rounded-lg px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-silver-dark text-xs font-mono w-16 shrink-0">{label}</span>
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <span className={`text-xs font-semibold truncate ${winA ? 'text-orange' : 'text-silver-light'}`}>
            {p.jugadorA?.nombre ?? '—'}
          </span>
          {hayResultado ? (
            <span className="font-mono text-silver font-bold text-xs shrink-0 px-1">
              {p.resultado}
            </span>
          ) : (
            <span className="text-silver-muted text-xs px-1">vs</span>
          )}
          <span className={`text-xs font-semibold truncate ${winB ? 'text-orange' : 'text-silver-light'}`}>
            {p.jugadorB?.nombre ?? '—'}
          </span>
        </div>
        {p.hora && (
          <span className="text-silver-dark text-xs shrink-0 font-mono">🕐 {p.hora}</span>
        )}
      </div>
    </div>
  );
}

// ── Vista Pública Principal ───────────────────────────────────────────

export default function PublicPage() {
  const [tables, setTables]               = useState<Table[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches]   = useState<Match[]>([]);
  const [allMatches, setAllMatches]         = useState<Match[]>([]);
  const [loading, setLoading]               = useState(true);
  const [lastUpdate, setLastUpdate]         = useState(new Date());
  // Torneo elegido por el espectador para filtrar las 3 columnas. null = aún no eligió.
  const [torneoSel, setTorneoSel]           = useState<number | null>(null);

  const fetchAll = () => {
    Promise.all([
      api.get('/tables'),
      api.get('/matches?status=en_juego'),
      api.get('/matches?status=asignado'),
      api.get('/matches?status=pendiente'),
      api.get('/matches?status=finalizado'),
      api.get('/matches'),
    ]).then(([t, active, assigned, pending, finished, all]) => {
      const activeMerged = active.data; // solo en_juego
      setTables(t.data);
      setActiveMatches(activeMerged);
      // Pendientes (asignados + pendientes reales). El filtrado por torneo se hace
      // al renderizar, según el torneo que elija el espectador.
      setPendingMatches([...assigned.data, ...pending.data]);
      // Resultados finalizados, más recientes primero. Filtrado por torneo al renderizar.
      setRecentMatches([...finished.data].reverse());
      setAllMatches(all.data);
      setLastUpdate(new Date());
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAll();
    socket.emit('join:public');
    socket.on('match:updated', fetchAll);
    socket.on('table:updated', fetchAll);
    return () => { socket.off('match:updated', fetchAll); socket.off('table:updated', fetchAll); };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-carbon-100 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  // Torneos activos presentes en los partidos cargados (para el selector).
  // Se deriva de allMatches (todos los partidos, sin importar estado) para que
  // aparezca cualquier torneo active=true con al menos un partido, sin depender
  // del nombre ni del estado de los partidos.
  const torneosActivos: { id: number; name: string }[] = (() => {
    const map = new Map<number, string>();
    allMatches.forEach((m: any) => {
      const to = m?.phase?.circuit?.tournament;
      if (to && to.active === true) map.set(to.id, to.name);
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Filtro por torneo elegido. Si no eligió nada, las columnas quedan vacías.
  const porTorneo = (m: any) =>
    torneoSel != null && m?.phase?.circuit?.tournament?.id === torneoSel;
  const activosF   = torneoSel != null ? activeMatches.filter(porTorneo)  : [];
  const pendientesF = torneoSel != null ? pendingMatches.filter(porTorneo).slice(0, 8) : [];
  const recientesF  = torneoSel != null ? recentMatches.filter(porTorneo).slice(0, 5)  : [];
  const esPanaSel = torneoSel != null &&
    /panamericano/i.test(torneosActivos.find(t => t.id === torneoSel)?.name ?? '');

  // Mesas del torneo elegido. Se derivan de los partidos (cualquier estado) que
  // pertenecen al torneo: una mesa entra si tiene al menos un partido de ese torneo.
  // Así no dependemos de un venueId fijo: para el Panamericano quedan las 6 de Willy.
  const mesasTorneo: Table[] = (() => {
    if (torneoSel == null) return [];
    const idsMesa: Set<number> = new Set();
    allMatches.forEach((m: any) => {
      if (m?.tableId != null && m?.phase?.circuit?.tournament?.id === torneoSel) {
        idsMesa.add(m.tableId);
      }
    });
    return tables
      .filter(t => idsMesa.has(t.id))
      .sort((a, b) => a.number - b.number);
  })();

  // Match en juego por mesa (para mostrar el partido en la propia tarjeta).
  const matchEnMesaDe = (tableId: number): Match | null =>
    activeMatches.find(m => m.tableId === tableId) ?? null;

  return (
    <div className="min-h-screen bg-carbon-100">
      {/* Header */}
      <header className="bg-carbon-50 border-b border-silver-muted/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-febiu.png" alt="FEBIU" className="w-10 h-10 rounded-full object-cover border border-silver-muted/20" />
            <div>
              <h1 className="font-display text-xl font-bold text-silver-light uppercase tracking-wide leading-tight">
                Federación de Billar del Uruguay
              </h1>
              <p className="text-silver-dark text-xs tracking-widest uppercase">Sistema de Torneos</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
              En vivo
            </div>
            <p className="text-silver-dark text-xs font-mono">{lastUpdate.toLocaleTimeString('es-UY')}</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* Selector de torneo */}
        <section>
          <label className="block font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
            Elegí un Torneo
          </label>
          <select
            className="input w-full"
            value={torneoSel ?? ''}
            onChange={e => setTorneoSel(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Seleccionar torneo…</option>
            {torneosActivos.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {torneoSel == null && (
            <p className="text-silver-dark text-sm mt-2 pl-3">
              Elegí un torneo arriba para ver los partidos en curso, próximos y resultados.
            </p>
          )}
        </section>

        {/* Estado de mesas */}
        <section>
          <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
            Estado de Mesas
            {mesasTorneo.length > 0 && <span className="ml-3 text-orange">({mesasTorneo.length})</span>}
          </h2>

          {torneoSel == null ? (
            <div className="card text-silver-dark text-sm text-center py-8">
              Elegí un torneo arriba para ver las mesas en juego.
            </div>
          ) : mesasTorneo.length === 0 ? (
            <div className="card text-silver-dark text-sm text-center py-8">
              Este torneo no tiene mesas asignadas todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mesasTorneo.map(t => {
                const m = matchEnMesaDe(t.id);
                const ocupada = t.status === 'ocupada' && m != null;
                const fuera   = t.status === 'fuera_de_servicio';
                const esPana  = m ? matchEsPana(m) : false;
                const r: any  = (m as any)?.result;
                return (
                  <button
                    key={t.id}
                    className={`rounded-xl border text-left w-full overflow-hidden transition-all ${
                      ocupada
                        ? 'bg-orange/5 border-orange/30 cursor-default'
                        : fuera
                        ? 'bg-red-900/10 border-red-800/20 opacity-50 cursor-default'
                        : 'bg-green-900/5 border-green-800/20 cursor-default'
                    }`}
                  >
                    {/* Barra superior: mesa + sede + estado */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-silver-muted/10">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-2xl font-bold text-orange leading-none">{t.number}</span>
                        <span className="text-xs text-silver-dark truncate">{t.venue?.name}</span>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide ${
                        ocupada ? 'text-orange' : fuera ? 'text-red-400' : 'text-green-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          ocupada ? 'bg-orange animate-pulse' : fuera ? 'bg-red-500' : 'bg-green-400'
                        }`} />
                        {ocupada ? 'En juego' : fuera ? 'Fuera de servicio' : 'Libre'}
                      </span>
                    </div>

                    {/* Cuerpo */}
                    {ocupada && m ? (
                      <div className="px-3 py-3">
                        {/* Torneo · categoría */}
                        <p className="text-xs text-silver-dark font-mono mb-2 truncate">
                          {m.phase?.circuit?.tournament?.name} · {m.phase?.name}
                        </p>
                        {/* Jugadores + marcador */}
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <p className="font-semibold text-silver-light text-sm leading-tight">
                            {nombrePublico(m.playerA, esPana)}
                          </p>
                          <div className="flex flex-col items-center px-1">
                            <span className="font-mono text-orange font-bold text-2xl leading-none">
                              {r ? `${r.setsA}—${r.setsB}` : '0—0'}
                            </span>
                            {m.sets && m.sets.length > 0 && (
                              <div className="flex flex-col items-center gap-0.5 mt-1">
                                {m.sets.map((s: any, i: number) => (
                                  <span key={i} className="text-[10px] font-mono">
                                    <span className={s.pointsA > s.pointsB ? 'text-orange font-bold' : 'text-silver-dark'}>{s.pointsA}</span>
                                    <span className="text-silver-dark mx-0.5">—</span>
                                    <span className={s.pointsB > s.pointsA ? 'text-orange font-bold' : 'text-silver-dark'}>{s.pointsB}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="font-semibold text-silver-light text-sm leading-tight text-right">
                            {nombrePublico(m.playerB, esPana)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-center text-silver-dark text-sm">
                        {fuera ? 'Mesa fuera de servicio' : 'Mesa disponible'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Partidos en curso */}
        <section>
          <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
            Partidos en Curso
            {activosF.length > 0 && <span className="ml-3 text-orange">({activosF.length})</span>}
          </h2>
          {activosF.length === 0 ? (
            <div className="card text-silver-dark text-sm text-center py-10">Sin partidos activos</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activosF.map(m => (
                <div key={m.id} className={`card ${m.status === 'en_juego' ? 'border-orange/30' : 'border-blue-700/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-silver-dark font-mono">Mesa {m.table?.number} — {m.table?.venue?.name}</span>
                    <MatchStatusBadge status={m.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-semibold text-silver-light text-sm">{m.playerA?.firstName}</p>
                      <p className="text-silver-dark text-xs">{m.playerA?.lastName}</p>
                      {esPanaSel && <p className="text-silver-dark text-xs font-mono">{apocPais((m.playerA as any)?.pais)}</p>}
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      {m.result ? (
                        <>
                          <span className="font-mono text-orange font-bold text-3xl">{m.result.setsA}—{m.result.setsB}</span>
                          <span className="text-silver-dark text-xs font-mono">{m.result.pointsA}—{m.result.pointsB}</span>
                        </>
                      ) : (
                        <span className="text-silver-muted font-mono text-lg">vs</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-silver-light text-sm">{m.playerB?.firstName}</p>
                      <p className="text-silver-dark text-xs">{m.playerB?.lastName}</p>
                      {esPanaSel && <p className="text-silver-dark text-xs font-mono">{apocPais((m.playerB as any)?.pais)}</p>}
                    </div>
                  </div>
                  {m.sets && m.sets.length > 0 && (
                    <div className="mt-3 border-t border-silver-muted/10 pt-2 space-y-1">
                      {m.sets.map(s => (
                        <div key={s.setNumber} className="flex items-center gap-2 font-mono text-xs justify-center">
                          <span className="text-silver-dark w-6">S{s.setNumber}</span>
                          <span className={s.pointsA > s.pointsB ? 'text-orange font-bold' : 'text-silver-dark'}>{s.pointsA}</span>
                          <span className="text-silver-muted">—</span>
                          <span className={s.pointsB > s.pointsA ? 'text-orange font-bold' : 'text-silver-dark'}>{s.pointsB}</span>
                          {s.pointsA > s.pointsB ? <span className="text-orange">← ✓</span> : <span className="text-orange">✓ →</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-silver-dark text-xs text-center mt-2 font-mono">{m.phase?.name} · Ronda {m.round}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Próximos partidos */}
          <section>
            <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
              Próximos Partidos
            </h2>
            {pendientesF.length === 0 ? (
              <div className="card text-silver-dark text-sm text-center py-8">Sin partidos pendientes</div>
            ) : (
              <div className="space-y-2">
                {pendientesF.map(m => (
                  <div key={m.id} className="card py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-silver-light text-sm font-medium truncate">
                          {nombrePublico(m.playerA, esPanaSel)} <span className="text-silver-dark">vs</span> {nombrePublico(m.playerB, esPanaSel)}
                        </p>
                        <p className="text-silver-dark text-xs font-mono">{m.phase?.name} · R{m.round}</p>
                      </div>
                      <span className="badge-status bg-silver-muted/10 text-silver-dark shrink-0">Pendiente</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Últimos resultados */}
          <section>
            <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
              Últimos Resultados
            </h2>
            {recientesF.length === 0 ? (
              <div className="card text-silver-dark text-sm text-center py-8">Sin resultados aún</div>
            ) : (
              <div className="space-y-2">
                {recientesF.map(m => (
                  <div key={m.id} className="card py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${m.result?.winnerId === m.playerAId ? 'text-orange' : 'text-silver-dark'}`}>
                            {nombrePublico(m.playerA, esPanaSel)}
                          </p>
                          <span className="font-mono text-silver font-bold shrink-0">{m.result?.setsA}—{m.result?.setsB}</span>
                          <p className={`text-sm font-semibold ${m.result?.winnerId === m.playerBId ? 'text-orange' : 'text-silver-dark'}`}>
                            {nombrePublico(m.playerB, esPanaSel)}
                          </p>
                        </div>
                        {m.sets && m.sets.length > 0 && (
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {m.sets.map(s => (
                              <span key={s.setNumber} className="font-mono text-xs text-silver-dark">
                                S{s.setNumber}: <span className={s.pointsA > s.pointsB ? 'text-orange' : ''}>{s.pointsA}</span>
                                —<span className={s.pointsB > s.pointsA ? 'text-orange' : ''}>{s.pointsB}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-silver-dark text-xs font-mono">
                          {m.phase?.name}
                          {m.result?.isWO && <span className="ml-2 text-red-400">W.O.</span>}
                        </p>
                      </div>
                      <span className="badge-status bg-silver-muted/10 text-green-400 shrink-0">✓</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sección Nacional */}
        <SeccionNacional />

        <footer className="border-t border-silver-muted/10 pt-4 text-center text-silver-muted text-xs">
          Federación de Billar del Uruguay · Sistema de Torneos · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

