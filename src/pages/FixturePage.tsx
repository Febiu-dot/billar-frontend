import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Tournament, Match, Phase, Circuit, Player } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner, EmptyState, Modal } from '../components/ui';

const PHASE_TYPES = ['clasificatorio', 'segunda', 'primera', 'master'];
const CATEGORY_ORDER: Record<string, number> = { master: 1, primera: 2, segunda: 3, tercera: 4 };

export default function FixturePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [tournamentModal, setTournamentModal] = useState(false);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [tForm, setTForm] = useState({ name: '', year: new Date().getFullYear().toString(), description: '', active: true });
  const [tSaving, setTSaving] = useState(false);
  const [tError, setTError] = useState('');

  const [circuitModal, setCircuitModal] = useState<Tournament | null>(null);
  const [cForm, setCForm] = useState({ name: '', order: '1', startDate: '', endDate: '' });
  const [cSaving, setCSaving] = useState(false);
  const [cError, setCError] = useState('');

  const [phaseModal, setPhaseModal] = useState<Circuit | null>(null);
  const [pForm, setPForm] = useState({ name: '', type: 'clasificatorio', order: '1' });
  const [pSaving, setPSaving] = useState(false);
  const [pError, setPError] = useState('');

  const [inscripcionModal, setInscripcionModal] = useState<Circuit | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [inscripcionLoading, setInscripcionLoading] = useState(false);
  const [inscripcionSearch, setInscripcionSearch] = useState('');
  const [inscripcionSaving, setInscripcionSaving] = useState<number | null>(null);

  const [generando, setGenerando] = useState<number | null>(null);

  const fetchTournaments = () =>
    api.get('/tournaments').then(r => {
      setTournaments(r.data);
      setLoading(false);
    });

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

  const refreshSelected = () => {
    if (selectedTournament) loadTournament(selectedTournament.id);
    fetchTournaments();
  };

  const openAddTournament = () => {
    setEditTournament(null);
    setTForm({ name: '', year: new Date().getFullYear().toString(), description: '', active: true });
    setTError('');
    setTournamentModal(true);
  };

  const openEditTournament = (t: Tournament) => {
    setEditTournament(t);
    setTForm({ name: t.name, year: t.year.toString(), description: t.description ?? '', active: t.active });
    setTError('');
    setTournamentModal(true);
  };

  const handleTournamentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTSaving(true);
    setTError('');
    try {
      const payload = { ...tForm, year: Number(tForm.year) };
      if (editTournament) {
        await api.put(`/tournaments/${editTournament.id}`, payload);
      } else {
        const res = await api.post('/tournaments', payload);
        loadTournament(res.data.id);
      }
      setTournamentModal(false);
      fetchTournaments();
      if (editTournament && selectedTournament?.id === editTournament.id) {
        loadTournament(editTournament.id);
      }
    } catch {
      setTError('Error al guardar el torneo');
    } finally {
      setTSaving(false);
    }
  };

  const handleDeleteTournament = async (t: Tournament) => {
    if (!confirm(`¿Eliminar el torneo "${t.name}"?`)) return;
    try {
      await api.delete(`/tournaments/${t.id}`);
      setSelectedTournament(null);
      fetchTournaments();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar el torneo');
    }
  };

  const openAddCircuit = (t: Tournament) => {
    setCircuitModal(t);
    const nextOrder = (t.circuits?.length ?? 0) + 1;
    setCForm({ name: `Circuito ${nextOrder}`, order: nextOrder.toString(), startDate: '', endDate: '' });
    setCError('');
  };

  const handleCircuitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circuitModal) return;
    setCSaving(true);
    setCError('');
    try {
      await api.post(`/tournaments/${circuitModal.id}/circuits`, {
        ...cForm,
        order: Number(cForm.order),
        startDate: cForm.startDate || undefined,
        endDate: cForm.endDate || undefined,
      });
      setCircuitModal(null);
      refreshSelected();
    } catch {
      setCError('Error al crear el circuito');
    } finally {
      setCSaving(false);
    }
  };

  const handleDeleteCircuit = async (circuit: Circuit) => {
    if (!confirm(`¿Eliminar el circuito "${circuit.name}"?`)) return;
    try {
      await api.delete(`/tournaments/circuits/${circuit.id}`);
      refreshSelected();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar el circuito');
    }
  };

  const openAddPhase = (circuit: Circuit) => {
    setPhaseModal(circuit);
    const nextOrder = (circuit.phases?.length ?? 0) + 1;
    setPForm({ name: '', type: 'clasificatorio', order: nextOrder.toString() });
    setPError('');
  };

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseModal) return;
    setPSaving(true);
    setPError('');
    try {
      await api.post(`/tournaments/circuits/${phaseModal.id}/phases`, {
        ...pForm,
        order: Number(pForm.order),
      });
      setPhaseModal(null);
      refreshSelected();
    } catch {
      setPError('Error al crear la fase');
    } finally {
      setPSaving(false);
    }
  };

  const handleDeletePhase = async (phase: Phase) => {
    if (!confirm(`¿Eliminar la fase "${phase.name}"?`)) return;
    try {
      await api.delete(`/tournaments/phases/${phase.id}`);
      refreshSelected();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar la fase');
    }
  };

  const openInscripcion = async (circuit: Circuit) => {
    setInscripcionModal(circuit);
    setInscripcionSearch('');
    setInscripcionLoading(true);
    try {
      const res = await api.get('/players');
      setAllPlayers(res.data);
    } catch {
      setAllPlayers([]);
    } finally {
      setInscripcionLoading(false);
    }
  };

  const handleInscribir = async (circuit: Circuit, playerId: number) => {
    setInscripcionSaving(playerId);
    try {
      await api.post(`/circuits/${circuit.id}/players`, { playerId });
      if (selectedTournament) {
        const res = await api.get(`/tournaments/${selectedTournament.id}`);
        setSelectedTournament(res.data);
        const updatedCircuit = res.data.circuits?.find((c: Circuit) => c.id === circuit.id);
        if (updatedCircuit) setInscripcionModal(updatedCircuit);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al inscribir jugador');
    } finally {
      setInscripcionSaving(null);
    }
  };

  const handleDesinscribir = async (circuit: Circuit, playerId: number) => {
    setInscripcionSaving(playerId);
    try {
      await api.delete(`/circuits/${circuit.id}/players/${playerId}`);
      if (selectedTournament) {
        const res = await api.get(`/tournaments/${selectedTournament.id}`);
        setSelectedTournament(res.data);
        const updatedCircuit = res.data.circuits?.find((c: Circuit) => c.id === circuit.id);
        if (updatedCircuit) setInscripcionModal(updatedCircuit);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al desinscribir jugador');
    } finally {
      setInscripcionSaving(null);
    }
  };

  const handleGenerarPartidos = async (circuit: Circuit) => {
    if (!confirm(`¿Generar partidos para "${circuit.name}"?\n\nSi ya hay partidos creados, serán eliminados y regenerados.`)) return;
    setGenerando(circuit.id);
    try {
      const res = await api.post(`/circuits/${circuit.id}/generate`);
      const d = res.data.detalle;
      alert(`✅ Partidos generados correctamente\n\nClasificatorio: ${d.clasificatorio}\nSegunda: ${d.segunda}\nPrimera: ${d.primera}\nMáster: ${d.master}\n\nTotal: ${res.data.total}`);
      refreshSelected();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al generar partidos');
    } finally {
      setGenerando(null);
    }
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
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-gold">FIXTURE</h1>
          <p className="text-chalk/50 text-sm mt-1">Cuadro y cruce de partidos por fase</p>
        </div>
        <button className="btn-primary" onClick={openAddTournament}>+ Nuevo Torneo</button>
      </div>

      <div className="p-6 space-y-6">
        {tournaments.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
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
          <EmptyState message="No hay torneos disponibles. Creá uno con el botón de arriba." />
        ) : (
          <div className="space-y-8">
            <div className="card flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl text-gold">{selectedTournament.name}</h2>
                <p className="text-chalk/40 text-sm">{selectedTournament.year}</p>
                {selectedTournament.description && (
                  <p className="text-chalk/50 text-sm mt-1">{selectedTournament.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className={`badge-status ${selectedTournament.active ? 'bg-green-900/40 text-green-400' : 'bg-chalk/10 text-chalk/40'}`}>
                  {selectedTournament.active ? 'Activo' : 'Finalizado'}
                </span>
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => openEditTournament(selectedTournament)}>Editar</button>
                <button
                  className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                  onClick={() => handleDeleteTournament(selectedTournament)}
                >Eliminar</button>
                <button className="btn-primary py-1 px-3 text-xs" onClick={() => openAddCircuit(selectedTournament)}>+ Circuito</button>
              </div>
            </div>

            {selectedTournament.circuits?.length === 0 ? (
              <div className="card text-center text-chalk/30 py-8">
                Sin circuitos. Agregá uno con el botón "+ Circuito".
              </div>
            ) : (
              selectedTournament.circuits?.map(circuit => (
                <div key={circuit.id}>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
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
                    <div className="flex gap-2 ml-auto flex-wrap">
                      <button
                        className="py-1 px-3 text-xs rounded-lg border border-blue-700/40 text-blue-300 hover:bg-blue-900/20 transition-all"
                        onClick={() => openInscripcion(circuit)}
                      >
                        👥 Inscripción ({circuit.players?.length ?? 0})
                      </button>
                      <button
                        className="py-1 px-3 text-xs rounded-lg border border-gold/40 text-gold hover:bg-gold/10 transition-all disabled:opacity-40"
                        disabled={generando === circuit.id}
                        onClick={() => handleGenerarPartidos(circuit)}
                      >
                        {generando === circuit.id ? 'Generando...' : '⚡ Generar partidos'}
                      </button>
                      <button className="btn-primary py-1 px-3 text-xs" onClick={() => openAddPhase(circuit)}>+ Fase</button>
                      <button
                        className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                        onClick={() => handleDeleteCircuit(circuit)}
                      >Eliminar</button>
                    </div>
                  </div>

                  {circuit.phases?.length === 0 ? (
                    <p className="text-chalk/30 text-sm pl-2">Sin fases. Agregá una con "+ Fase".</p>
                  ) : (
                    circuit.phases?.map((phase: Phase) => {
                      const matchesByRound = getMatchesByRound(phase.matches ?? []);
                      const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
                      return (
                        <div key={phase.id} className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-semibold text-chalk/80 uppercase text-sm tracking-wider">{phase.name}</h4>
                            <span className="badge-status bg-felt-light/20 text-chalk/40 text-xs capitalize">{phase.type}</span>
                            <span className="text-chalk/20 text-xs font-mono">{phase.matches?.length ?? 0} partidos</span>
                            <button
                              className="ml-auto py-0.5 px-2 text-xs rounded border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                              onClick={() => handleDeletePhase(phase)}
                            >Eliminar</button>
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
              ))
            )}
          </div>
        )}
      </div>

      {/* Tournament modal */}
      {tournamentModal && (
        <Modal title={editTournament ? 'EDITAR TORNEO' : 'NUEVO TORNEO'} onClose={() => setTournamentModal(false)}>
          <form onSubmit={handleTournamentSubmit} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nombre *</label>
              <input className="input" value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} required placeholder="Ej: Torneo Nacional 2026" />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Año *</label>
              <input type="number" className="input" value={tForm.year} onChange={e => setTForm({ ...tForm, year: e.target.value })} required />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Descripción</label>
              <input className="input" value={tForm.description} onChange={e => setTForm({ ...tForm, description: e.target.value })} placeholder="Departamental, Regional, Nacional..." />
            </div>
            <div className="flex items-center gap-3 bg-felt-dark/50 rounded-lg px-3 py-2">
              <input type="checkbox" id="active" checked={tForm.active} onChange={e => setTForm({ ...tForm, active: e.target.checked })} className="w-4 h-4 accent-gold" />
              <label htmlFor="active" className="text-chalk/80 text-sm cursor-pointer">Torneo activo</label>
            </div>
            {tError && <p className="text-red-400 text-sm">{tError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={tSaving}>{tSaving ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setTournamentModal(false)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Circuit modal */}
      {circuitModal && (
        <Modal title="NUEVO CIRCUITO" onClose={() => setCircuitModal(null)}>
          <form onSubmit={handleCircuitSubmit} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nombre *</label>
              <input className="input" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} required placeholder="Ej: Primer Circuito" />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Orden *</label>
              <input type="number" min="1" className="input" value={cForm.order} onChange={e => setCForm({ ...cForm, order: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fecha inicio</label>
                <input type="date" className="input" value={cForm.startDate} onChange={e => setCForm({ ...cForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fecha fin</label>
                <input type="date" className="input" value={cForm.endDate} onChange={e => setCForm({ ...cForm, endDate: e.target.value })} />
              </div>
            </div>
            {cError && <p className="text-red-400 text-sm">{cError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={cSaving}>{cSaving ? 'Guardando...' : 'Crear Circuito'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setCircuitModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Phase modal */}
      {phaseModal && (
        <Modal title="NUEVA FASE" onClose={() => setPhaseModal(null)}>
          <form onSubmit={handlePhaseSubmit} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nombre *</label>
              <input className="input" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} required placeholder="Ej: Fase Clasificatoria" />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Tipo *</label>
              <select className="input" value={pForm.type} onChange={e => setPForm({ ...pForm, type: e.target.value })}>
                {PHASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Orden *</label>
              <input type="number" min="1" className="input" value={pForm.order} onChange={e => setPForm({ ...pForm, order: e.target.value })} required />
            </div>
            {pError && <p className="text-red-400 text-sm">{pError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={pSaving}>{pSaving ? 'Guardando...' : 'Crear Fase'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setPhaseModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inscripción modal */}
      {inscripcionModal && (
        <Modal title={`INSCRIPCIÓN — ${inscripcionModal.name}`} onClose={() => setInscripcionModal(null)}>
          <div className="space-y-4">
            <input
              className="input"
              placeholder="Buscar jugador por nombre o club..."
              value={inscripcionSearch}
              onChange={e => setInscripcionSearch(e.target.value)}
            />
            {inscripcionLoading ? (
              <div className="text-center py-6 text-chalk/40">Cargando jugadores...</div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">

                {/* Inscriptos */}
                <div>
                  <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2">
                    Inscriptos ({inscripcionModal.players?.length ?? 0})
                  </p>
                  {(inscripcionModal.players?.length ?? 0) === 0 ? (
                    <p className="text-chalk/20 text-sm pl-1">Sin jugadores inscriptos aún.</p>
                  ) : (
                    <div className="space-y-1">
                      {inscripcionModal.players
                        ?.filter(cp => {
                          const nombre = `${cp.player.firstName} ${cp.player.lastName} ${cp.player.club ?? ''}`.toLowerCase();
                          return nombre.includes(inscripcionSearch.toLowerCase());
                        })
                        .map(cp => (
                          <div key={cp.player.id} className="flex items-center justify-between bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2">
                            <div>
                              <span className="text-chalk/90 text-sm font-medium">{cp.player.lastName}, {cp.player.firstName}</span>
                              <span className="text-chalk/40 text-xs ml-2">{cp.player.club ?? ''}</span>
                              <span className="text-blue-400/60 text-xs ml-2 capitalize">{cp.player.category?.name}</span>
                            </div>
                            <button
                              className="py-0.5 px-2 text-xs rounded border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-40"
                              disabled={inscripcionSaving === cp.player.id}
                              onClick={() => handleDesinscribir(inscripcionModal, cp.player.id)}
                            >
                              {inscripcionSaving === cp.player.id ? '...' : 'Quitar'}
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Disponibles por club */}
                <div>
                  <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2">
                    Disponibles para inscribir
                  </p>
                  {(() => {
                    const inscriptosIds = new Set(inscripcionModal.players?.map(cp => cp.player.id) ?? []);
                    const disponibles = allPlayers.filter(p => {
                      if (inscriptosIds.has(p.id)) return false;
                      const nombre = `${p.firstName} ${p.lastName} ${p.club ?? ''}`.toLowerCase();
                      return nombre.includes(inscripcionSearch.toLowerCase());
                    });
                    if (disponibles.length === 0) return (
                      <p className="text-chalk/20 text-sm pl-1">No hay jugadores disponibles.</p>
                    );
                    // Agrupar por club
                    const porClub: Record<string, typeof disponibles> = {};
                    disponibles.forEach(p => {
                      const club = p.club ?? 'Sin club';
                      if (!porClub[club]) porClub[club] = [];
                      porClub[club].push(p);
                    });
                    // Ordenar jugadores dentro de cada club por categoría
                    Object.values(porClub).forEach(jugadores =>
                      jugadores.sort((a, b) =>
                        (CATEGORY_ORDER[(a as any).category?.name] ?? 9) - (CATEGORY_ORDER[(b as any).category?.name] ?? 9)
                      )
                    );
                    const clubsOrdenados = Object.keys(porClub).sort();
                    return (
                      <div className="space-y-4">
                        {clubsOrdenados.map(club => (
                          <div key={club}>
                            <p className="text-gold/60 text-xs uppercase tracking-widest font-mono mb-1 px-1 border-b border-gold/10 pb-1">{club}</p>
                            <div className="space-y-1 mt-1">
                              {porClub[club].map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-felt-dark/40 border border-felt-light/10 rounded-lg px-3 py-2">
                                  <div>
                                    <span className="text-chalk/70 text-sm">{p.lastName}, {p.firstName}</span>
                                    <span className={`text-xs ml-2 capitalize font-mono ${
                                      (p as any).category?.name === 'master' ? 'text-gold/60' :
                                      (p as any).category?.name === 'primera' ? 'text-blue-400/60' :
                                      (p as any).category?.name === 'segunda' ? 'text-green-400/60' :
                                      'text-chalk/30'
                                    }`}>{(p as any).category?.name}</span>
                                  </div>
                                  <button
                                    className="py-0.5 px-2 text-xs rounded border border-green-700/40 text-green-400 hover:bg-green-900/20 transition-all disabled:opacity-40"
                                    disabled={inscripcionSaving === p.id}
                                    onClick={() => handleInscribir(inscripcionModal, p.id)}
                                  >
                                    {inscripcionSaving === p.id ? '...' : '+ Inscribir'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const winnerA = match.result?.winnerId === match.playerAId;
  const winnerB = match.result?.winnerId === match.playerBId;
  const isFinished = match.status === 'finalizado' || match.status === 'wo';

  return (
    <div className={`rounded-lg border overflow-hidden text-sm transition-all ${
      match.status === 'en_juego' ? 'border-gold/40 bg-gold/5' :
      match.status === 'asignado' ? 'border-blue-700/40 bg-blue-900/10' :
      isFinished ? 'border-felt-light/20 bg-felt/50' :
      'border-felt-light/15 bg-felt-dark/30'
    }`}>
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
      <div className="flex items-center justify-between px-3 py-1 bg-felt-dark/30 border-t border-felt-light/10">
        <MatchStatusBadge status={match.status} />
        {match.table && <span className="text-chalk/25 text-xs font-mono">Mesa {match.table.number}</span>}
        {match.result?.isWO && <span className="text-red-400 text-xs font-mono">W.O.</span>}
      </div>
    </div>
  );
}
