import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Match, Table, MatchStatus } from '../types';
import { PageHeader, MatchStatusBadge, playerName, LoadingSpinner, Modal, EmptyState } from '../components/ui';

interface Tournament { id: number; name: string; }
interface Circuit    { id: number; name: string; tournamentId: number; }
interface SetScore   { a: string; b: string; saved: boolean; }

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches]         = useState<Match[]>([]);
  const [tables, setTables]           = useState<Table[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [circuits, setCircuits]       = useState<Circuit[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus]         = useState<MatchStatus | ''>('');
  const [filterTournament, setFilterTournament] = useState('');
  const [filterCircuit, setFilterCircuit]       = useState('');

  // Modal asignar mesa
  const [assignModal, setAssignModal]     = useState<Match | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [saving, setSaving]               = useState(false);

  // Modal cargar resultado — set por set
  const [resultModal, setResultModal] = useState<Match | null>(null);
  const [sets, setSets]               = useState<SetScore[]>([{ a: '', b: '', saved: false }]);
  const [isWO, setIsWO]               = useState(false);
  const [woPlayerId, setWoPlayerId]   = useState('');
  const [notes, setNotes]             = useState('');
  const [resSaving, setResSaving]     = useState(false);
  const [savingSet, setSavingSet]     = useState<number | null>(null);
  const [resError, setResError]       = useState('');

  // Modal sustituir jugador provisorio (Qualy) por jugador real
  const [subModal, setSubModal]       = useState<{ match: Match; lado: 'A' | 'B'; slotLabel: string } | null>(null);
  const [subPlayers, setSubPlayers]   = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [subSelected, setSubSelected] = useState('');
  const [subSaving, setSubSaving]     = useState(false);

  const filterCircuitRef    = useRef(filterCircuit);
  const filterTournamentRef = useRef(filterTournament);
  useEffect(() => { filterCircuitRef.current    = filterCircuit; },    [filterCircuit]);
  useEffect(() => { filterTournamentRef.current = filterTournament; }, [filterTournament]);

  const fetchMatches = useCallback((circuitId?: string, tournamentId?: string) => {
    const params = new URLSearchParams();
    if (circuitId && circuitId !== '') {
      params.append('circuitId', circuitId);
    } else if (tournamentId && tournamentId !== '') {
      params.append('tournamentId', tournamentId);
    }
    return api.get(`/matches?${params.toString()}`).then(r => setMatches(r.data));
  }, []);

  const fetchTables = () => api.get('/tables').then(r => setTables(r.data));

  useEffect(() => {
    Promise.all([
      fetchMatches(),
      fetchTables(),
      api.get('/tournaments').then(r => setTournaments(r.data)),
      api.get('/circuits').then(r => setCircuits(r.data)),
    ]).finally(() => setLoading(false));

    const onMatchUpdated = () => fetchMatches(filterCircuitRef.current, filterTournamentRef.current);
    const onTableUpdated = () => fetchTables();
    socket.on('match:updated', onMatchUpdated);
    socket.on('table:updated', onTableUpdated);
    return () => {
      socket.off('match:updated', onMatchUpdated);
      socket.off('table:updated', onTableUpdated);
    };
  }, [fetchMatches]);

  const handleTournamentChange = (tournamentId: string) => {
    setFilterTournament(tournamentId);
    setFilterCircuit('');
    setLoading(true);
    fetchMatches('', tournamentId).finally(() => setLoading(false));
  };

  const handleCircuitChange = (circuitId: string) => {
    setFilterCircuit(circuitId);
    setLoading(true);
    fetchMatches(circuitId, '').finally(() => setLoading(false));
  };

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

  // Abre el modal para sustituir un jugador provisorio (Qualy) por uno real.
  // Carga todos los jugadores activos ordenados por apellido.
  const openSubModal = (match: Match, lado: 'A' | 'B', slotLabel: string) => {
    setSubModal({ match, lado, slotLabel });
    setSubSelected('');
    api.get('/players', { params: { active: true } }).then(r => {
      const arr = (r.data as any[])
        .map(p => ({ id: p.id, firstName: p.firstName, lastName: p.lastName }))
        .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
      setSubPlayers(arr);
    }).catch(() => setSubPlayers([]));
  };

  const handleSustituir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subModal || !subSelected) return;
    setSubSaving(true);
    try {
      await api.put(`/matches/${subModal.match.id}/jugador`, {
        lado: subModal.lado,
        playerId: Number(subSelected),
      });
      setSubModal(null);
      fetchMatches(filterCircuit, filterTournament);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'No se pudo sustituir el jugador');
    } finally { setSubSaving(false); }
  };

  // ── Abrir modal resultado ─────────────────────────────────────────
  const openResultModal = (match: Match) => {
    setResultModal(match);
    const esFinalizado = match.status === 'finalizado' || match.status === 'wo';
    if (match.sets && match.sets.length > 0) {
      const loadedSets: SetScore[] = match.sets.map(s => ({
        a: s.pointsA.toString(),
        b: s.pointsB.toString(),
        saved: !esFinalizado, // Si es edición, dejar editable (saved=false)
      }));
      const setsToWin = (match as any).ruleSet?.setsToWin ?? 3;
      const winsA = loadedSets.filter(s => Number(s.a) > Number(s.b)).length;
      const winsB = loadedSets.filter(s => Number(s.b) > Number(s.a)).length;
      if (!esFinalizado && winsA < setsToWin && winsB < setsToWin) {
        loadedSets.push({ a: '', b: '', saved: false });
      }
      setSets(loadedSets);
    } else {
      setSets([{ a: '', b: '', saved: false }]);
    }
    setIsWO(false);
    setWoPlayerId('');
    setNotes('');
    setResError('');
  };

  // ── Validación de set ─────────────────────────────────────────────
  const calcSetWinner = (sa: string, sb: string, pointsPerSet: number) => {
    const a = Number(sa), b = Number(sb);
    if (!sa || !sb || isNaN(a) || isNaN(b)) return null;
    if (a >= pointsPerSet && a > b) return 'a';
    if (b >= pointsPerSet && b > a) return 'b';
    return null;
  };

  const updateSet = (index: number, side: 'a' | 'b', value: string) => {
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0)) return;
    const newSets = sets.map((s, i) => i === index ? { ...s, [side]: value, saved: false } : s);
    setSets(newSets);
  };

  const handleSaveSet = async (index: number) => {
    if (!resultModal) return;
    const s = sets[index];
    const pointsPerSet = (resultModal as any).ruleSet?.pointsPerSet ?? 60;
    const winner = calcSetWinner(s.a, s.b, pointsPerSet);
    if (!winner) {
      setResError(`Set ${index + 1}: el ganador debe llegar a ${pointsPerSet} tantos y tener más que el rival`);
      return;
    }

    const eraFinalizado = resultModal.status === 'finalizado' || resultModal.status === 'wo';

    if (eraFinalizado) {
      // Para partidos finalizados: solo actualizar estado local, sin llamar al backend
      const newSets = sets.map((set, i) => i === index ? { ...set, saved: true } : set);
      setSets(newSets);
      setResError('');
      return;
    }

    setSavingSet(index);
    setResError('');
    try {
      await api.put(`/matches/${resultModal.id}/set`, {
        setNumber: index + 1,
        pointsA: Number(s.a),
        pointsB: Number(s.b),
      });

      const newSets = sets.map((set, i) => i === index ? { ...set, saved: true } : set);
      const setsToWin = (resultModal as any).ruleSet?.setsToWin ?? 3;
      const winsA = newSets.filter(set => Number(set.a) > Number(set.b) && set.saved).length;
      const winsB = newSets.filter(set => Number(set.b) > Number(set.a) && set.saved).length;
      if (winsA < setsToWin && winsB < setsToWin && newSets.length === index + 1) {
        newSets.push({ a: '', b: '', saved: false });
      }
      setSets(newSets);
      fetchMatches(filterCircuit, filterTournament);
    } catch {
      setResError('Error al guardar el set');
    } finally {
      setSavingSet(null);
    }
  };

  const handleCloseMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultModal) return;
    setResSaving(true);
    setResError('');

    const pointsPerSet = (resultModal as any).ruleSet?.pointsPerSet ?? 60;
    const setsToWin    = (resultModal as any).ruleSet?.setsToWin ?? 3;

    try {
      let setsA = 0, setsB = 0, pointsA = 0, pointsB = 0;
      const savedSets = sets.filter(s => s.saved);
      for (const s of savedSets) {
        const w = calcSetWinner(s.a, s.b, pointsPerSet);
        if (w === 'a') setsA++;
        if (w === 'b') setsB++;
        pointsA += Number(s.a) || 0;
        pointsB += Number(s.b) || 0;
      }

      if (!isWO && setsA < setsToWin && setsB < setsToWin) {
        setResError(`El partido no tiene ganador. Algún jugador debe ganar ${setsToWin} sets.`);
        setResSaving(false);
        return;
      }

      await api.put(`/matches/${resultModal.id}/result`, {
        setsA, setsB, pointsA, pointsB,
        isWO,
        woPlayerId: isWO && woPlayerId ? Number(woPlayerId) : undefined,
        notes: notes || undefined,
        sets: savedSets.map((s, i) => ({
          setNumber: i + 1,
          pointsA: Number(s.a),
          pointsB: Number(s.b),
        })),
      });

      setResultModal(null);
      fetchMatches(filterCircuit, filterTournament);
    } catch {
      setResError('Error al cerrar el partido');
    } finally {
      setResSaving(false);
    }
  };

  const getSummary = () => {
    let winsA = 0, winsB = 0;
    for (const s of sets) {
      if (!s.saved) continue;
      if (Number(s.a) > Number(s.b)) winsA++;
      if (Number(s.b) > Number(s.a)) winsB++;
    }
    return { winsA, winsB };
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
      <PageHeader title="PARTIDOS" subtitle={`${matches.length} partidos`} />

      <div className="p-6 space-y-4">

        <div className="flex flex-wrap gap-3 items-center">
          <select className="input w-56" value={filterTournament} onChange={e => handleTournamentChange(e.target.value)}>
            <option value="">Todos los torneos</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="input w-56" value={filterCircuit} onChange={e => handleCircuitChange(e.target.value)} disabled={!filterTournament}>
            <option value="">Todos los circuitos</option>
            {circuitsFiltrados.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {statuses.map(s => {
            const count = s === '' ? filtered.length : matches.filter(m => m.status === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s as MatchStatus | '')}
                className={`badge-status cursor-pointer text-xs px-3 py-1 ${filterStatus === s ? 'bg-gold/30 text-gold border border-gold/40' : 'bg-felt-light/20 text-chalk/60'}`}>
                {statusLabels[s]}<span className="ml-1 font-mono">({count})</span>
              </button>
            );
          })}
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
                      {m.table && <span className="text-xs text-chalk/40 font-mono">Mesa {m.table.number} — {m.table.venue?.name}</span>}
                      <span className="text-xs text-chalk/30 font-mono">{m.phase?.circuit?.tournament?.name} · {m.phase?.name} · R{m.round}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const editable = user?.role === 'admin' && (m.status === 'pendiente' || m.status === 'asignado');
                        const renderLado = (lado: 'A' | 'B') => {
                          const player = lado === 'A' ? m.playerA : m.playerB;
                          const slot = lado === 'A' ? (m as any).slotA : (m as any).slotB;
                          const label = player ? playerName(player) : (slot ?? '—');
                          const esQualy = !player || /qualy/i.test(label);
                          return (
                            <span className="font-semibold text-chalk truncate flex items-center gap-1">
                              <span className={esQualy ? 'text-orange/80 italic' : ''}>{label}</span>
                              {editable && (
                                <button
                                  className="text-orange hover:text-orange/70 text-xs shrink-0"
                                  title="Sustituir jugador"
                                  onClick={() => openSubModal(m, lado, label)}
                                >✏️</button>
                              )}
                            </span>
                          );
                        };
                        return (
                          <>
                            {renderLado('A')}
                            {m.result ? (
                              <span className="font-mono text-gold font-bold text-lg shrink-0">{m.result.setsA} — {m.result.setsB}</span>
                            ) : (
                              <span className="text-chalk/20 font-mono shrink-0">vs</span>
                            )}
                            {renderLado('B')}
                          </>
                        );
                      })()}
                    </div>
                    {m.sets && m.sets.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {m.sets.map(s => (
                          <div key={s.setNumber} className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-chalk/30 w-8">S{s.setNumber}</span>
                            <span className={s.pointsA > s.pointsB ? 'text-gold font-bold' : 'text-chalk/50'}>{s.pointsA}</span>
                            <span className="text-chalk/20">—</span>
                            <span className={s.pointsB > s.pointsA ? 'text-gold font-bold' : 'text-chalk/50'}>{s.pointsB}</span>
                            {s.pointsA > s.pointsB ? <span className="text-gold text-xs">← ✓</span> : <span className="text-gold text-xs">✓ →</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {m.result?.isWO && <p className="text-xs text-red-400 font-mono mt-0.5">W.O.</p>}
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    {m.status === 'pendiente' && (
                      <>
                        <button className="btn-secondary text-xs py-1" onClick={() => { setAssignModal(m); setSelectedTable(''); }}>Asignar Mesa</button>
                        <button className="btn-primary text-xs py-1" onClick={() => handleAutoAssign(m.id)} disabled={freeTables.length === 0}>Auto-Asignar</button>
                      </>
                    )}
                    {m.status === 'asignado' && (
                      <button className="btn-primary text-xs py-1" onClick={() => handleStart(m.id)}>▶ Iniciar</button>
                    )}
                    {m.status === 'en_juego' && (
                      <button className="py-1 px-3 text-xs rounded-lg border border-gold/50 text-gold hover:bg-gold/10 transition-all font-semibold" onClick={() => openResultModal(m)}>
                        📋 Cargar Resultado
                      </button>
                    )}
                    {(m.status === 'finalizado' || m.status === 'wo') && m.result?.winnerId && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400 font-semibold">
                          🏆 {playerName(m.result.winnerId === m.playerAId ? m.playerA : m.playerB)}
                        </span>
                        {user?.role === 'admin' && (
                          <button
                            className="py-0.5 px-2 text-xs rounded border border-orange/40 text-orange hover:bg-orange/10 transition-all font-semibold"
                            onClick={() => { openResultModal(m); }}
                          >
                            ✏️ Editar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal asignar mesa */}
      {assignModal && (
        <Modal title="ASIGNAR MESA" onClose={() => setAssignModal(null)}>
          <p className="text-chalk/60 text-sm mb-4">{playerName(assignModal.playerA)} vs {playerName(assignModal.playerB)}</p>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Mesa libre</label>
              {freeTables.length === 0 ? (
                <p className="text-red-400 text-sm">No hay mesas libres disponibles</p>
              ) : (
                <select className="input" value={selectedTable} onChange={e => setSelectedTable(e.target.value)} required>
                  <option value="">Seleccionar mesa</option>
                  {freeTables.map(t => <option key={t.id} value={t.id}>Mesa {t.number} — {t.venue?.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={saving || freeTables.length === 0}>{saving ? 'Asignando...' : 'Asignar'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setAssignModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal cargar resultado — set por set */}
      {resultModal && (() => {
        const { winsA, winsB } = getSummary();
        const setsToWin    = (resultModal as any).ruleSet?.setsToWin ?? 3;
        const pointsPerSet = (resultModal as any).ruleSet?.pointsPerSet ?? 60;
        const bestOf       = (resultModal as any).ruleSet?.bestOf ?? 5;
        const nameA = resultModal.playerA?.firstName ?? 'Jugador A';
        const nameB = resultModal.playerB?.firstName ?? 'Jugador B';
        const matchHasWinner = winsA >= setsToWin || winsB >= setsToWin;

        return (
          <Modal title="CARGAR RESULTADO" onClose={() => setResultModal(null)}>
            <div className="mb-4 text-center">
              <p className="text-chalk/50 text-xs mb-1">{resultModal.phase?.circuit?.tournament?.name} · {resultModal.phase?.name}</p>
              <p className="text-chalk font-semibold">
                {playerName(resultModal.playerA)} <span className="text-gold/60">vs</span> {playerName(resultModal.playerB)}
              </p>
              <p className="text-chalk/40 text-xs mt-1">
                Al mejor de {bestOf} sets · {pointsPerSet} tantos por set · Gana quien llega a {setsToWin} sets
              </p>
            </div>

            {/* Marcador en tiempo real */}
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

            <form onSubmit={handleCloseMatch} className="space-y-4">
              {/* W.O. toggle */}
              <div className="flex items-center gap-3 bg-felt-dark/50 rounded-lg px-3 py-2">
                <input type="checkbox" id="isWO2" checked={isWO} onChange={e => setIsWO(e.target.checked)} className="w-4 h-4 accent-gold" />
                <label htmlFor="isWO2" className="text-chalk/80 text-sm font-medium cursor-pointer">Marcar como W.O. (ausente)</label>
              </div>

              {isWO ? (
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Jugador ausente</label>
                  <select className="input" value={woPlayerId} onChange={e => setWoPlayerId(e.target.value)} required>
                    <option value="">Seleccionar</option>
                    <option value={resultModal.playerAId ?? ''}>{playerName(resultModal.playerA)}</option>
                    <option value={resultModal.playerBId ?? ''}>{playerName(resultModal.playerB)}</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-2 text-center">
                    <p className="col-span-2 text-chalk/60 text-xs uppercase tracking-widest truncate">{nameA}</p>
                    <p className="col-span-1 text-chalk/30 text-xs uppercase tracking-widest">Set</p>
                    <p className="col-span-2 text-chalk/60 text-xs uppercase tracking-widest truncate">{nameB}</p>
                    <p className="col-span-2"></p>
                  </div>

                  {sets.map((s, i) => {
                    const winner = calcSetWinner(s.a, s.b, pointsPerSet);
                    const isSaving = savingSet === i;
                    return (
                      <div key={i} className={`grid grid-cols-7 gap-2 items-center rounded-lg px-2 py-1 ${s.saved ? 'bg-gold/10' : 'bg-felt-dark/30'}`}>
                        <input
                          type="number" min="0"
                          className={`col-span-2 input text-center font-mono text-lg ${winner === 'a' ? 'border-gold/50' : ''}`}
                          value={s.a} onChange={e => updateSet(i, 'a', e.target.value)}
                          disabled={s.saved} placeholder="0"
                        />
                        <div className="col-span-1 text-center">
                          <span className="text-chalk/40 font-mono text-sm">{i + 1}</span>
                          {winner && s.saved && <span className="ml-1 text-xs text-gold">{winner === 'a' ? '←' : '→'}</span>}
                        </div>
                        <input
                          type="number" min="0"
                          className={`col-span-2 input text-center font-mono text-lg ${winner === 'b' ? 'border-gold/50' : ''}`}
                          value={s.b} onChange={e => updateSet(i, 'b', e.target.value)}
                          disabled={s.saved} placeholder="0"
                        />
                        <div className="col-span-2">
                          {!s.saved ? (
                            <button type="button" className="btn-primary text-xs py-1 w-full" onClick={() => handleSaveSet(i)} disabled={isSaving || !s.a || !s.b}>
                              {isSaving ? '...' : '✓ Set'}
                            </button>
                          ) : (
                            <span className="text-green-400 text-xs text-center block">✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <p className="text-chalk/30 text-xs text-center font-mono">
                    El ganador del set debe llegar a {pointsPerSet} tantos
                  </p>
                </div>
              )}

              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Notas (opcional)</label>
                <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." />
              </div>

              {resError && <p className="text-red-400 text-sm">{resError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={resSaving || (!isWO && !matchHasWinner)}>
                  {resSaving ? 'Guardando...' : (resultModal?.status === 'finalizado' || resultModal?.status === 'wo') ? (matchHasWinner ? '✓ Guardar cambios' : 'Confirmar sets primero...') : matchHasWinner || isWO ? '✓ Cerrar Partido' : 'Partido en curso...'}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setResultModal(null)}>Cerrar</button>
              </div>
            </form>
          </Modal>
        );
      })()}
      {subModal && (
        <Modal onClose={() => setSubModal(null)} title="Sustituir jugador">
          <p className="text-chalk/60 text-sm mb-1">
            Lugar provisorio: <span className="text-orange italic">{subModal.slotLabel}</span>
          </p>
          <p className="text-chalk/40 text-xs mb-4 font-mono">
            {subModal.match.phase?.circuit?.tournament?.name} · {subModal.match.phase?.name}
            {subModal.match.table && ` · Mesa ${subModal.match.table.number}`}
          </p>
          <form onSubmit={handleSustituir} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Jugador real</label>
              <select className="input" value={subSelected} onChange={e => setSubSelected(e.target.value)} required>
                <option value="">Elegir jugador…</option>
                {subPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.lastName}, {p.firstName}</option>
                ))}
              </select>
              <p className="text-chalk/30 text-xs mt-1.5">La mesa y el horario del partido se conservan.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={subSaving || !subSelected}>
                {subSaving ? 'Sustituyendo…' : '✓ Sustituir'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setSubModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}

