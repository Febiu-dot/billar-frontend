import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner } from '../components/ui';

// ── Sección Nacional ──────────────────────────────────────────────────

function SeccionNacional() {
  const [torneos, setTorneos]         = useState<any[]>([]);
  const [circuitId, setCircuitId]     = useState('');
  const [torneoNombre, setTorneoNombre] = useState('');
  const [series, setSeries]           = useState<any[] | null>(null);
  const [ranking, setRanking]         = useState<any[] | null>(null);
  const [tab, setTab]                 = useState<'fixture'|'clasificados'>('fixture');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    api.get('/publicaciones/circuitos').then(r => {
      // Solo torneos nacionales
      const nac = (r.data as any[]).filter(t =>
        /nacional/i.test(t.name)
      );
      setTorneos(nac);
    }).catch(() => {});
  }, []);

  const cargar = async (cid: string) => {
    if (!cid) return;
    setLoading(true); setError(''); setSeries(null); setRanking(null);
    try {
      const [serRes, rkRes] = await Promise.allSettled([
        api.get(`/publicaciones/${cid}/series-nacional`),
        api.get(`/publicaciones/${cid}/ranking`),
      ]);
      if (serRes.status === 'fulfilled') setSeries(serRes.value.data.series ?? []);
      if (rkRes.status  === 'fulfilled') setRanking(rkRes.value.data.jugadores ?? []);
      if (serRes.status === 'rejected' && rkRes.status === 'rejected')
        setError('No hay datos disponibles para este circuito aún.');
    } catch { setError('Error al cargar datos.'); }
    finally { setLoading(false); }
  };

  const circuitos = torneos.flatMap((t: any) =>
    (t.circuits ?? []).map((c: any) => ({ id: c.id, label: `${t.name} — ${c.name}`, torneoNombre: t.name }))
  );

  const handleCircuit = (cid: string) => {
    setCircuitId(cid);
    const found = circuitos.find(c => String(c.id) === cid);
    setTorneoNombre(found?.torneoNombre ?? '');
    cargar(cid);
  };

  const CLASIFICA = 16;

  return (
    <section>
      <h2 className="font-display text-lg font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
        Torneo Nacional
      </h2>

      {/* Selector */}
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

      {!loading && (series || ranking) && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
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
              🏆 Clasificados
            </button>
          </div>

          {/* FIXTURE DE SERIES */}
          {tab === 'fixture' && series && (
            series.length === 0
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

                    {/* P1 */}
                    {s.p1 && <PartidoRow p={s.p1} label="P1" />}
                    {/* P2 */}
                    {s.p2 && <PartidoRow p={s.p2} label="P2" />}
                    {/* P3 si existe */}
                    {s.p3 && <PartidoRow p={s.p3} label="P3 · Final" />}
                    {/* P4 si existe */}
                    {s.p4 && <PartidoRow p={s.p4} label="P4 · 3°/4°" />}
                    {/* P5 si existe */}
                    {s.p5 && <PartidoRow p={s.p5} label="P5 · 2°/3°" />}

                    {/* Clasificación final */}
                    {s.completa && (
                      <div className="border-t border-silver-muted/10 pt-2 space-y-1">
                        {[['🥇', s.primero], ['🥈', s.segundo], ['🥉', s.tercero], ['4°', s.cuarto]].map(([lbl, jug]: any) =>
                          jug ? (
                            <div key={lbl} className="flex items-center gap-2 text-xs">
                              <span className="w-6">{lbl}</span>
                              <span className="text-silver-light font-semibold">{jug.nombre}</span>
                              {jug.club && <span className="text-silver-dark">{jug.club}</span>}
                            </div>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
          )}

          {/* CLASIFICADOS */}
          {tab === 'clasificados' && ranking && (
            ranking.length === 0
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
                        {j.club && (
                          <span className="text-xs text-silver-dark shrink-0">{j.club}</span>
                        )}
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
      setTables(t.data);
      setActiveMatches([...active.data, ...assigned.data]);
      setPendingMatches(pending.data.slice(0, 8));
      setRecentMatches(finished.data.slice(-5).reverse());
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
            <div className="flex flex-col items-end gap-1">
              <a href="/ranking" className="text-gold text-xs hover:text-gold/80 font-medium">🏆 Ver Ranking</a>
              <a href="/ranking-final" className="text-gold text-xs hover:text-gold/80 font-medium">🥇 Ranking Final</a>
              <a href="/publicaciones" className="text-gold text-xs hover:text-gold/80 font-medium">📢 Publicaciones</a>
              <a href="/login" className="text-orange/70 text-xs hover:text-orange">Ingresar →</a>
            </div>
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
