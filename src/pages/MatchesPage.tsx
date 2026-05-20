import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table, MatchStatus } from '../types';
import { PageHeader, MatchStatusBadge, playerName, LoadingSpinner, Modal, EmptyState } from '../components/ui';

interface Tournament { id: number; name: string; }
interface Circuit    { id: number; name: string; tournamentId: number; }

export default function MatchesPage() {
  const [matches, setMatches]         = useState<Match[]>([]);
  const [tables, setTables]           = useState<Table[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [circuits, setCircuits]       = useState<Circuit[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus]       = useState<MatchStatus | ''>('');
  const [filterTournament, setFilterTournament] = useState('');
  const [filterCircuit, setFilterCircuit]       = useState('');
  const [assignModal, setAssignModal]   = useState<Match | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMatches = (circuitId?: string, tournamentId?: string) => {
    const params = new URLSearchParams();
    if (circuitId)   params.append('circuitId',   circuitId);
    else if (tournamentId) params.append('tournamentId', tournamentId);
    return api.get(`/matches?${params.toString()}`).then(r => setMatches(r.data));
  };

  const fetchAll = () =>
    Promise.all([
      api.get('/matches'),
      api.get('/tables'),
    ]).then(([m, t]) => {
      setMatches(m.data);
      setTables(t.data);
      setLoading(false);
    });

  useEffect(() => {
    fetchAll();
    api.get('/tournaments').then(r => setTournaments(r.data));
    api.get('/circuits').then(r => setCircuits(r.data));
    socket.on('match:updated', () => fetchMatches(filterCircuit, filterTournament));
    socket.on('table:updated', () => api.get('/tables').then(r => setTables(r.data)));
    return () => { socket.off('match:updated'); socket.off('table:updated'); };
  }, []);

  // Al cambiar torneo: resetear circuito y cargar partidos del torneo
  const handleTournamentChange = (tournamentId: string) => {
    setFilterTournament(tournamentId);
    setFilterCircuit('');
    setLoading(true);
    fetchMatches('', tournamentId).finally(() => setLoading(false));
  };

  // Al cambiar circuito: cargar partidos del circuito
  const handleCircuitChange = (circuitId: string) => {
    setFilterCircuit(circuitId);
    setLoading(true);
    fetchMatches(circuitId, '').finally(() => setLoading(false));
  };

  // Circuitos del torneo seleccionado
  const circuitsFiltrados = filterTournament
    ? circuits.filter(c => c.tournamentId === Number(filterTournament))
    : circuits;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    setSaving(true);
    try {
      await api.put(`/matches/${assignModal.id}/assign`, { tableId: Number(selectedTable) });
      setAssignModal(null);
      fetchMatches(filterCircuit, filterTournament);
    } finally { setSaving(false); }
  };

  const handleAutoAssign = async (matchId: number) => {
    try {
      await api.post('/matches/auto-assign', { matchId });
      fetchMatches(filterCircuit, filterTournament);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'No hay mesas libres disponibles');
    }
  };

  const handleStart = async (matchId: number) => {
    await api.put(`/matches/${matchId}/start`);
    fetchMatches(filterCircuit, filterTournament);
  };

  const statusOrder: MatchStatus[] = ['en_juego', 'asignado', 'pendiente', 'finalizado', 'wo'];
  const statuses: (MatchStatus | '')[] = ['', 'pendiente', 'asignado', 'en_juego', 'finalizado', 'wo'];
  const statusLabels: Record<string, string> = {
    '': 'Todos', pendiente: 'Pendientes', asignado: 'Asignados',
    en_juego: 'En Juego', finalizado: 'Finalizados', wo: 'W.O.',
  };

  const filtered = filterStatus
    ? matches.filter(m => m.status === filterStatus)
    : [...matches].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  const freeTables = tables.filter(t => t.status === 'libre');

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="PARTIDOS"
        subtitle={`${matches.length} partidos`}
      />

      <div className="p-6 space-y-4">
        {/* Filtros torneo / circuito */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="input w-56"
            value={filterTournament}
            onChange={e => handleTournamentChange(e.target.value)}
          >
            <option value="">Todos los torneos</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="input w-56"
            value={filterCircuit}
            onChange={e => handleCircuitChange(e.target.value)}
            disabled={!filterTournament}
          >
            <option value="">Todos los circuitos</option>
            {circuitsFiltrados.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as MatchStatus | '')}
              className={`badge-status cursor-pointer text-xs px-3 py-1 ${
                filterStatus === s ? 'bg-gold/30 text-gold border border-gold/40' : 'bg-felt-light/20 text-chalk/60'
              }`}
            >
              {statusLabels[s]}
              <span className="ml-1 font-mono">
                ({s === '' ? filtered.length : filtered.filter(m => m.status === s).length})
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No hay partidos con este filtro" />
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <div key={m.id} className={`card transition-all ${m.status === 'en_juego' ? 'border-gold/40' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <MatchStatusBadge status={m.status} />
                      {m.table && (
                        <span className="text-xs text-chalk/40 font-mono">
                          Mesa {m.table.number} — {m.table.venue?.name}
                        </span>
                      )}
                      <span className="text-xs text-chalk/30 font-mono">
                        {m.phase?.circuit?.tournament?.name} · {m.phase?.name} · R{m.round}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-chalk truncate">{playerName(m.playerA)}</span>
                      {m.result ? (
                        <span className="font-mono text-gold font-bold text-lg shrink-0">
                          {m.result.setsA} — {m.result.setsB}
                        </span>
                      ) : (
                        <span className="text-chalk/20 font-mono shrink-0">vs</span>
                      )}
                      <span className="font-semibold text-chalk truncate">{playerName(m.playerB)}</span>
                    </div>

                    {m.sets && m.sets.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {m.sets.map(s => (
                          <div key={s.setNumber} className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-chalk/30 w-8">S{s.setNumber}</span>
                            <span className={s.pointsA > s.pointsB ? 'text-gold font-bold' : 'text-chalk/50'}>{s.pointsA}</span>
                            <span className="text-chalk/20">—</span>
                            <span className={s.pointsB > s.pointsA ? 'text-gold font-bold' : 'text-chalk/50'}>{s.pointsB}</span>
                            {s.pointsA > s.pointsB ? (
                              <span className="text-gold text-xs">← ✓</span>
                            ) : (
                              <span className="text-gold text-xs">✓ →</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {m.result && !m.sets?.length && (m.result.pointsA > 0 || m.result.pointsB > 0) && (
                      <p className="text-xs text-chalk/30 font-mono mt-0.5">
                        {m.result.pointsA} pts — {m.result.pointsB} pts
                        {m.result.isWO && <span className="ml-2 text-red-400">W.O.</span>}
                      </p>
                    )}

                    {m.result?.isWO && (
                      <p className="text-xs text-red-400 font-mono mt-0.5">W.O.</p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {m.status === 'pendiente' && (
                      <>
                        <button
                          className="btn-secondary text-xs py-1"
                          onClick={() => { setAssignModal(m); setSelectedTable(''); }}
                        >Asignar Mesa</button>
                        <button
                          className="btn-primary text-xs py-1"
                          onClick={() => handleAutoAssign(m.id)}
                          disabled={freeTables.length === 0}
                        >Auto-Asignar</button>
                      </>
                    )}
                    {m.status === 'asignado' && (
                      <button className="btn-primary text-xs py-1" onClick={() => handleStart(m.id)}>
                        ▶ Iniciar
                      </button>
                    )}
                    {(m.status === 'finalizado' || m.status === 'wo') && m.result?.winnerId && (
                      <span className="text-xs text-green-400 font-semibold">
                        🏆 {playerName(m.result.winnerId === m.playerAId ? m.playerA : m.playerB)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {assignModal && (
        <Modal title="ASIGNAR MESA" onClose={() => setAssignModal(null)}>
          <p className="text-chalk/60 text-sm mb-4">
            {playerName(assignModal.playerA)} vs {playerName(assignModal.playerB)}
          </p>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Mesa libre</label>
              {freeTables.length === 0 ? (
                <p className="text-red-400 text-sm">No hay mesas libres disponibles</p>
              ) : (
                <select className="input" value={selectedTable} onChange={e => setSelectedTable(e.target.value)} required>
                  <option value="">Seleccionar mesa</option>
                  {freeTables.map(t => (
                    <option key={t.id} value={t.id}>Mesa {t.number} — {t.venue?.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={saving || freeTables.length === 0}>
                {saving ? 'Asignando...' : 'Asignar'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setAssignModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
