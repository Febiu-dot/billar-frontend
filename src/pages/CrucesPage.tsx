import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState, Modal } from '../components/ui';

interface Tournament { id: number; name: string; year: number; departamentoId?: number; }
interface Circuit    { id: number; name: string; tournamentId: number; order: number; configTorneo?: any; }
interface Venue      { id: number; name: string; departamentoId?: number; tables?: { id: number; number: number; status: string }[]; }
interface PhaseInfo  { id: number; type: string; }
interface Cruce {
  id: number; round: number; serieId?: string; fase: string;
  phaseId: number; circuitId: number;
  playerA?: any; playerB?: any; slotA?: string; slotB?: string;
  tableId?: number; table?: any; scheduledAt?: string; status: string;
}

export default function CrucesPage() {
  const [tournaments, setTournaments]           = useState<Tournament[]>([]);
  const [allCircuits, setAllCircuits]           = useState<Circuit[]>([]);
  const [venues, setVenues]                     = useState<Venue[]>([]);
  const [cruces, setCruces]                     = useState<Cruce[]>([]);
  const [phases, setPhases]                     = useState<PhaseInfo[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [loadingMatches, setLoadingMatches]     = useState(false);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedCircuit, setSelectedCircuit]   = useState('');
  const [torneoDepId, setTorneoDepId]           = useState<number | null>(null);
  const [esNacional, setEsNacional]             = useState(false);
  const [asignandoModal, setAsignandoModal]     = useState<Cruce | null>(null);
  const [form, setForm]                         = useState({ venueId: '', tableId: '', scheduledAt: '', hora: '', minutos: '' });
  const [saving, setSaving]                     = useState(false);
  const [filtroFase, setFiltroFase]             = useState('todas');
  const [disparando, setDisparando]             = useState(false);
  const [disparoMsg, setDisparoMsg]             = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/tournaments').then(r => setTournaments(r.data)),
      api.get('/circuits').then(r => setAllCircuits(r.data)),
      api.get('/venues').then(r => setVenues(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const circuitsFiltrados = selectedTournament
    ? allCircuits.filter(c => c.tournamentId === Number(selectedTournament)).sort((a, b) => a.order - b.order)
    : [];

  // ── Filtrar cruces según tipo de torneo ───────────────────────────
  const filtrarCruces = (matches: any[], esNac: boolean): Cruce[] => {
    return matches
      .filter((m: any) => {
        const tipo = m.phase?.type;
        const sid = m.serieId ?? '';
        if (esNac) {
          // Nacional: solo bracket (master phase con serieId nac-oct/cua/semi/final)
          return tipo === 'master' && (
            sid.startsWith('nac-oct') || sid.startsWith('nac-cua') ||
            sid.startsWith('nac-semi') || sid === 'nac-final'
          );
        } else {
          // Departamental: reduccion, primera, master
          return tipo === 'primera' || tipo === 'master' ||
            (sid.includes('reduccion') || sid.includes('repechaje'));
        }
      })
      .map((m: any) => ({
        id: m.id, round: m.round, serieId: m.serieId,
        fase: m.serieId?.includes('reduccion') || m.serieId?.includes('repechaje') ? 'reduccion' : m.phase?.type ?? '',
        phaseId: m.phaseId,
        circuitId: m.phase?.circuit?.id ?? 0,
        playerA: m.playerA, playerB: m.playerB,
        slotA: m.slotA, slotB: m.slotB,
        tableId: m.tableId, table: m.table,
        scheduledAt: m.scheduledAt, status: m.status,
      }))
      .sort((a: Cruce, b: Cruce) => {
        const ordenFase: Record<string, number> = { reduccion: 1, primera: 2, master: 3 };
        if (a.fase !== b.fase) return (ordenFase[a.fase] ?? 9) - (ordenFase[b.fase] ?? 9);
        if (!a.scheduledAt && !b.scheduledAt) return a.round - b.round;
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });
  };

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    setSelectedCircuit('');
    setCruces([]); setPhases([]); setDisparoMsg(''); setFiltroFase('todas');
  };

  const handleCircuitChange = async (circuitId: string) => {
    setSelectedCircuit(circuitId);
    setCruces([]); setPhases([]); setDisparoMsg('');
    if (!circuitId) return;
    setLoadingMatches(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.get(`/matches?circuitId=${circuitId}`),
        api.get(`/circuits/${circuitId}`),
      ]);
      const cfg = cRes.data.configTorneo ?? {};
      const esNac = cfg.tipo === 'nacional';
      setEsNacional(esNac);

      // Departamento para filtrar sedes (null para Nacional)
      const torneo = tournaments.find(t => t.id === Number(selectedTournament));
      setTorneoDepId(esNac ? null : (torneo?.departamentoId ?? null));

      // Fases disponibles
      setPhases((cRes.data.phases ?? []).map((p: any) => ({ id: p.id, type: p.type })));

      setCruces(filtrarCruces(mRes.data, esNac));
    } catch { setCruces([]); }
    finally { setLoadingMatches(false); }
  };

  const getPhaseId = (type: string): number | null =>
    phases.find(p => p.type === type)?.id ?? null;

  const disparar = async (endpoint: string, phaseId: number | null) => {
    if (!phaseId) { setDisparoMsg('❌ Fase no encontrada'); return; }
    setDisparando(true); setDisparoMsg('');
    try {
      const res = await api.post(`/matches/${endpoint}/${phaseId}`);
      setDisparoMsg(`✅ ${res.data.message}`);
      await handleCircuitChange(selectedCircuit);
    } catch (err: any) {
      setDisparoMsg(`❌ ${err?.response?.data?.error ?? 'Error'}`);
    } finally { setDisparando(false); }
  };

  const abrirAsignacion = (cruce: Cruce) => {
    setAsignandoModal(cruce);
    const horaCompleta = cruce.scheduledAt ? cruce.scheduledAt.split('T')[1]?.slice(0, 5) : '';
    setForm({
      venueId: cruce.table?.venue?.id?.toString() ?? '',
      tableId: cruce.tableId?.toString() ?? '',
      scheduledAt: cruce.scheduledAt ? cruce.scheduledAt.split('T')[0] : '',
      hora: horaCompleta.split(':')[0] ?? '',
      minutos: horaCompleta.split(':')[1] ?? '00',
    });
  };

  const handleGuardar = async () => {
    if (!asignandoModal) return;
    setSaving(true);
    try {
      const scheduledAt = form.scheduledAt && form.hora
        ? new Date(`${form.scheduledAt}T${form.hora}:${form.minutos || '00'}:00`).toISOString()
        : undefined;
      if (form.tableId) await api.put(`/matches/${asignandoModal.id}/assign`, { tableId: parseInt(form.tableId) });
      if (scheduledAt) await api.put(`/matches/${asignandoModal.id}`, { scheduledAt });
      setAsignandoModal(null);
      await handleCircuitChange(selectedCircuit);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al asignar');
    } finally { setSaving(false); }
  };

  const sedesFiltradas = torneoDepId ? venues.filter(v => v.departamentoId === torneoDepId) : venues;
  const getTablasDeSede = (venueId: string) => sedesFiltradas.find(v => v.id === parseInt(venueId))?.tables ?? [];

  const pn = (player: any, slot?: string) => {
    if (player) return `${player.lastName}, ${player.firstName}`;
    if (slot) return slot;
    return '—';
  };

  // ── Labels para departamental y Nacional ──────────────────────────
  const labelFase = (cruce: Cruce): string => {
    if (cruce.fase === 'reduccion') return 'Reducción';
    if (cruce.fase === 'primera') return 'Primera';
    if (cruce.fase === 'master') {
      const r = cruce.round;
      if (r >= 101 && r <= 108) return 'Octavos';
      if (r >= 111 && r <= 114) return 'Cuartos';
      if (r === 121 || r === 122) return 'Semis';
      if (r === 131) return 'Final';
      if (r <= 16) return 'Cruce Master';
      if (r <= 24) return 'Octavos';
      if (r <= 28) return 'Cuartos';
      if (r <= 30) return 'Semifinal';
      return 'Final';
    }
    return cruce.fase;
  };

  const numeroCruce = (cruce: Cruce): string => {
    if (cruce.serieId?.includes('repechaje')) return 'Repechaje';
    const r = cruce.round;
    if (r >= 101 && r <= 108) return `Oct. ${r - 100}`;
    if (r >= 111 && r <= 114) return `Cua. ${r - 110}`;
    if (r === 121) return 'Semi 1';
    if (r === 122) return 'Semi 2';
    if (r === 131) return '🏆 Final';
    if (cruce.fase === 'master') {
      if (r <= 16) return `Cruce ${r}`;
      if (r <= 24) return `Oct. ${r - 16}`;
      if (r <= 28) return `Cua. ${r - 24}`;
      if (r <= 30) return `Semi ${r - 28}`;
      return 'Final';
    }
    return `#${r}`;
  };

  const badgeColor = (cruce: Cruce): string => {
    if (cruce.fase === 'reduccion') return 'bg-orange-900/30 text-orange-400';
    if (cruce.fase === 'primera')   return 'bg-blue-900/30 text-blue-400';
    const r = cruce.round;
    if (r === 131 || (cruce.fase === 'master' && r === 31)) return 'bg-gold/40 text-gold font-bold';
    if (r === 121 || r === 122 || (r >= 29 && r <= 30)) return 'bg-gold/30 text-gold';
    if ((r >= 111 && r <= 114) || (r >= 25 && r <= 28)) return 'bg-gold/20 text-gold';
    if ((r >= 101 && r <= 108) || (r >= 17 && r <= 24)) return 'bg-gold/10 text-gold';
    return 'bg-purple-900/30 text-purple-400';
  };

  // Fases disponibles para el filtro
  const fasesDisponibles = esNacional
    ? ['todas', 'master']
    : ['todas', 'reduccion', 'primera', 'master'];

  const labelFiltro = (f: string) => {
    if (f === 'todas') return 'Todas';
    if (f === 'reduccion') return 'Reducción';
    if (f === 'primera') return 'Primera';
    if (f === 'master') return esNacional ? 'Bracket' : 'Master';
    return f;
  };

  const crucesFiltrados = filtroFase === 'todas' ? cruces : cruces.filter(c => c.fase === filtroFase);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">CRUCES</h1>
        <p className="text-chalk/50 text-sm mt-1">Reducción, Primera, Master y Bracket Nacional</p>
      </div>

      <div className="p-6 space-y-6">

        {/* Selectores */}
        <div className="flex flex-wrap gap-3 items-center">
          <select className="input w-64" value={selectedTournament}
            onChange={e => handleTournamentChange(e.target.value)}>
            <option value="">Seleccioná un torneo</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
          </select>
          <select className="input w-56" value={selectedCircuit}
            onChange={e => handleCircuitChange(e.target.value)} disabled={!selectedTournament}>
            <option value="">Seleccioná un circuito</option>
            {circuitsFiltrados.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {esNacional && selectedCircuit && (
            <span className="badge-status bg-blue-900/40 text-blue-400 text-xs">🏆 Nacional</span>
          )}
        </div>

        {/* Estado inicial */}
        {!selectedCircuit && !loadingMatches && (
          <div className="text-center py-16 text-chalk/30">
            <p className="text-5xl mb-4">🎱</p>
            <p className="text-lg font-display">Seleccioná un torneo y circuito</p>
          </div>
        )}

        {loadingMatches && <LoadingSpinner />}

        {selectedCircuit && !loadingMatches && cruces.length === 0 && (
          <EmptyState message="No hay cruces en este circuito. Generá los partidos desde Fixture primero." />
        )}

        {selectedCircuit && !loadingMatches && cruces.length > 0 && (
          <>
            {/* Botones disparar */}
            <div className="card space-y-3">
              <p className="text-chalk/50 text-xs uppercase tracking-widest">Acciones manuales</p>
              <div className="flex gap-2 flex-wrap">
                {esNacional ? (
  <>
    <button className="btn-primary text-xs py-1 px-3" disabled={disparando}
      onClick={async () => {
        setDisparando(true); setDisparoMsg('');
        try {
          const res = await api.post(`/matches/generar-bracket-nacional/${selectedCircuit}`);
          setDisparoMsg(`✅ ${res.data.message}`);
          await handleCircuitChange(selectedCircuit);
        } catch (err: any) {
          setDisparoMsg(`❌ ${err?.response?.data?.error ?? 'Error'}`);
        } finally { setDisparando(false); }
      }}>
      🏆 Generar bracket desde resultados de series
    </button>
    <button className="btn-secondary text-xs py-1 px-3" disabled={disparando}
      onClick={() => disparar('trigger-nac-bracket', getPhaseId('clasificatorio'))}>
      ⚡ Seedear bracket manual
    </button>
  </>
                ) : (
                  <>
                    <button className="btn-secondary text-xs py-1 px-2" disabled={disparando}
                      onClick={() => disparar('trigger-reduccion', getPhaseId('clasificatorio'))}>⚡ Cruces reducción</button>
                    <button className="btn-secondary text-xs py-1 px-2" disabled={disparando}
                      onClick={() => disparar('trigger-segunda', getPhaseId('segunda'))}>⚡ Slots Primera</button>
                    <button className="btn-secondary text-xs py-1 px-2" disabled={disparando}
                      onClick={() => disparar('trigger-primera', getPhaseId('primera'))}>⚡ Slots Master</button>
                    <button className="btn-secondary text-xs py-1 px-2" disabled={disparando}
                      onClick={() => disparar('trigger-master', getPhaseId('master'))}>⚡ Octavos Master</button>
                  </>
                )}
              </div>
              {disparoMsg && (
                <p className={`text-xs font-mono ${disparoMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                  {disparoMsg}
                </p>
              )}
            </div>

            {/* Filtro de fase */}
            <div className="flex gap-2 flex-wrap">
              {fasesDisponibles.map(f => (
                <button key={f}
                  className={`py-1 px-3 text-xs rounded-lg border transition-all ${filtroFase === f ? 'border-gold/40 text-gold bg-gold/10' : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'}`}
                  onClick={() => setFiltroFase(f)}>
                  {labelFiltro(f)}
                  <span className="ml-1 font-mono opacity-60">
                    ({f === 'todas' ? cruces.length : cruces.filter(c => c.fase === f).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Tabla de cruces */}
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-felt-light/10 text-chalk/40 text-xs uppercase tracking-widest">
                    <th className="text-left px-4 py-3">Fase</th>
                    <th className="text-left px-4 py-3">Cruce</th>
                    <th className="text-left px-4 py-3">Jugador A</th>
                    <th className="text-left px-4 py-3">Jugador B</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Sede / Mesa</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Fecha / Hora</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {crucesFiltrados.map(cruce => {
                    const asignado = cruce.tableId || cruce.scheduledAt;
                    return (
                      <tr key={cruce.id} className={`border-b border-felt-light/5 ${asignado ? 'bg-green-900/5' : ''}`}>
                        <td className="px-4 py-3">
                          <span className={`badge-status text-xs ${badgeColor(cruce)}`}>{labelFase(cruce)}</span>
                        </td>
                        <td className="px-4 py-3 text-chalk/40 text-xs font-mono">{numeroCruce(cruce)}</td>
                        <td className="px-4 py-3 text-chalk/80">{pn(cruce.playerA, cruce.slotA)}</td>
                        <td className="px-4 py-3 text-chalk/80">{pn(cruce.playerB, cruce.slotB)}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {cruce.table
                            ? <span className="text-green-400/60 text-xs font-mono">{cruce.table.venue?.name} — Mesa {cruce.table.number}</span>
                            : <span className="text-chalk/20 text-xs">Sin asignar</span>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {cruce.scheduledAt
                            ? <span className="text-chalk/60 text-xs font-mono">{new Date(cruce.scheduledAt).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                            : <span className="text-chalk/20 text-xs">Sin fecha</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="py-0.5 px-2 text-xs rounded border border-gold/30 text-gold/70 hover:bg-gold/10 transition-all"
                            onClick={() => abrirAsignacion(cruce)}>
                            {asignado ? 'Editar' : 'Asignar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal asignación */}
      {asignandoModal && (
        <Modal title={`ASIGNAR — ${labelFase(asignandoModal)} ${numeroCruce(asignandoModal)}`} onClose={() => setAsignandoModal(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-chalk/60 text-xs uppercase tracking-widest mb-1">Partido</p>
              <p className="text-chalk/80 text-sm">{pn(asignandoModal.playerA, asignandoModal.slotA)} vs {pn(asignandoModal.playerB, asignandoModal.slotB)}</p>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                Sede {torneoDepId ? '(filtradas por departamento)' : '(todas)'}
              </label>
              <select className="input" value={form.venueId} onChange={e => setForm({ ...form, venueId: e.target.value, tableId: '' })}>
                <option value="">Seleccionar sede...</option>
                {sedesFiltradas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            {form.venueId && (
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Mesa</label>
                <select className="input" value={form.tableId} onChange={e => setForm({ ...form, tableId: e.target.value })}>
                  <option value="">Seleccionar mesa...</option>
                  {getTablasDeSede(form.venueId).map((t: any) => <option key={t.id} value={t.id}>Mesa {t.number} — {t.status}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fecha</label>
                <input type="date" className="input" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Hora (24hs)</label>
                <div className="flex gap-2">
                  <select className="input flex-1" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })}>
                    <option value="">HH</option>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select className="input flex-1" value={form.minutos} onChange={e => setForm({ ...form, minutos: e.target.value })}>
                    <option value="">MM</option>
                    {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" disabled={saving} onClick={handleGuardar}>{saving ? 'Guardando...' : 'Guardar'}</button>
              <button className="btn-secondary flex-1" onClick={() => setAsignandoModal(null)}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
