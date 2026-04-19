import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner, Modal, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function JudgePage() {
  const { user } = useAuth();
  const [tables, setTables]     = useState<Table[]>([]);
  const [loading, setLoading]   = useState(true);
  const [resultModal, setResultModal] = useState<Match | null>(null);
  const [form, setForm] = useState({
    setsA: '', setsB: '', pointsA: '', pointsB: '', isWO: false, woPlayerId: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

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
    setForm({
      setsA: match.result?.setsA?.toString() ?? '0',
      setsB: match.result?.setsB?.toString() ?? '0',
      pointsA: match.result?.pointsA?.toString() ?? '0',
      pointsB: match.result?.pointsB?.toString() ?? '0',
      isWO: false, woPlayerId: '', notes: '',
    });
    setError('');
  };

  const handleStartMatch = async (matchId: number) => {
    await api.put(`/matches/${matchId}/start`);
    fetchTables();
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultModal) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/matches/${resultModal.id}/result`, {
        setsA: Number(form.setsA),
        setsB: Number(form.setsB),
        pointsA: Number(form.pointsA),
        pointsB: Number(form.pointsB),
        isWO: form.isWO,
        woPlayerId: form.isWO && form.woPlayerId ? Number(form.woPlayerId) : undefined,
        notes: form.notes || undefined,
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
                  className={`card space-y-3 ${
                    t.status === 'ocupada' ? 'border-gold/40' : 'border-felt-light/20'
                  }`}
                >
                  {/* Table header */}
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

                  {/* Current match */}
                  {match ? (
                    <div className="border-t border-felt-light/20 pt-3 space-y-3">
                      {/* Players */}
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

                      {/* Phase info */}
                      <p className="text-chalk/30 text-xs text-center font-mono">
                        {match.phase?.name} · Ronda {match.round}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {match.status === 'asignado' && (
                          <button
                            className="btn-primary flex-1 text-sm"
                            onClick={() => handleStartMatch(match.id)}
                          >▶ Iniciar Partido</button>
                        )}
                        {match.status === 'en_juego' && (
                          <button
                            className="btn-primary flex-1 text-sm"
                            onClick={() => openResultModal(match)}
                          >📝 Cargar Resultado</button>
                        )}
                        {(match.status === 'finalizado' || match.status === 'wo') && (
                          <div className="flex-1 text-center">
                            <span className="text-green-400 text-sm font-semibold">
                              ✓ Partido cerrado
                            </span>
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

      {/* Result modal */}
      {resultModal && (
        <Modal title="CARGAR RESULTADO" onClose={() => setResultModal(null)}>
          <div className="mb-4 text-center">
            <p className="text-chalk/50 text-xs mb-1">Partido</p>
            <p className="text-chalk font-semibold">
              {playerName(resultModal.playerA)} <span className="text-gold/60">vs</span> {playerName(resultModal.playerB)}
            </p>
          </div>

          <form onSubmit={handleSubmitResult} className="space-y-4">
            {/* W.O. toggle */}
            <div className="flex items-center gap-3 bg-felt-dark/50 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                id="isWO"
                checked={form.isWO}
                onChange={e => setForm({ ...form, isWO: e.target.checked })}
                className="w-4 h-4 accent-gold"
              />
              <label htmlFor="isWO" className="text-chalk/80 text-sm font-medium cursor-pointer">
                Marcar como W.O. (ausente)
              </label>
            </div>

            {form.isWO ? (
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Jugador ausente (W.O.)</label>
                <select className="input" value={form.woPlayerId} onChange={e => setForm({ ...form, woPlayerId: e.target.value })} required>
                  <option value="">Seleccionar</option>
                  <option value={resultModal.playerAId}>{playerName(resultModal.playerA)}</option>
                  <option value={resultModal.playerBId}>{playerName(resultModal.playerB)}</option>
                </select>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5 truncate">
                      {resultModal.playerA?.firstName} — Sets
                    </label>
                    <input type="number" min="0" max="5" className="input text-center text-xl font-mono"
                      value={form.setsA} onChange={e => setForm({ ...form, setsA: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5 truncate">
                      {resultModal.playerB?.firstName} — Sets
                    </label>
                    <input type="number" min="0" max="5" className="input text-center text-xl font-mono"
                      value={form.setsB} onChange={e => setForm({ ...form, setsB: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5 truncate">
                      {resultModal.playerA?.firstName} — Tantos
                    </label>
                    <input type="number" min="0" className="input text-center font-mono"
                      value={form.pointsA} onChange={e => setForm({ ...form, pointsA: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5 truncate">
                      {resultModal.playerB?.firstName} — Tantos
                    </label>
                    <input type="number" min="0" className="input text-center font-mono"
                      value={form.pointsB} onChange={e => setForm({ ...form, pointsB: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Notas (opcional)</label>
              <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones..." />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Guardando...' : '✓ Cerrar Partido'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setResultModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
