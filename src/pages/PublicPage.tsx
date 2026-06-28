import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner } from '../components/ui';

// ── Sección Nacional ──────────────────────────────────────────────────

// Apócopes de país (mismo dict que backend/publicaciones)
const PAIS_APOCOPE: Record<string, string> = {
  Uruguay: 'URU', Argentina: 'ARG', Brasil: 'BRA', Paraguay: 'PAR',
  Chile: 'CHI', Bolivia: 'BOL', Peru: 'PER', Colombia: 'COL',
  Venezuela: 'VEN', Ecuador: 'ECU', Mexico: 'MEX', Espana: 'ESP',
};
const apocPais = (pais?: string | null): string =>
  pais ? (PAIS_APOCOPE[pais] ?? pais.slice(0, 3).toUpperCase()) : 'URU';

function SeccionNacional() {
  const [torneos, setTorneos]         = useState<any[]>([]);
  const [circuitId, setCircuitId]     = useState('');
  const [torneoNombre, setTorneoNombre] = useState('');
  const [torneoId, setTorneoId]       = useState<number | null>(null);
  const [series, setSeries]           = useState<any[] | null>(null);
  const [cruces, setCruces]           = useState<any | null>(null);
  const [ranking, setRanking]         = useState<any[] | null>(null);
  const [rankingFinal, setRankingFinal] = useState<any[] | null>(null);
  const [tab, setTab]                 = useState<'fixture'|'clasificados'|'cruces'|'ranking-final'>('fixture');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [errorSeries, setErrorSeries] = useState('');
  const [errorRanking, setErrorRanking] = useState('');
  const [errorCruces, setErrorCruces] = useState('');
  const [errorRankingFinal, setErrorRankingFinal] = useState('');

  useEffect(() => {
    api.get('/publicaciones/circuitos').then(r => {
      const nac = (r.data as any[]).filter(t => /nacional/i.test(t.name) || /panamericano/i.test(t.name));
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
    setSeries(null);
    setRanking(null);
    setCruces(null);
    setRankingFinal(null);
    try {
      const [serRes, rkRes, crucesRes, acumRes] = await Promise.allSettled([
        api.get(`/publicaciones/${cid}/series-nacional`),
        api.get(`/publicaciones/${cid}/ranking`),
        api.get(`/publicaciones/${cid}/cruces-nacional`),
        api.get(`/acumulado/${tId}`),
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
      { key: 'semis',    label: 'Semifinales',       items: [cruces.semi1, cruces.semi2].filter(Boolean) },
      { key: 'final',    label: 'Final',             items: [cruces.final].filter(Boolean) },
    ];
    for (const etapa of etapas) {
      if (etapa.items.length > 0) partidos.push({ esEncabezado: true, label: etapa.label });
      for (const p of etapa.items) partidos.push({ esEncabezado: false, partido: p });
    }
    return partidos;
  })();

  const hayCruces = cruces && (cruces.octavos?.length > 0 || cruces.cuartos?.length > 0 || cruces.semi1 || cruces.final);
  const esPana = /panamericano/i.test(torneoNombre);

  return (
    <section>
      <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
        Torneo Nacional
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
  const [mesaModal, setMesaModal]           = useState<{ table: Table; match: Match | null; serieMatches: Match[] } | null>(null);

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
      // Asignados van a pendientes, junto con los pendientes reales
      const pendientesMerged = [...assigned.data, ...pending.data];
      setPendingMatches(pendientesMerged.slice(0, 8));
      // Detectar circuito activo por los partidos en juego/asignados
      const circuitoActivo: number | null = activeMerged.length > 0
        ? (activeMerged[0] as any)?.phase?.circuitId ?? null
        : (assigned.data[0] as any)?.phase?.circuitId ?? null;
      const finalizadosFiltrados = circuitoActivo
        ? finished.data.filter((m: any) => m.phase?.circuitId === circuitoActivo)
        : finished.data;
      setRecentMatches(finalizadosFiltrados.slice(-5).reverse());
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

  const handleMesaClick = (table: Table) => {
    if (table.status !== 'ocupada') return;
    const matchEnMesa = activeMatches.find(m => m.tableId === table.id) ?? null;
    let serieMatches: Match[] = [];
    if (matchEnMesa?.serieId) {
      serieMatches = allMatches.filter(m =>
        (m as any).serieId === (matchEnMesa as any).serieId &&
        m.id !== matchEnMesa.id &&
        (m.status === 'finalizado' || m.status === 'wo')
      ).sort((a, b) => a.round - b.round);
    }
    setMesaModal({ table, match: matchEnMesa, serieMatches });
  };

  if (loading) return (
    <div className="min-h-screen bg-carbon-100 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

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

        {/* Estado de mesas */}
        <section>
          <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
            Estado de Mesas
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {tables.map(t => (
              <button
                key={t.id}
                onClick={() => handleMesaClick(t)}
                className={`rounded-xl p-2 text-center border transition-all w-full ${
                  t.status === 'ocupada'
                    ? 'bg-orange/10 border-orange/30 cursor-pointer hover:bg-orange/20 hover:scale-105'
                    : t.status === 'libre'
                    ? 'bg-green-900/10 border-green-800/20 cursor-default'
                    : 'bg-red-900/10 border-red-800/10 opacity-40 cursor-default'
                }`}
              >
                <p className="font-display text-2xl font-bold text-orange">{t.number}</p>
                <p className="text-xs text-silver-dark truncate">{t.venue?.name?.split(' ')[0]}</p>
                <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                  t.status === 'libre' ? 'bg-green-400' :
                  t.status === 'ocupada' ? 'bg-orange' : 'bg-red-500'
                }`} />
              </button>
            ))}
          </div>
          <p className="text-silver-dark text-xs mt-2 text-center">Tocá una mesa ocupada para ver el partido en curso</p>
        </section>

        {/* Partidos en curso */}
        <section>
          <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
            Partidos en Curso
            {activeMatches.length > 0 && <span className="ml-3 text-orange">({activeMatches.length})</span>}
          </h2>
          {activeMatches.length === 0 ? (
            <div className="card text-silver-dark text-sm text-center py-10">Sin partidos activos</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeMatches.map(m => (
                <div key={m.id} className={`card ${m.status === 'en_juego' ? 'border-orange/30' : 'border-blue-700/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-silver-dark font-mono">Mesa {m.table?.number} — {m.table?.venue?.name}</span>
                    <MatchStatusBadge status={m.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-semibold text-silver-light text-sm">{m.playerA?.firstName}</p>
                      <p className="text-silver-dark text-xs">{m.playerA?.lastName}</p>
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
            {pendingMatches.length === 0 ? (
              <div className="card text-silver-dark text-sm text-center py-8">Sin partidos pendientes</div>
            ) : (
              <div className="space-y-2">
                {pendingMatches.map(m => (
                  <div key={m.id} className="card py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-silver-light text-sm font-medium truncate">
                          {playerName(m.playerA)} <span className="text-silver-dark">vs</span> {playerName(m.playerB)}
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
            {recentMatches.length === 0 ? (
              <div className="card text-silver-dark text-sm text-center py-8">Sin resultados aún</div>
            ) : (
              <div className="space-y-2">
                {recentMatches.map(m => (
                  <div key={m.id} className="card py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${m.result?.winnerId === m.playerAId ? 'text-orange' : 'text-silver-dark'}`}>
                            {playerName(m.playerA)}
                          </p>
                          <span className="font-mono text-silver font-bold shrink-0">{m.result?.setsA}—{m.result?.setsB}</span>
                          <p className={`text-sm font-semibold ${m.result?.winnerId === m.playerBId ? 'text-orange' : 'text-silver-dark'}`}>
                            {playerName(m.playerB)}
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

      {/* Modal mesa */}
      {mesaModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setMesaModal(null)}>
          <div className="bg-carbon-50 border border-silver-muted/20 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-orange uppercase">
                Mesa {mesaModal.table.number} — {mesaModal.table.venue?.name}
              </h3>
              <button onClick={() => setMesaModal(null)} className="text-silver-dark hover:text-silver-light text-xl">✕</button>
            </div>

            {mesaModal.match ? (
              <>
                <div className="bg-carbon-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <MatchStatusBadge status={mesaModal.match.status} />
                    <span className="text-silver-dark text-xs font-mono">{mesaModal.match.phase?.name} · P{mesaModal.match.round % 10 === 0 ? 10 : mesaModal.match.round % 10}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-3">
                    <div>
                      <p className="font-semibold text-silver-light">{mesaModal.match.playerA?.firstName}</p>
                      <p className="text-silver-dark text-xs">{mesaModal.match.playerA?.lastName}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      {mesaModal.match.result ? (
                        <>
                          <span className="font-mono text-orange font-bold text-4xl">{mesaModal.match.result.setsA}—{mesaModal.match.result.setsB}</span>
                          <span className="text-silver-dark text-xs font-mono mt-1">{mesaModal.match.result.pointsA} — {mesaModal.match.result.pointsB} pts</span>
                        </>
                      ) : (
                        <span className="text-silver-muted font-mono text-2xl">vs</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-silver-light">{mesaModal.match.playerB?.firstName}</p>
                      <p className="text-silver-dark text-xs">{mesaModal.match.playerB?.lastName}</p>
                    </div>
                  </div>
                  {mesaModal.match.sets && mesaModal.match.sets.length > 0 && (
                    <div className="mt-3 border-t border-silver-muted/10 pt-3 space-y-1">
                      <p className="text-silver-dark text-xs uppercase tracking-widest mb-2">Sets</p>
                      {mesaModal.match.sets.map(s => (
                        <div key={s.setNumber} className="flex items-center justify-center gap-3 font-mono text-sm">
                          <span className="text-silver-dark w-8">S{s.setNumber}</span>
                          <span className={s.pointsA > s.pointsB ? 'text-orange font-bold' : 'text-silver-dark'}>{s.pointsA}</span>
                          <span className="text-silver-muted">—</span>
                          <span className={s.pointsB > s.pointsA ? 'text-orange font-bold' : 'text-silver-dark'}>{s.pointsB}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {mesaModal.serieMatches.length > 0 && (
                  <div>
                    <p className="text-silver-dark text-xs uppercase tracking-widest mb-2">Partidos anteriores de la serie</p>
                    <div className="space-y-2">
                      {mesaModal.serieMatches.map(m => (
                        <div key={m.id} className="bg-carbon-100 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-silver-dark text-xs font-mono">P{m.round % 10 === 0 ? 10 : m.round % 10}</span>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={m.result?.winnerId === m.playerAId ? 'text-orange font-semibold' : 'text-silver-dark'}>
                                {m.playerA?.firstName} {m.playerA?.lastName}
                              </span>
                              <span className="font-mono text-silver font-bold">{m.result?.setsA}—{m.result?.setsB}</span>
                              <span className={m.result?.winnerId === m.playerBId ? 'text-orange font-semibold' : 'text-silver-dark'}>
                                {m.playerB?.firstName} {m.playerB?.lastName}
                              </span>
                            </div>
                            {m.result?.isWO && <span className="text-red-400 text-xs">W.O.</span>}
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-silver-dark text-center py-4">No hay partido activo en esta mesa</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

