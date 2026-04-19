import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table, Tournament } from '../types';
import { PageHeader, StatCard, MatchStatusBadge, TableStatusBadge, playerName, LoadingSpinner } from '../components/ui';

export default function AdminDashboard() {
  const [matches, setMatches]       = useState<Match[]>([]);
  const [tables, setTables]         = useState<Table[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]       = useState(true);

  const fetchData = async () => {
    const [m, t, tour] = await Promise.all([
      api.get('/matches?status=en_juego'),
      api.get('/tables'),
      api.get('/tournaments'),
    ]);
    setMatches(m.data);
    setTables(t.data);
    setTournaments(tour.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    socket.on('match:updated', fetchData);
    socket.on('table:updated', fetchData);
    return () => { socket.off('match:updated', fetchData); socket.off('table:updated', fetchData); };
  }, []);

  const libres   = tables.filter(t => t.status === 'libre').length;
  const ocupadas = tables.filter(t => t.status === 'ocupada').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-0">
      <PageHeader title="DASHBOARD" subtitle="Resumen en tiempo real del torneo" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Mesas Libres"   value={libres}   icon="🟩" color="green" />
          <StatCard label="Mesas Ocupadas" value={ocupadas} icon="🟥" color="gold" />
          <StatCard label="En Juego"       value={matches.length} icon="⚔️" color="blue" />
          <StatCard label="Torneos"        value={tournaments.length} icon="🏆" />
        </div>

        {/* Partidos en juego */}
        <div>
          <h2 className="font-display text-2xl text-chalk mb-3">PARTIDOS EN CURSO</h2>
          {matches.length === 0 ? (
            <div className="card text-chalk/40 text-sm text-center py-8">No hay partidos en curso</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {matches.map(m => (
                <div key={m.id} className="card border-gold/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-chalk/40 font-mono">Mesa {m.table?.number} — {m.table?.venue?.name}</span>
                    <MatchStatusBadge status={m.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-chalk">{playerName(m.playerA)}</span>
                    <div className="font-mono text-gold font-bold text-lg flex gap-2">
                      <span>{m.result?.setsA ?? 0}</span>
                      <span className="text-chalk/30">—</span>
                      <span>{m.result?.setsB ?? 0}</span>
                    </div>
                    <span className="font-semibold text-chalk text-right">{playerName(m.playerB)}</span>
                  </div>
                  {m.result && (
                    <div className="flex justify-center gap-4 text-xs text-chalk/40 font-mono">
                      <span>{m.result.pointsA} pts</span>
                      <span className="text-chalk/20">|</span>
                      <span>{m.result.pointsB} pts</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado de mesas */}
        <div>
          <h2 className="font-display text-2xl text-chalk mb-3">ESTADO DE MESAS</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {tables.map(t => (
              <div key={t.id}
                className={`card text-center cursor-default transition-all ${t.status === 'ocupada' ? 'border-gold/50 bg-gold/5' : t.status === 'libre' ? 'border-green-600/30' : 'border-red-700/30 opacity-50'}`}
              >
                <p className="font-display text-3xl text-gold">{t.number}</p>
                <p className="text-chalk/40 text-xs mb-2">{t.venue?.name}</p>
                <TableStatusBadge status={t.status} />
                {t.matches && t.matches[0] && (
                  <p className="text-chalk/50 text-xs mt-2 truncate">
                    {playerName(t.matches[0].playerA)} vs {playerName(t.matches[0].playerB)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Torneos activos */}
        {tournaments.length > 0 && (
          <div>
            <h2 className="font-display text-2xl text-chalk mb-3">TORNEOS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tournaments.filter(t => t.active).map(t => (
                <div key={t.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-chalk">{t.name}</h3>
                      <p className="text-chalk/40 text-xs mt-0.5">{t.year} · {t.circuits?.length ?? 0} circuitos</p>
                    </div>
                    <span className="badge-status bg-green-900/40 text-green-400">Activo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
