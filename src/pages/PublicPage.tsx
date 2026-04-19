import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner } from '../components/ui';

export default function PublicPage() {
  const [tables, setTables]           = useState<Table[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches]   = useState<Match[]>([]);
  const [loading, setLoading]         = useState(true);
  const [lastUpdate, setLastUpdate]   = useState(new Date());

  const fetchAll = () => {
    Promise.all([
      api.get('/tables'),
      api.get('/matches?status=en_juego'),
      api.get('/matches?status=asignado'),
      api.get('/matches?status=pendiente'),
      api.get('/matches?status=finalizado'),
    ]).then(([t, active, assigned, pending, finished]) => {
      setTables(t.data);
      setActiveMatches([...active.data, ...assigned.data]);
      setPendingMatches(pending.data.slice(0, 8));
      setRecentMatches(finished.data.slice(-5).reverse());
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

  return (
    <div className="min-h-screen bg-carbon-100">
      {/* Header */}
      <header className="bg-carbon-50 border-b border-silver-muted/10 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-5 h-5 rounded-full bg-white border border-silver-muted/30" />
              <div className="w-6 h-6 rounded-full bg-snooker-red border border-red-700" />
              <div className="w-5 h-5 rounded-full bg-snooker-yellow border border-yellow-600" />
            </div>
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
            <a href="/login" className="text-orange/70 text-xs hover:text-orange">Ingresar →</a>
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
              <div key={t.id}
                className={`rounded-xl p-2 text-center border transition-all ${
                  t.status === 'ocupada'  ? 'bg-orange/10 border-orange/30' :
                  t.status === 'libre'    ? 'bg-green-900/10 border-green-800/20' :
                  'bg-red-900/10 border-red-800/10 opacity-40'
                }`}
              >
                <p className="font-display text-2xl font-bold text-orange">{t.number}</p>
                <p className="text-xs text-silver-dark truncate">{t.venue?.name?.split(' ')[0]}</p>
                <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                  t.status === 'libre' ? 'bg-green-400' :
                  t.status === 'ocupada' ? 'bg-orange' : 'bg-red-500'
                }`} />
              </div>
            ))}
          </div>
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
                          <span className="font-mono text-silver font-bold shrink-0">
                            {m.result?.setsA}—{m.result?.setsB}
                          </span>
                          <p className={`text-sm font-semibold ${m.result?.winnerId === m.playerBId ? 'text-orange' : 'text-silver-dark'}`}>
                            {playerName(m.playerB)}
                          </p>
                        </div>
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

        <footer className="border-t border-silver-muted/10 pt-4 text-center text-silver-muted text-xs">
          Federación de Billar del Uruguay · Sistema de Torneos · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
