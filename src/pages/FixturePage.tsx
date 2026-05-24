import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Tournament, Match, Phase, Circuit, Player, Departamento } from '../types';
import { MatchStatusBadge, playerName, LoadingSpinner, EmptyState, Modal } from '../components/ui';

const PHASE_TYPES = ['clasificatorio', 'segunda', 'primera', 'master'];
const CATEGORY_ORDER: Record<string, number> = { master: 1, primera: 2, segunda: 3, tercera: 4 };

interface PreviewSerie {
  serie: number;
  jugadores: { id: number; nombre: string; esLibre?: boolean; esClasificado?: boolean }[];
}

interface PreviewData {
  tipo?: 'nacional' | 'departamental';
  categoriaFederal?: string;
  config?: any;
  inscriptos: {
    total?: number;
    clasificatorio?: number;
    master?: number;
    primera?: number;
    segunda?: number;
    tercera?: number;
  };
  clasificatorio: {
    totalJugadores: number;
    totalSeries: number;
    totalClasificados?: number;
    series: PreviewSerie[];
    crucesReduccion?: { cruce: number; slotA: string; slotB: string }[];
  };
  bracket?: { descripcion: string; totalPartidos: number };
  segundaPreview?: { totalSeries: number; series: any[] };
  primeraPreview?: { totalCruces: number; cruces: any[] };
  masterPreview?: { totalCruces: number; cruces: any[] };
}

type PreviewTab = 'series' | 'reduccion' | 'segunda' | 'primera' | 'master' | 'bracket';

// ── Labels legibles para rounds del bracket Nacional ──────────────────
function getNacRoundLabel(round: number): string {
  if (round >= 101 && round <= 108) return `WB R1 · P${round - 100}`;
  if (round >= 111 && round <= 114) return `WB R2 · P${round - 110}`;
  if (round === 121) return 'WB SF · P1';
  if (round === 122) return 'WB SF · P2';
  if (round === 131) return 'WB Final';
  if (round >= 201 && round <= 204) return `LB R1 · P${round - 200}`;
  if (round >= 211 && round <= 214) return `LB R2 · P${round - 210}`;
  if (round === 221) return 'LB R3 · P1';
  if (round === 222) return 'LB R3 · P2';
  if (round === 231) return 'LB R4 · P1';
  if (round === 232) return 'LB R4 · P2';
  if (round === 241) return 'LB Final';
  if (round === 251) return '🏆 Grand Final';
  return `Ronda ${round}`;
}

