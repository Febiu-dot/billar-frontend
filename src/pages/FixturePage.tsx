import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Tournament, Match, Phase } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner, EmptyState } from '../components/ui';

export default function FixturePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get('/tournaments').then(r => {
      setTournaments(r.data);
      if (r.data.length > 0) loadTournament(r.data[0].id);
      else setLoading(false);
    });
  }, []);

  const loadTournament = (id: number) => {
    setDetailLoading(true);
    api.get(`/tournaments/${id}`).then(r => {
      setSelectedTournament(r.data);
      setDetailLoading(false);
      setLoading(false);
    });
  };

  const getMatchesByRound = (matches: Match[]) => {
    const rounds: Record<number, Match[]> = {};
    matches.forEach(m => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    });
    return rounds;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">FIXTURE</h1>
        <p className="text-chalk/50 text-sm mt-1">Cuadro y cruce de partidos por fase</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Tournament selector */}
        {tournaments.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-chalk/50 text-xs uppercase tracking-widest">Torneo:</label>
            <select
              className="input w-auto"
              onChange={e => loadTournament(Number(e.target.value))}
              value={selectedTournament?.id ?? ''}
            >
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
            </select>
          </div>
        )}

        {detailLoading ? (
          <LoadingSpinner />
        ) : !selectedTournament ? (
          <EmptyState message="No hay torneos disponibles" />
        ) : (
          <div className="space-y-8">
            {/* Tournament header */}
            <div className="card flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl text-gold">{selectedTournament.name}</h2>
                <p className="text-chalk/40 text-sm">{selectedTournament.year}</p>
                {selectedTournament.description && (
                  <p className="text-chalk/50 text-sm mt-1">{selectedTournament.description}</p>
                )}
              </div>
              <span className={`badge-status ${selectedTournament.active ? 'bg-green-900/40 text-green-400' : 'bg-chalk/10 text-chalk/40'}`}>
                {selectedTournament.active ? 'Activo' : 'Finalizado'}
              </span>
            </div>

            {/* Circuits & Phases */}
            {selectedTournament.circuits?.map(circuit => (
              <div key={circuit.id}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-display text-2xl text-chalk">{circuit.name}</h3>
                  <span className={`badge-status ${circuit.active ? 'bg-blue-900/40 text-blue-300' : 'bg-chalk/10 text-chalk/30'}`}>
                    Circuito {circuit.order}
                  </span>
                  {circuit.startDate && (
                    <span className="text-chalk/30 text-xs font-mono">
                      {new Date(circuit.startDate).toLocaleDateString('es-UY')}
                      {circuit.endDate && ` → ${new Date(circuit.endDate).toLocaleDateString('es-UY')}`}
                    </span>
                  )}
                </div>

                {circuit.phases?.length === 0 ? (
                  <p className="text-chalk/30 text-sm">Sin fases creadas</p>
                ) : (
                  circuit.phases?.map((phase: Phase) => {
                    const matchesByRound = getMatchesByRound(phase.matches ?? []);
                    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

                    return (
                      <div key={phase.id} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold text-chalk/80 uppercase text-sm tracking-wider">{phase.name}</h4>
                          <span className="badge-status bg-felt-light/20 text-chalk/40 text-xs capitalize">{phase.type}</span>
                          <span className="text-chalk/20 text-xs font-mono">
                            {phase.matches?.length ?? 0} partidos
                          </span>
                        </div>

                        {rounds.length === 0 ? (
                          <p className="text-chalk/20 text-xs pl-2">Sin partidos en esta fase</p>
                        ) : (
                          <div className={`flex gap-4 overflow-x-auto pb-2 ${rounds.length === 1 ? '' : 'items-start'}`}>
                            {rounds.map(round => (
                              <div key={round} className="flex-shrink-0 w-64">
                                <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2 font-mono">
                                  {round === 1 ? 'Fase de Grupos' : round === 99 ? 'Final' : `Ronda ${round}`}
                                </p>
                                <div className="space-y-2">
                                  {matchesByRound[round].map(m => (
                                    <MatchCard key={m.id} match={m} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const winnerA = match.result?.winnerId === match.playerAId;
  const winnerB = match.result?.winnerId === match.playerBId;
  const isFinished = match.status === 'finalizado' || match.status === 'wo';

  return (
    <div className={`rounded-lg border overflow-hidden text-sm transition-all ${
      match.status === 'en_juego'
        ? 'border-gold/40 bg-gold/5'
        : match.status === 'asignado'
        ? 'border-blue-700/40 bg-blue-900/10'
        : isFinished
        ? 'border-felt-light/20 bg-felt/50'
        : 'border-felt-light/15 bg-felt-dark/30'
    }`}>
      {/* Player A */}
      <div className={`flex items-center justify-between px-3 py-2 border-b border-felt-light/10 ${winnerA ? 'bg-gold/10' : ''}`}>
        <span className={`font-medium truncate ${winnerA ? 'text-gold' : 'text-chalk/80'}`}>
          {winnerA && '🏆 '}{playerName(match.playerA)}
        </span>
        {match.result && (
          <span className={`font-mono font-bold ml-2 shrink-0 ${winnerA ? 'text-gold' : 'text-chalk/40'}`}>
            {match.result.setsA}
          </span>
        )}
      </div>

      {/* Player B */}
      <div className={`flex items-center justify-between px-3 py-2 ${winnerB ? 'bg-gold/10' : ''}`}>
        <span className={`font-medium truncate ${winnerB ? 'text-gold' : 'text-chalk/80'}`}>
          {winnerB && '🏆 '}{playerName(match.playerB)}
        </span>
        {match.result && (
          <span className={`font-mono font-bold ml-2 shrink-0 ${winnerB ? 'text-gold' : 'text-chalk/40'}`}>
            {match.result.setsB}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1 bg-felt-dark/30 border-t border-felt-light/10">
        <MatchStatusBadge status={match.status} />
        {match.table && (
          <span className="text-chalk/25 text-xs font-mono">Mesa {match.table.number}</span>
        )}
        {match.result?.isWO && (
          <span className="text-red-400 text-xs font-mono">W.O.</span>
        )}
      </div>
    </div>
  );
}
