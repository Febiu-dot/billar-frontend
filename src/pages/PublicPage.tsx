import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner } from '../components/ui';

export default function PublicPage() {
  const [tables, setTables]     = useState<Table[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches]   = useState<Match[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

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
    return () => {
      socket.off('match:updated', fetchAll);
      socket.off('table:updated', fetchAll);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="min-h-screen bg-felt-dark">
      {/* Header */}
      <header className="bg-felt border-b border-felt-light/20 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-gold leading-none">BILLAR</h1>
            <p className="text-chalk/40 text-xs tracking-widest uppercase">Vista Pública del Torneo</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
              En vivo
            </div>
            <p className="text-chalk/30 text-xs font-mono">
              {lastUpdate.toLocaleTimeString('es-UY')}
            </p>
            <a href="/login" className="text-gold/60 text-xs hover:text-gold">Ingresar →</a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* Tables overview */}
        <section>
          <h2 className="font-display text-2xl text-chalk/70 mb-3 uppercase tracking-wide">Estado de Mesas</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {tables.map(t => (
              <div
                key={t.id}
                className={`rounded-lg p-2 text-center border transition-all ${
                  t.status === 'ocupada'
                    ? 'bg-gold/10 border-gold/40'
                    : t.status === 'libre'
                    ? 'bg-green-900/20 border-green-700/30'
                    : 'bg-red-900/10 border-red-800/20 opacity-40'
                }`}
              >
                <p className="font-display text-2xl text-gold">{t.number}</p>
                <p className="text-xs text-chalk/30 truncate">{t.venue?.name?.split(' ')[0]}</p>
                <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                  t.status === 'libre' ? 'bg-green-400' :
                  t.status === 'ocupada' ? 'bg-gold' : 'bg-red-500'
                }`} />
              </div>
            ))}
          </div>
        </section>

        {/* Active / In-play matches */}
        <section>
          <h2 className="font-display text-2xl text-chalk/70 mb-3 uppercase tracking-wide">
            ⚔️ Partidos en Curso
            {activeMatches.length > 0 && (
              <span className="ml-3 text-gold text-xl">({activeMatches.length})</span>
            )}
          </h2>
          {activeMatches.length === 0 ? (
            <div className="card text-chalk/30 text-sm text-center py-10">Sin partidos activos en este momento</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeMatches.map(m => (
                <div key={m.id} className={`card ${m.status === 'en_juego' ? 'border-gold/40 bg-gold/3' : 'border-blue-700/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-chalk/40 font-mono">
                      Mesa {m.table?.number} — {m.table?.venue?.name}
                    </span>
                    <MatchStatusBadge status={m.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-semibold text-chalk text-sm">{m.playerA?.firstName}</p>
                      <p className="text-chalk/40 text-xs">{m.playerA?.lastName}</p>
                      {m.playerA?.category && (
                        <p className="text-chalk/25 text-xs capitalize">{m.playerA.category.name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      {m.result ? (
                        <>
                          <span className="font-mono text-gold font-bold text-3xl">
                            {m.result.setsA}—{m.result.setsB}
                          </span>
                          <span className="text-chalk/25 text-xs font-mono">
                            {m.result.pointsA}—{m.result.pointsB}
                          </span>
                        </>
                      ) : (
                        <span className="text-chalk/20 text-lg font-mono">vs</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-chalk text-sm">{m.playerB?.firstName}</p>
                      <p className="text-chalk/40 text-xs">{m.playerB?.lastName}</p>
                      {m.playerB?.category && (
                        <p className="text-chalk/25 text-xs capitalize">{m.playerB.category.name}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-chalk/25 text-xs text-center mt-2 font-mono">
                    {m.phase?.name} · Ronda {m.round}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Next matches */}
          <section>
            <h2 className="font-display text-2xl text-chalk/70 mb-3 uppercase tracking-wide">Próximos Partidos</h2>
            {pendingMatches.length === 0 ? (
              <div className="card text-chalk/30 text-sm text-center py-8">Sin partidos pendientes</div>
            ) : (
              <div className="space-y-2">
                {pendingMatches.map(m => (
                  <div key={m.id} className="card py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-chalk text-sm font-medium truncate">
                          {playerName(m.playerA)} <span className="text-chalk/30">vs</span> {playerName(m.playerB)}
                        </p>
                        <p className="text-chalk/30 text-xs font-mono">{m.phase?.name} · R{m.round}</p>
                      </div>
                      <span className="badge-status bg-chalk/10 text-chalk/50 text-xs shrink-0">Pendiente</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent results */}
          <section>
            <h2 className="font-display text-2xl text-chalk/70 mb-3 uppercase tracking-wide">Últimos Resultados</h2>
            {recentMatches.length === 0 ? (
              <div className="card text-chalk/30 text-sm text-center py-8">Sin resultados aún</div>
            ) : (
              <div className="space-y-2">
                {recentMatches.map(m => (
                  <div key={m.id} className="card py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${m.result?.winnerId === m.playerAId ? 'text-gold' : 'text-chalk/50'}`}>
                            {playerName(m.playerA)}
                          </p>
                          <span className="font-mono text-chalk/60 font-bold shrink-0">
                            {m.result?.setsA}—{m.result?.setsB}
                          </span>
                          <p className={`text-sm font-semibold ${m.result?.winnerId === m.playerBId ? 'text-gold' : 'text-chalk/50'}`}>
                            {playerName(m.playerB)}
                          </p>
                        </div>
                        <p className="text-chalk/25 text-xs font-mono">
                          {m.phase?.name}
                          {m.result?.isWO && <span className="ml-2 text-red-400">W.O.</span>}
                        </p>
                      </div>
                      <span className="badge-status bg-felt-light/30 text-green-400 text-xs shrink-0">✓</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-felt-light/20 pt-4 text-center text-chalk/20 text-xs">
          Torneo de Billar · Sistema de Gestión · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