export default function FixturePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [circuitosOcultos, setCircuitosOcultos] = useState<Set<number>>(new Set());

  const [tournamentModal, setTournamentModal] = useState(false);
  const [editTournament, setEditTournament] = useState<Tournament | null>(null);
  const [tForm, setTForm] = useState({ name: '', year: new Date().getFullYear().toString(), description: '', active: true, departamentoId: '' });
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
  const [soloDepTorneo, setSoloDepTorneo] = useState(true);
  const [inscripcionSaving, setInscripcionSaving] = useState<number | null>(null);
  const [inscribiendoClub, setInscribiendoClub] = useState<string | null>(null);

  const [generando, setGenerando] = useState<number | null>(null);
  const [previewModal, setPreviewModal] = useState<{ circuit: Circuit; data: PreviewData } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('series');

  const fetchTournaments = () =>
    api.get('/tournaments').then(r => { setTournaments(r.data); setLoading(false); });

  useEffect(() => {
    api.get('/departamentos').then(r => setDepartamentos(r.data));
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
      const circuits: Circuit[] = r.data.circuits ?? [];
      if (circuits.length > 1) {
        const maxOrder = Math.max(...circuits.map((c: any) => c.order ?? 0));
        const anteriores: Set<number> = new Set(
          circuits.filter((c: any) => (c.order ?? 0) < maxOrder).map((c: any) => c.id)
        );
        setCircuitosOcultos(anteriores);
      }
    });
  };

  const refreshSelected = () => {
    if (selectedTournament) loadTournament(selectedTournament.id);
    fetchTournaments();
  };

  const toggleCircuito = (circuitId: number) => {
    setCircuitosOcultos(prev => {
      const next: Set<number> = new Set(prev);
      if (next.has(circuitId)) next.delete(circuitId);
      else next.add(circuitId);
      return next;
    });
  };

  const openAddTournament = () => {
    setEditTournament(null);
    setTForm({ name: '', year: new Date().getFullYear().toString(), description: '', active: true, departamentoId: '' });
    setTError(''); setTournamentModal(true);
  };

  const openEditTournament = (t: Tournament) => {
    setEditTournament(t);
    setTForm({ name: t.name, year: t.year.toString(), description: t.description ?? '', active: t.active, departamentoId: t.departamentoId?.toString() ?? '' });
    setTError(''); setTournamentModal(true);
  };

  const handleTournamentSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setTSaving(true); setTError('');
    try {
      const payload = { ...tForm, year: Number(tForm.year), departamentoId: tForm.departamentoId ? Number(tForm.departamentoId) : undefined };
      if (editTournament) { await api.put(`/tournaments/${editTournament.id}`, payload); }
      else { const res = await api.post('/tournaments', payload); loadTournament(res.data.id); }
      setTournamentModal(false); fetchTournaments();
      if (editTournament && selectedTournament?.id === editTournament.id) loadTournament(editTournament.id);
    } catch { setTError('Error al guardar el torneo'); }
    finally { setTSaving(false); }
  };

  const handleDeleteTournament = async (t: Tournament) => {
    if (!confirm(`¿Eliminar el torneo "${t.name}"?`)) return;
    try { await api.delete(`/tournaments/${t.id}`); setSelectedTournament(null); fetchTournaments(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'Error al eliminar el torneo'); }
  };

  const openAddCircuit = (t: Tournament) => {
    setCircuitModal(t);
    const nextOrder = (t.circuits?.length ?? 0) + 1;
    setCForm({ name: `Circuito ${nextOrder}`, order: nextOrder.toString(), startDate: '', endDate: '' });
    setCError('');
  };

  const handleCircuitSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!circuitModal) return; setCSaving(true); setCError('');
    try {
      await api.post(`/tournaments/${circuitModal.id}/circuits`, { ...cForm, order: Number(cForm.order), startDate: cForm.startDate || undefined, endDate: cForm.endDate || undefined });
      setCircuitModal(null); refreshSelected();
    } catch { setCError('Error al crear el circuito'); }
    finally { setCSaving(false); }
  };

  const handleDeleteCircuit = async (circuit: Circuit) => {
    if (!confirm(`¿Eliminar el circuito "${circuit.name}"?`)) return;
    try { await api.delete(`/tournaments/circuits/${circuit.id}`); refreshSelected(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'Error al eliminar el circuito'); }
  };

  const openAddPhase = (circuit: Circuit) => {
    setPhaseModal(circuit);
    const nextOrder = (circuit.phases?.length ?? 0) + 1;
    setPForm({ name: '', type: 'clasificatorio', order: nextOrder.toString() });
    setPError('');
  };

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!phaseModal) return; setPSaving(true); setPError('');
    try {
      await api.post(`/tournaments/circuits/${phaseModal.id}/phases`, { ...pForm, order: Number(pForm.order) });
      setPhaseModal(null); refreshSelected();
    } catch { setPError('Error al crear la fase'); }
    finally { setPSaving(false); }
  };

  const handleDeletePhase = async (phase: Phase) => {
    if (!confirm(`¿Eliminar la fase "${phase.name}"?`)) return;
    try { await api.delete(`/tournaments/phases/${phase.id}`); refreshSelected(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'Error al eliminar la fase'); }
  };

  const openInscripcion = async (circuit: Circuit) => {
    setInscripcionModal(circuit); setInscripcionSearch(''); setSoloDepTorneo(true); setInscripcionLoading(true);
    try { const res = await api.get('/players'); setAllPlayers(res.data); }
    catch { setAllPlayers([]); }
    finally { setInscripcionLoading(false); }
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
    } catch (err: any) { alert(err?.response?.data?.error ?? 'Error al inscribir jugador'); }
    finally { setInscripcionSaving(null); }
  };

  const handleInscribirTodos = async (circuit: Circuit, jugadores: Player[], label: string) => {
    setInscribiendoClub(label);
    try {
      for (const p of jugadores) { try { await api.post(`/circuits/${circuit.id}/players`, { playerId: p.id }); } catch { } }
      if (selectedTournament) {
        const res = await api.get(`/tournaments/${selectedTournament.id}`);
        setSelectedTournament(res.data);
        const updatedCircuit = res.data.circuits?.find((c: Circuit) => c.id === circuit.id);
        if (updatedCircuit) setInscripcionModal(updatedCircuit);
      }
    } finally { setInscribiendoClub(null); }
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
    } catch (err: any) { alert(err?.response?.data?.error ?? 'Error al desinscribir jugador'); }
    finally { setInscripcionSaving(null); }
  };

  const handleAbrirPreview = async (circuit: Circuit) => {
    setPreviewLoading(circuit.id);
    try {
      const res = await api.get(`/circuits/${circuit.id}/preview`);
      setPreviewTab('series');
      setPreviewModal({ circuit, data: res.data });
    } catch (err: any) { alert(err?.response?.data?.error ?? 'Error al cargar la vista previa'); }
    finally { setPreviewLoading(null); }
  };

  // ── Generar partidos — maneja Departamental y Nacional ───────────────
  const handleConfirmarGenerar = async () => {
    if (!previewModal) return;
    const circuit = previewModal.circuit;
    setPreviewModal(null); setGenerando(circuit.id);
    try {
      const res = await api.post(`/circuits/${circuit.id}/generate`);
      const d = res.data.detalle;
      const esNac = res.data.config?.tipo === 'nacional';
      if (esNac) {
        alert(
          `✅ Partidos Nacional generados correctamente\n\n` +
          `Series (Clasificatorio): ${d.series ?? 0}\n` +
          `Bracket (Master): ${d.bracket ?? 0}\n\n` +
          `Total: ${res.data.total}`
        );
      } else {
        alert(
          `✅ Partidos generados correctamente\n\n` +
          `Clasificatorio: ${d.clasificatorio}\n` +
          `Segunda: ${d.segunda}\n` +
          `Primera: ${d.primera}\n` +
          `Máster: ${d.master}\n\n` +
          `Total: ${res.data.total}`
        );
      }
      refreshSelected();
    } catch (err: any) { alert(err?.response?.data?.error ?? 'Error al generar partidos'); }
    finally { setGenerando(null); }
  };

  const getMatchesByRound = (matches: Match[]) => {
    const rounds: Record<number, Match[]> = {};
    matches.forEach(m => { if (!rounds[m.round]) rounds[m.round] = []; rounds[m.round].push(m); });
    return rounds;
  };

  const getRoundsSorted = (matchesByRound: Record<number, Match[]>) => {
    return Object.keys(matchesByRound).map(Number).map(round => ({
      round, scheduledAt: (matchesByRound[round][0] as any).scheduledAt
    })).sort((a, b) => {
      if (!a.scheduledAt && !b.scheduledAt) return a.round - b.round;
      if (!a.scheduledAt) return 1; if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    }).map(r => r.round);
  };

  if (loading) return <LoadingSpinner />;

  // ── Tabs del preview modal — dinámicos según tipo ────────────────────
  const buildPreviewTabs = (data: PreviewData) => {
    if (data.tipo === 'nacional') {
      return [
        { key: 'series',  label: `Series (${data.clasificatorio.totalSeries})` },
        { key: 'bracket', label: `Bracket (${data.bracket?.totalPartidos ?? 29} partidos)` },
      ];
    }
    return [
      { key: 'series',    label: `Series (${data.clasificatorio.totalSeries})` },
      { key: 'reduccion', label: `Reducción (${data.clasificatorio.crucesReduccion?.length ?? 0})` },
      { key: 'segunda',   label: `Segunda (${data.segundaPreview?.totalSeries ?? 0} series)` },
      { key: 'primera',   label: `Primera (${data.primeraPreview?.totalCruces ?? 0} cruces)` },
      { key: 'master',    label: `Master (${data.masterPreview?.totalCruces ?? 0} cruces)` },
    ];
  };

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
            <select className="input w-auto" onChange={e => loadTournament(Number(e.target.value))} value={selectedTournament?.id ?? ''}>
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
            </select>
          </div>
        )}

        {detailLoading ? <LoadingSpinner /> : !selectedTournament ? (
          <EmptyState message="No hay torneos disponibles." />
        ) : (
          <div className="space-y-8">
            <div className="card flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl text-gold">{selectedTournament.name}</h2>
                <p className="text-chalk/40 text-sm">{selectedTournament.year}</p>
                {selectedTournament.description && <p className="text-chalk/50 text-sm mt-1">{selectedTournament.description}</p>}
                {selectedTournament.departamento && <p className="text-gold/50 text-xs font-mono mt-1">{selectedTournament.departamento.nombre}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className={`badge-status ${selectedTournament.active ? 'bg-green-900/40 text-green-400' : 'bg-chalk/10 text-chalk/40'}`}>
                  {selectedTournament.active ? 'Activo' : 'Finalizado'}
                </span>
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => openEditTournament(selectedTournament)}>Editar</button>
                <button className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all" onClick={() => handleDeleteTournament(selectedTournament)}>Eliminar</button>
                <button className="btn-primary py-1 px-3 text-xs" onClick={() => openAddCircuit(selectedTournament)}>+ Circuito</button>
              </div>
            </div>

            {selectedTournament.circuits?.length === 0 ? (
              <div className="card text-center text-chalk/30 py-8">Sin circuitos.</div>
            ) : (
              selectedTournament.circuits?.map(circuit => {
                const oculto = circuitosOcultos.has(circuit.id);
                return (
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
                        {!oculto && (
                          <>
                            <button className="py-1 px-3 text-xs rounded-lg border border-blue-700/40 text-blue-300 hover:bg-blue-900/20 transition-all" onClick={() => openInscripcion(circuit)}>
                              👥 Inscripción ({circuit.players?.length ?? 0})
                            </button>
                            <button
                              className="py-1 px-3 text-xs rounded-lg border border-gold/40 text-gold hover:bg-gold/10 transition-all disabled:opacity-40"
                              disabled={previewLoading === circuit.id || generando === circuit.id}
                              onClick={() => handleAbrirPreview(circuit)}
                            >
                              {previewLoading === circuit.id ? 'Cargando...' : generando === circuit.id ? 'Generando...' : '⚡ Generar partidos'}
                            </button>
                            <button className="btn-primary py-1 px-3 text-xs" onClick={() => openAddPhase(circuit)}>+ Fase</button>
                            <button className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all" onClick={() => handleDeleteCircuit(circuit)}>Eliminar</button>
                          </>
                        )}
                        <button
                          className={`py-1 px-3 text-xs rounded-lg border transition-all ${oculto ? 'border-gold/30 text-gold/70 hover:bg-gold/10' : 'border-chalk/20 text-chalk/40 hover:border-chalk/40'}`}
                          onClick={() => toggleCircuito(circuit.id)}
                        >
                          {oculto ? '👁 Mostrar' : '🙈 Ocultar'}
                        </button>
                      </div>
                    </div>

                    {!oculto && (
                      <>
                        {circuit.phases?.length === 0 ? (
                          <p className="text-chalk/30 text-sm pl-2">Sin fases. Agregá una con "+ Fase".</p>
                        ) : (
                          circuit.phases?.map((phase: Phase) => {
                            const matchesByRound = getMatchesByRound(phase.matches ?? []);
                            const rounds = getRoundsSorted(matchesByRound);
                            return (
                              <div key={phase.id} className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                  <h4 className="font-semibold text-chalk/80 uppercase text-sm tracking-wider">{phase.name}</h4>
                                  <span className="badge-status bg-felt-light/20 text-chalk/40 text-xs capitalize">{phase.type}</span>
                                  <span className="text-chalk/20 text-xs font-mono">{phase.matches?.length ?? 0} partidos</span>
                                  <button className="ml-auto py-0.5 px-2 text-xs rounded border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all" onClick={() => handleDeletePhase(phase)}>Eliminar</button>
                                </div>
                                {rounds.length === 0 ? (
                                  <p className="text-chalk/20 text-xs pl-2">Sin partidos en esta fase</p>
                                ) : (
                                  <div className="flex gap-4 overflow-x-auto pb-2 items-start">
                                    {rounds.map(round => (
                                      <div key={round} className="flex-shrink-0 w-64">
                                        <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2 font-mono">
                                          {matchesByRound[round][0]?.scheduledAt
                                            ? new Date(matchesByRound[round][0].scheduledAt!).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                            : getNacRoundLabel(round)}
                                        </p>
                                        <div className="space-y-2">
                                          {matchesByRound[round].map(m => <MatchCard key={m.id} match={m} />)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </>
                    )}
                  </div>
                );
              })
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
              <input className="input" value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Año *</label>
              <input type="number" className="input" value={tForm.year} onChange={e => setTForm({ ...tForm, year: e.target.value })} required />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Descripción</label>
              <input className="input" value={tForm.description} onChange={e => setTForm({ ...tForm, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Departamento</label>
              <select className="input" value={tForm.departamentoId} onChange={e => setTForm({ ...tForm, departamentoId: e.target.value })}>
                <option value="">Sin departamento</option>
                {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
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
              <input className="input" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} required />
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
              <input className="input" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} required />
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
            <div className="space-y-2">
              <input className="input flex-1 w-full" placeholder="Buscar jugador por nombre o club..." value={inscripcionSearch} onChange={e => setInscripcionSearch(e.target.value)} />
              <div className="flex items-center justify-between flex-wrap gap-2">
                {selectedTournament?.departamentoId && (
                  <>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="soloDepTorneo" checked={soloDepTorneo} onChange={e => setSoloDepTorneo(e.target.checked)} className="w-4 h-4 accent-gold" />
                      <label htmlFor="soloDepTorneo" className="text-chalk/60 text-xs cursor-pointer">Solo {selectedTournament.departamento?.nombre}</label>
                    </div>
                    <button
                      className="py-1 px-3 text-xs rounded border border-gold/40 text-gold hover:bg-gold/10 transition-all disabled:opacity-40"
                      disabled={inscribiendoClub === 'departamento'}
                      onClick={() => {
                        const inscriptosIds = new Set(inscripcionModal.players?.map(cp => cp.player.id) ?? []);
                        const jugadoresDep = allPlayers.filter(p => p.departamentoId === selectedTournament.departamentoId && (p as any).dni !== 'FEBIU000' && !inscriptosIds.has(p.id));
                        handleInscribirTodos(inscripcionModal, jugadoresDep, 'departamento');
                      }}
                    >
                      {inscribiendoClub === 'departamento' ? 'Inscribiendo...' : '⚡ Inscribir todos del departamento'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {inscripcionLoading ? (
              <div className="text-center py-6 text-chalk/40">Cargando jugadores...</div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2">Inscriptos ({inscripcionModal.players?.length ?? 0})</p>
                  {(inscripcionModal.players?.length ?? 0) === 0 ? (
                    <p className="text-chalk/20 text-sm pl-1">Sin jugadores inscriptos aún.</p>
                  ) : (
                    <div className="space-y-1">
                      {inscripcionModal.players
                        ?.filter(cp => {
                          const nombre = `${cp.player.firstName} ${cp.player.lastName} ${cp.player.club ?? ''}`.toLowerCase();
                          return nombre.includes(inscripcionSearch.toLowerCase());
                        })
                        .sort((a, b) => {
                          const clubA = (a.player.club ?? '').toUpperCase();
                          const clubB = (b.player.club ?? '').toUpperCase();
                          if (clubA !== clubB) return clubA.localeCompare(clubB);
                          return a.player.lastName.localeCompare(b.player.lastName);
                        })
                        .map(cp => (
                          <div key={cp.player.id} className="flex items-center justify-between bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2">
                            <div>
                              <span className="text-chalk/90 text-sm font-medium">{cp.player.lastName}, {cp.player.firstName}</span>
                              <span className="text-gold/60 text-xs font-semibold ml-2">{cp.player.club ?? ''}</span>
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

                <div>
                  <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2">Disponibles para inscribir</p>
                  {(() => {
                    const inscriptosIds = new Set(inscripcionModal.players?.map(cp => cp.player.id) ?? []);
                    const disponibles = allPlayers.filter(p => {
                      if (inscriptosIds.has(p.id)) return false;
                      if ((p as any).dni === 'FEBIU000') return false;
                      const nombre = `${p.firstName} ${p.lastName} ${p.club ?? ''}`.toLowerCase();
                      const matchesSearch = nombre.includes(inscripcionSearch.toLowerCase());
                      const matchesDep = soloDepTorneo && selectedTournament?.departamentoId ? p.departamentoId === selectedTournament.departamentoId : true;
                      return matchesSearch && matchesDep;
                    });
                    if (disponibles.length === 0) return <p className="text-chalk/20 text-sm pl-1">No hay jugadores disponibles.</p>;
                    const porClub: Record<string, typeof disponibles> = {};
                    disponibles.forEach(p => { const club = p.club ?? 'Sin club'; if (!porClub[club]) porClub[club] = []; porClub[club].push(p); });
                    Object.values(porClub).forEach(jugadores => jugadores.sort((a, b) => (CATEGORY_ORDER[(a as any).category?.name] ?? 9) - (CATEGORY_ORDER[(b as any).category?.name] ?? 9)));
                    const clubsOrdenados = Object.keys(porClub).sort();
                    return (
                      <div className="space-y-4">
                        {clubsOrdenados.map(club => (
                          <div key={club}>
                            <div className="flex items-center justify-between border-b border-gold/10 pb-1 mb-1">
                              <p className="text-gold/60 text-xs uppercase tracking-widest font-mono">{club} ({porClub[club].length})</p>
                              <button className="py-0.5 px-2 text-xs rounded border border-gold/30 text-gold/70 hover:bg-gold/10 transition-all disabled:opacity-40" disabled={inscribiendoClub === club} onClick={() => handleInscribirTodos(inscripcionModal, porClub[club], club)}>
                                {inscribiendoClub === club ? 'Inscribiendo...' : '+ Inscribir todos'}
                              </button>
                            </div>
                            <div className="space-y-1">
                              {porClub[club].map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-felt-dark/40 border border-felt-light/10 rounded-lg px-3 py-2">
                                  <div>
                                    <span className="text-chalk/70 text-sm">{p.lastName}, {p.firstName}</span>
                                    <span className={`text-xs ml-2 capitalize font-mono ${(p as any).category?.name === 'master' ? 'text-gold/60' : (p as any).category?.name === 'primera' ? 'text-blue-400/60' : (p as any).category?.name === 'segunda' ? 'text-green-400/60' : 'text-chalk/30'}`}>{(p as any).category?.name}</span>
                                  </div>
                                  <button className="py-0.5 px-2 text-xs rounded border border-green-700/40 text-green-400 hover:bg-green-900/20 transition-all disabled:opacity-40" disabled={inscripcionSaving === p.id} onClick={() => handleInscribir(inscripcionModal, p.id)}>
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

      {/* Preview modal */}
      {previewModal && (() => {
        const esNac = previewModal.data.tipo === 'nacional';
        const tabs = buildPreviewTabs(previewModal.data);
        return (
          <Modal title={`VISTA PREVIA — ${previewModal.circuit.name}`} onClose={() => setPreviewModal(null)}>
            <div className="space-y-4">

              {/* Inscriptos — diferente para Nacional y Departamental */}
              {esNac ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-felt-dark/50 rounded-lg p-2 text-center">
                    <p className="font-display text-xl text-blue-400">
                      {previewModal.data.inscriptos.total ?? previewModal.data.inscriptos.clasificatorio ?? 0}
                    </p>
                    <p className="text-chalk/40 text-xs uppercase">Inscriptos</p>
                  </div>
                  <div className="bg-felt-dark/50 rounded-lg p-2 text-center">
                    <p className="font-display text-xl text-green-400">
                      {previewModal.data.clasificatorio.totalSeries}
                    </p>
                    <p className="text-chalk/40 text-xs uppercase">Series</p>
                  </div>
                  <div className="bg-felt-dark/50 rounded-lg p-2 text-center">
                    <p className="font-display text-xl text-purple-400">
                      {previewModal.data.bracket?.totalPartidos ?? 29}
                    </p>
                    <p className="text-chalk/40 text-xs uppercase">Partidos bracket</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Máster',  val: previewModal.data.inscriptos.master  ?? 0, color: 'text-gold' },
                    { label: 'Primera', val: previewModal.data.inscriptos.primera ?? 0, color: 'text-blue-400' },
                    { label: 'Segunda', val: previewModal.data.inscriptos.segunda ?? 0, color: 'text-green-400' },
                    { label: 'Clasif.', val: previewModal.data.inscriptos.tercera ?? 0, color: 'text-chalk/60' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-felt-dark/50 rounded-lg p-2 text-center">
                      <p className={`font-display text-xl ${color}`}>{val}</p>
                      <p className="text-chalk/40 text-xs uppercase">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Badge categoría para Nacional */}
              {esNac && previewModal.data.categoriaFederal && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-blue-400 text-xs uppercase tracking-widest font-mono">🏆 Nacional</span>
                  <span className="text-blue-300 text-sm font-semibold capitalize">{previewModal.data.categoriaFederal}</span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                {tabs.map(tab => (
                  <button key={tab.key}
                    className={`py-1 px-3 text-xs rounded-lg border transition-all ${previewTab === tab.key ? 'border-gold/40 text-gold bg-gold/10' : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'}`}
                    onClick={() => setPreviewTab(tab.key as PreviewTab)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenido de tabs */}
              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">

                {/* Tab: Series */}
                {previewTab === 'series' && previewModal.data.clasificatorio.series.map(serie => (
                  <div key={serie.serie} className="bg-felt-dark/40 border border-felt-light/10 rounded-lg p-3">
                    <p className="text-chalk/40 text-xs uppercase tracking-widest font-mono mb-2">Serie {serie.serie}</p>
                    <div className="space-y-1">
                      {serie.jugadores.map((j, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-chalk/20 text-xs font-mono w-4">{idx + 1}</span>
                          <span className={`text-sm ${j.esLibre ? 'text-red-400/60 italic' : 'text-chalk/70'}`}>{j.nombre}</span>
                          {j.esLibre && <span className="text-red-400/40 text-xs font-mono">(bye)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Tab: Bracket (solo Nacional) */}
                {previewTab === 'bracket' && previewModal.data.bracket && (
                  <div className="space-y-3">
                    <div className="bg-felt-dark/40 border border-purple-700/30 rounded-lg p-4 space-y-3">
                      <p className="text-purple-400 font-display text-sm uppercase tracking-widest">
                        {previewModal.data.bracket.descripcion}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                        <div className="space-y-1">
                          <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2">Winners Bracket</p>
                          <div className="flex justify-between"><span className="text-chalk/50">R1</span><span className="text-chalk">8 partidos</span></div>
                          <div className="flex justify-between"><span className="text-chalk/50">R2</span><span className="text-chalk">4 partidos</span></div>
                          <div className="flex justify-between"><span className="text-chalk/50">SF</span><span className="text-chalk">2 partidos</span></div>
                          <div className="flex justify-between"><span className="text-chalk/50">Final</span><span className="text-chalk">1 partido</span></div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2">Losers Bracket</p>
                          <div className="flex justify-between"><span className="text-chalk/50">R1</span><span className="text-chalk">4 partidos</span></div>
                          <div className="flex justify-between"><span className="text-chalk/50">R2</span><span className="text-chalk">4 partidos</span></div>
                          <div className="flex justify-between"><span className="text-chalk/50">R3</span><span className="text-chalk">2 partidos</span></div>
                          <div className="flex justify-between"><span className="text-chalk/50">R4</span><span className="text-chalk">2 partidos</span></div>
                          <div className="flex justify-between"><span className="text-chalk/50">Final</span><span className="text-chalk">1 partido</span></div>
                        </div>
                      </div>
                      <div className="border-t border-felt-light/10 pt-3 flex justify-between items-center">
                        <span className="text-chalk/40 text-sm">🏆 Grand Final (WB vs LB)</span>
                        <span className="text-gold font-mono font-bold text-lg">{previewModal.data.bracket.totalPartidos} partidos total</span>
                      </div>
                    </div>
                    <p className="text-chalk/30 text-xs text-center font-mono">
                      Los 16 clasificados se seedean automáticamente al completar las series
                    </p>
                  </div>
                )}

                {/* Tab: Reducción (solo Departamental) */}
                {previewTab === 'reduccion' && previewModal.data.clasificatorio.crucesReduccion?.map(cruce => (
                  <div key={cruce.cruce} className="bg-felt-dark/40 border border-felt-light/10 rounded-lg px-3 py-2 flex items-center gap-3">
                    <span className="text-chalk/30 text-xs font-mono w-16">Cruce {cruce.cruce}</span>
                    <span className="text-chalk/70 text-sm flex-1">{cruce.slotA}</span>
                    <span className="text-chalk/30 text-xs">vs</span>
                    <span className="text-chalk/70 text-sm flex-1 text-right">{cruce.slotB}</span>
                  </div>
                ))}

                {/* Tab: Segunda (solo Departamental) */}
                {previewTab === 'segunda' && previewModal.data.segundaPreview?.series.map((serie: any) => (
                  <div key={serie.serie} className="bg-felt-dark/40 border border-felt-light/10 rounded-lg p-3">
                    <p className="text-chalk/40 text-xs uppercase tracking-widest font-mono mb-2">Serie {serie.serie}</p>
                    <div className="space-y-1">
                      {serie.jugadores.map((j: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-chalk/20 text-xs font-mono w-4">{idx + 1}</span>
                          <span className={`text-sm ${j.esSlot ? 'text-gold/50 italic' : 'text-chalk/70'}`}>{j.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Tab: Primera (solo Departamental) */}
                {previewTab === 'primera' && previewModal.data.primeraPreview?.cruces.map((cruce: any) => (
                  <div key={cruce.cruce} className="bg-felt-dark/40 border border-felt-light/10 rounded-lg px-3 py-2 flex items-center gap-3">
                    <span className="text-chalk/30 text-xs font-mono w-16">Cruce {cruce.cruce}</span>
                    <span className={`text-sm flex-1 ${cruce.esSlotA ? 'text-gold/50 italic' : 'text-chalk/70'}`}>{cruce.jugadorA}</span>
                    <span className="text-chalk/30 text-xs">vs</span>
                    <span className={`text-sm flex-1 text-right ${cruce.esSlotB ? 'text-gold/50 italic' : 'text-chalk/70'}`}>{cruce.jugadorB}</span>
                  </div>
                ))}

                {/* Tab: Master (solo Departamental) */}
                {previewTab === 'master' && previewModal.data.masterPreview?.cruces.map((cruce: any) => (
                  <div key={cruce.cruce} className="bg-felt-dark/40 border border-felt-light/10 rounded-lg px-3 py-2 flex items-center gap-3">
                    <span className="text-chalk/30 text-xs font-mono w-16">Cruce {cruce.cruce}</span>
                    <span className={`text-sm flex-1 ${cruce.esSlotA ? 'text-gold/50 italic' : 'text-chalk/70'}`}>{cruce.jugadorA}</span>
                    <span className="text-chalk/30 text-xs">vs</span>
                    <span className={`text-sm flex-1 text-right ${cruce.esSlotB ? 'text-gold/50 italic' : 'text-chalk/70'}`}>{cruce.jugadorB}</span>
                  </div>
                ))}

              </div>

              <div className="flex gap-3 pt-2">
                <button className="btn-primary flex-1" onClick={handleConfirmarGenerar}>⚡ Confirmar y generar</button>
                <button className="btn-secondary flex-1" onClick={() => setPreviewModal(null)}>Cancelar</button>
              </div>
            </div>
          </Modal>
        );
      })()}
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
      isFinished ? 'border-felt-light/20 bg-felt/50' : 'border-felt-light/15 bg-felt-dark/30'
    }`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b border-felt-light/10 ${winnerA ? 'bg-gold/10' : ''}`}>
        <span className={`font-medium truncate ${winnerA ? 'text-gold' : 'text-chalk/80'}`}>
          {winnerA && '🏆 '}{(match as any).slotA && !(match.playerA) ? (match as any).slotA : playerName(match.playerA)}
        </span>
        {match.result && <span className={`font-mono font-bold ml-2 shrink-0 ${winnerA ? 'text-gold' : 'text-chalk/40'}`}>{match.result.setsA}</span>}
      </div>
      <div className={`flex items-center justify-between px-3 py-2 ${winnerB ? 'bg-gold/10' : ''}`}>
        <span className={`font-medium truncate ${winnerB ? 'text-gold' : 'text-chalk/80'}`}>
          {winnerB && '🏆 '}{(match as any).slotB && !(match.playerB) ? (match as any).slotB : playerName(match.playerB)}
        </span>
        {match.result && <span className={`font-mono font-bold ml-2 shrink-0 ${winnerB ? 'text-gold' : 'text-chalk/40'}`}>{match.result.setsB}</span>}
      </div>
      <div className="flex items-center justify-between px-3 py-1 bg-felt-dark/30 border-t border-felt-light/10">
        <MatchStatusBadge status={match.status} />
        {match.table && <span className="text-chalk/25 text-xs font-mono">Mesa {match.table.number}</span>}
        {match.result?.isWO && <span className="text-red-400 text-xs font-mono">W.O.</span>}
      </div>
    </div>
  );
}
