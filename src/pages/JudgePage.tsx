import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner, Modal, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface SetScore { a: string; b: string; }

export default function JudgePage() {
  const { user } = useAuth();
  const [tables, setTables]           = useState<Table[]>([]);
  const [loading, setLoading]         = useState(true);
  const [resultModal, setResultModal] = useState<Match | null>(null);
  const [sets, setSets]               = useState<SetScore[]>([{ a: '', b: '' }]);
  const [isWO, setIsWO]               = useState(false);
  const [woPlayerId, setWoPlayerId]   = useState('');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const fetchTables = () => {
    const url = user?.venueId ? `/tables?venueId=${user.venueId}` : '/tables';
    api.get(url).then(r => { setTables(r.data); setLoading(false); });
  };

  useEffect(() => {
    fetchTables();
    if (user?.venueId) socket.emit('join:venue', user.venueId);
    socket.on('match:updated', fetchTables);
    socket.on('table:updated', fetchTables);
    return () => {
      socket.off('match:updated', fetchTables);
      socket.off('table:updated', fetchTables);
    };
  }, [user?.venueId]);

  const openResultModal = (match: Match) => {
    setResultModal(match);
    setSets([{ a: '', b: '' }]);
    setIsWO(false);
    setWoPlayerId('');
    setNotes('');
    setError('');
  };

  const handleStartMatch = async (matchId: number) => {
    await api.put(`/matches/${matchId}/start`);
    fetchTables();
  };

  const calcSetWinner = (sa: string, sb: string, pointsPerSet: number) => {
    const a = Number(sa), b = Number(sb);
    if (!sa || !sb) return null;
    if (a >= pointsPerSet && a > b) return 'a';
    if (b >= pointsPerSet && b > a) return 'b';
    return null;
  };

  const updateSet = (index: number, side: 'a' | 'b', value: string, match: Match) => {
    const pointsPerSet = match.ruleSet?.pointsPerSet ?? 60;
    const setsToWin   = match.ruleSet?.setsToWin ?? 3;
    const newSets = sets.map((s, i) => i === index ? { ...s, [side]: value } : s);

    let winsA = 0, winsB = 0;
    for (let i = 0; i < newSets.length; i++) {
      const w = calcSetWinner(newSets[i].a, newSets[i].b, pointsPerSet);
      if (w === 'a') winsA++;
      if (w === 'b') winsB++;
    }

    const currentWinner = calcSetWinner(newSets[index].a, newSets[index].b, pointsPerSet);
    const matchOver = winsA >= setsToWin || winsB >= setsToWin;

    if (currentWinner && !matchOver && newSets.length === index + 1) {
      newSets.push({ a: '', b: '' });
    }

    setSets(newSets);
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultModal) return;
    setSaving(true);
    setError('');

    const pointsPerSet = resultModal.ruleSet?.pointsPerSet ?? 60;
    const setsToWin    = resultModal.ruleSet?.setsToWin ?? 3;

    try {
      let setsA = 0, setsB = 0, pointsA = 0, pointsB = 0;

      for (const s of sets) {
        const w = calcSetWinner(s.a, s.b, pointsPerSet);
        if (w === 'a') setsA++;
        if (w === 'b') setsB++;
        pointsA += Number(s.a) || 0;
        pointsB += Number(s.b) || 0;
      }

      if (!isWO && setsA < setsToWin && setsB < setsToWin) {
        setError(`El partido no tiene ganador. Algún jugador debe ganar ${setsToWin} sets.`);
        setSaving(false);
        return;
      }

      await api.put(`/matches/${resultModal.id}/result`, {
        setsA,
        setsB,
        pointsA,
        pointsB,
        isWO,
        woPlayerId: isWO && woPlayerId ? Number(woPlayerId) : undefined,
        notes: notes || undefined,
      });

      setResultModal(null);
      fetchTables();
    } catch {
      setError('Error al guardar el resultado');
    } finally {
      setSaving(false);
    }
  };

  const currentMatch = (t: Table) => t.matches?.[0];

  const getSummary = (match: Match) => {
    const pointsPerSet = match.ruleSet?.pointsPerSet ?? 60;
    let winsA = 0, winsB = 0;
    for (const s of sets) {
      const w = calcSetWinner(s.a, s.b, pointsPerSet);
      if (w === 'a') winsA++;
      if (w === 'b') winsB++;
    }
    return { winsA, winsB };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">PANEL JUEZ</h1>
        <p className="text-chalk/50 text-sm mt-1">
          {user?.venueName ?? 'Mi Sede'} · {tables.length} mesas
        </p>
      </div>

      <div className="p-6 space-y-4">
        {tables.length === 0 ? (
          <EmptyState message="No hay mesas asignadas a tu sede" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.sort((a, b) => a.number - b.number).map(t => {
              const match = currentMatch(t);
              return (
                <div
                  key={t.id}
                  className={`card space-y-3 ${t.status === 'ocupada' ? 'border-gold/40' : 'border-felt-light/20'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-4xl text-gold">{t.number}</span>
                      <div>
                        <p className="text-chalk/60 text-xs">Mesa</p>
                        <span className={`badge-status text-xs ${
                          t.status === 'libre' ? 'bg-green-900/40 text-green-400' :
                          t.status === 'ocupada' ? 'bg-gold/20 text-gold' :
                          'bg-red-900/40 text-red-400'
                        }`}>
                          {t.status === 'libre' ? '● Libre' : t.status === 'ocupada' ? '● Ocupada' : '✕ Fuera'}
                        </span>
                      </div>
                    </div>
                    {match && <MatchStatusBadge status={match.status} />}
                  </div>

                  {match ? (
                    <div className="border-t border-felt-light/20 pt-3 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="font-semibold text-chalk text-sm leading-tight">{playerName(match.playerA)}</p>
                          {match.playerA?.category && (
                            <p className="text-chalk/30 text-xs capitalize">{match.playerA.category.name}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          {match.result ? (
                            <span className="font-mono text-gold font-bold text-2xl">
                              {match.result.setsA}—{match.result.setsB}
                            </span>
                          ) : (
                            <span className="text-chalk/20 font-mono text-lg">vs</span>
                          )}
                          {match.result && (
                            <span className="text-chalk/30 text-xs font-mono">
                              {match.result.pointsA}—{match.result.pointsB}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-chalk text-sm leading-tight">{playerName(match.playerB)}</p>
                          {match.playerB?.category && (
                            <p className="text-chalk/30 text-xs capitalize">{match.playerB.category.name}</p>
                          )}
                        </div>
                      </div>

                      <p className="text-chalk/30 text-xs text-center font-mono">
                        {match.phase?.name} · Ronda {match.round}
                      </p>

                      <div className="flex gap-2">
                        {match.status === 'asignado' && (
                          <button
                            className="btn-primary flex-1 text-sm"
                            onClick={() => handleStartMatch(match.id)}
                          >
                            ▶ Iniciar Partido
                          </button>
                        )}
                        {match.status === 'en_juego' && (
                          <button
                            className="btn-primary flex-1 text-sm"
                            onClick={() => openResultModal(match)}
                          >
                            📝 Cargar Resultado
                          </button>
                        )}
                        {(match.status === 'finalizado' || match.status === 'wo') && (
                          <div className="flex-1 text-center">
                            <span className="text-green-400 text-sm font-semibold">✓ Partido cerrado</span>
                            {match.result?.isWO && (
                              <span className="ml-2 text-red-400 text-xs">W.O.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-felt-light/20 pt-3 text-center text-chalk/30 text-sm py-4">
                      Sin partido asignado
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {resultModal && (() => {
        const { winsA, winsB } = getSummary(resultModal);
        const setsToWin    = resultModal.ruleSet?.setsToWin ?? 3;
        const pointsPerSet = resultModal.ruleSet?.pointsPerSet ?? 60;
        const nameA = resultModal.playerA?.firstName ?? 'Jugador A';
        const nameB = resultModal.playerB?.firstName ?? 'Jugador B';

        return (
          <Modal title="CARGAR RESULTADO" onClose={() => setResultModal(null)}>
            <div className="mb-4 text-center">
              <p className="text-chalk/50 text-xs mb-1">Partido</p>
              <p className="text-chalk font-semibold">
                {playerName(resultModal.playerA)} <span className="text-gold/60">vs</span> {playerName(resultModal.playerB)}
              </p>
              <p className="text-chalk/40 text-xs mt-1">
                Al mejor de {resultModal.ruleSet?.bestOf ?? 5} · {pointsPerSet} tantos por set
              </p>
            </div>

            <div className="flex justify-center items-center gap-6 bg-felt-dark/50 rounded-lg py-3 mb-4">
              <div className="text-center">
                <p className="text-chalk/50 text-xs truncate max-w-[80px]">{nameA}</p>
                <p className="font-display text-4xl text-gold">{winsA}</p>
              </div>
              <p className="text-chalk/30 font-mono text-xl">sets</p>
              <div className="text-center">
                <p className="text-chalk/50 text-xs truncate max-w-[80px]">{nameB}</p>
                <p className="font-display text-4xl text-gold">{winsB}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div className="flex items-center gap-3 bg-felt-dark/50 rounded-lg px-3 py-2">
                <input
                  type="checkbox"
                  id="isWO"
                  checked={isWO}
                  onChange={e => setIsWO(e.target.checked)}
                  className="w-4 h-4 accent-gold"
                />
                <label htmlFor="isWO" className="text-chalk/80 text-sm font-medium cursor-pointer">
                  Marcar como W.O. (ausente)
                </label>
              </div>

              {isWO ? (
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                    Jugador ausente
                  </label>
                  <select
                    className="input"
                    value={woPlayerId}
                    onChange={e => setWoPlayerId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value={resultModal.playerAId}>{playerName(resultModal.playerA)}</option>
                    <option value={resultModal.playerBId}>{playerName(resultModal.playerB)}</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <p className="text-chalk/60 text-xs uppercase tracking-widest truncate">{nameA}</p>
                    <p className="text-chalk/30 text-xs uppercase tracking-widest">Set</p>
                    <p className="text-chalk/60 text-xs uppercase tracking-widest truncate">{nameB}</p>
                  </div>

                  {sets.map((s, i) => {
                    const winner = calcSetWinner(s.a, s.b, pointsPerSet);
                    return (
                      <div
                        key={i}
                        className={`grid grid-cols-3 gap-2 items-center rounded-lg px-2 py-1 ${
                          winner ? 'bg-gold/10' : 'bg-felt-dark/30'
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          max={pointsPerSet}
                          className={`input text-center font-mono ${winner === 'a' ? 'border-gold/50' : ''}`}
                          value={s.a}
                          onChange={e => updateSet(i, 'a', e.target.value, resultModal)}
                          placeholder="0"
                        />
                        <div className="text-center">
                          <span className="text-chalk/40 font-mono text-sm">{i + 1}</span>
                          {winner && (
                            <span className="ml-1 text-xs text-gold">
                              {winner === 'a' ? '← ✓' : '✓ →'}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={pointsPerSet}
                          className={`input text-center font-mono ${winner === 'b' ? 'border-gold/50' : ''}`}
                          value={s.b}
                          onChange={e => updateSet(i, 'b', e.target.value, resultModal)}
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                  Notas (opcional)
                </label>
                <input
                  className="input"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observaciones..."
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Guardando...' : '✓ Cerrar Partido'}
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setResultModal(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}
    </div>
  );
}
