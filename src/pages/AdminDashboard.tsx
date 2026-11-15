import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PanelTransmisiones from '../components/PanelTransmisiones';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Tournament } from '../types';
import { PageHeader, MatchStatusBadge, playerName, LoadingSpinner } from '../components/ui';

export default function AdminDashboard() {
  const [matches, setMatches]     = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]     = useState(true);

  const fetchData = async () => {
    const [m, tour] = await Promise.all([
      api.get('/matches?status=en_juego'),
      api.get('/tournaments'),
    ]);
    setMatches(m.data);
    setTournaments(tour.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    socket.on('match:updated', fetchData);
    return () => { socket.off('match:updated', fetchData); };
  }, []);

  const activos = tournaments.filter(t => t.active);
  const enJuegoDe = (id: number) => matches.filter((m: any) => m?.phase?.circuit?.tournament?.id === id).length;
  const acciones = [
    { to: '/admin/fixture', label: 'Fixture' },
    { to: '/admin/partidos', label: 'Partidos' },
    { to: '/admin/series', label: 'Series' },
    { to: '/admin/cruces', label: 'Cruces' },
    { to: '/admin/ranking-acumulado', label: 'Ranking' },
    { to: '/admin/publicaciones', label: 'Publicaciones' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Panel Principal" subtitle="Tus torneos y lo que se está jugando ahora" />

      <div className="p-6 space-y-6">
        {/* Torneos */}
        <div>
          <h2 className="font-display text-xl font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
            Torneos
          </h2>
          {activos.length === 0 ? (
            <div className="card text-silver-dark text-sm text-center py-8">No hay torneos activos. Creá uno desde Fixture.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activos.map(t => {
                const n = enJuegoDe(t.id);
                return (
                  <div key={t.id} className="card space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-silver-light text-lg">{t.name}</h3>
                        <p className="text-silver-dark text-xs mt-0.5">{t.year} · {t.circuits?.length ?? 0} circuitos</p>
                      </div>
                      <span className={`badge-status ${n > 0 ? 'bg-orange/20 text-orange' : 'bg-green-900/30 text-green-400'}`}>
                        {n > 0 ? `${n} en juego` : 'Activo'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {acciones.map(a => (
                        <Link key={a.to} to={a.to} className="btn-secondary py-1.5 px-3 text-xs">{a.label}</Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transmisiones en vivo de todas las sedes */}
        <PanelTransmisiones />

        {/* Partidos en juego */}
        <div>
          <h2 className="font-display text-xl font-bold text-silver-light uppercase tracking-wide mb-3 orange-line pl-3">
            Partidos en Curso
          </h2>
          {matches.length === 0 ? (
            <div className="card text-silver-dark text-sm text-center py-8">Sin partidos en curso</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {matches.map(m => (
                <div key={m.id} className="card border-orange/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-silver-dark font-mono">Mesa {m.table?.number} — {m.table?.venue?.name}</span>
                    <MatchStatusBadge status={m.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-silver-light">{playerName(m.playerA)}</span>
                    <div className="font-mono text-orange font-bold text-xl flex gap-2">
                      <span>{m.result?.setsA ?? 0}</span>
                      <span className="text-silver-muted">—</span>
                      <span>{m.result?.setsB ?? 0}</span>
                    </div>
                    <span className="font-semibold text-silver-light text-right">{playerName(m.playerB)}</span>
                  </div>
                  {m.result && (
                    <div className="flex justify-center gap-4 text-xs text-silver-dark font-mono">
                      <span>{m.result.pointsA} pts</span>
                      <span className="text-silver-muted">|</span>
                      <span>{m.result.pointsB} pts</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
