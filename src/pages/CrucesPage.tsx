import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState, Modal } from '../components/ui';

interface Venue { id: number; name: string; departamentoId?: number; tables?: { id: number; number: number; status: string }[]; }
interface Cruce {
  id: number;
  round: number;
  serieId?: string;
  fase: string;
  phaseId: number;
  circuitId: number;
  circuitName: string;
  circuitOrder: number;
  playerA?: any;
  playerB?: any;
  slotA?: string;
  slotB?: string;
  tableId?: number;
  table?: any;
  scheduledAt?: string;
  status: string;
}
interface CircuitoInfo {
  id: number;
  name: string;
  order: number;
  phases: { id: number; type: string }[];
}

export default function CrucesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cruces, setCruces] = useState<Cruce[]>([]);
  const [circuitos, setCircuitos] = useState<CircuitoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [torneoDepId, setTorneoDepId] = useState<number | null>(null);
  const [asignandoModal, setAsignandoModal] = useState<Cruce | null>(null);
  const [form, setForm] = useState({ venueId: '', tableId: '', scheduledAt: '', hora: '', minutos: '' });
  const [saving, setSaving] = useState(false);
  const [filtroFase, setFiltroFase] = useState<string>('todas');
  const [disparando, setDisparando] = useState(false);
  const [disparoMsg, setDisparoMsg] = useState('');
  const [circuitosOcultos, setCircuitosOcultos] = useState<Set<number>>(new Set());

  const cargarDatos = async () => {
    const [vRes, mRes, tRes] = await Promise.all([
      api.get('/venues'),
      api.get('/matches'),
      api.get('/tournaments'),
    ]);
    setVenues(vRes.data);

    // Extraer info de circuitos con sus fases desde los torneos
    const circuitosMap = new Map<number, CircuitoInfo>();
    for (const torneo of tRes.data) {
      for (const circuit of (torneo.circuits ?? [])) {
        circuitosMap.set(circuit.id, {
          id: circuit.id,
          name: circuit.name,
          order: circuit.order,
          phases: (circuit.phases ?? []).map((p: any) => ({ id: p.id, type: p.type })),
        });
      }
    }
    const circuitosArr = [...circuitosMap.values()].sort((a, b) => a.order - b.order);
    setCircuitos(circuitosArr);

    // Ocultar circuitos anteriores por defecto (solo la primera vez)
    if (circuitosArr.length > 1) {
      setCircuitosOcultos(prev => {
        if (prev.size === 0) {
          const maxOrder = Math.max(...circuitosArr.map(c => c.order));
          return new Set(circuitosArr.filter(c => c.order < maxOrder).map(c => c.id));
        }
        return prev;
      });
    }

    const matchesCruces = mRes.data.filter((m: any) =>
      m.phase?.type === 'primera' ||
      m.phase?.type === 'master' ||
      (m.serieId && (m.serieId.includes('reduccion') || m.serieId.includes('repechaje')))
    ).map((m: any) => ({
      id: m.id,
      round: m.round,
      serieId: m.serieId,
      fase: m.serieId?.includes('reduccion') || m.serieId?.includes('repechaje') ? 'reduccion' : m.phase?.type ?? '',
      phaseId: m.phaseId,
      circuitId: m.phase?.circuit?.id ?? 0,
      circuitName: m.phase?.circuit?.name ?? 'Sin circuito',
      circuitOrder: m.phase?.circuit?.order ?? 0,
      playerA: m.playerA,
      playerB: m.playerB,
      slotA: m.slotA,
      slotB: m.slotB,
      tableId: m.tableId,
      table: m.table,
      scheduledAt: m.scheduledAt,
      status: m.status,
    }));

    matchesCruces.sort((a: Cruce, b: Cruce) => {
      if (a.circuitOrder !== b.circuitOrder) return a.circuitOrder - b.circuitOrder;
      const orden: Record<string, number> = { reduccion: 1, primera: 2, master: 3 };
      if (a.fase !== b.fase) return (orden[a.fase] ?? 9) - (orden[b.fase] ?? 9);
      if (!a.scheduledAt && !b.scheduledAt) return a.round - b.round;
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

    setCruces(matchesCruces);
    const torneoActivo = tRes.data.find((t: any) => t.active) ?? tRes.data[0];
    setTorneoDepId(torneoActivo?.departamentoId ?? null);
    setLoading(false);
  };

  useEffect(() => { cargarDatos().catch(() => setLoading(false)); }, []);

  const toggleCircuito = (circuitId: number) => {
    setCircuitosOcultos(prev => {
      const next: Set<number> = new Set(prev);
      if (next.has(circuitId)) next.delete(circuitId); else next.add(circuitId);
      return next;
    });
  };

  const getPhaseId = (circuitId: number, type: string): number | null => {
    const c = circuitos.find(c => c.id === circuitId);
    return c?.phases.find(p => p.type === type)?.id ?? null;
  };

  const disparar = async (endpoint: string, phaseId: number | null) => {
    if (!phaseId) { setDisparoMsg('❌ Fase no encontrada'); return; }
    setDisparando(true); setDisparoMsg('');
    try {
      const res = await api.post(`/matches/${endpoint}/${phaseId}`);
      setDisparoMsg(`✅ ${res.data.message}`);
      await cargarDatos();
    } catch (err: any) {
      setDisparoMsg(`❌ ${err?.response?.data?.error ?? 'Error'}`);
    } finally {
      setDisparando(false);
    }
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
      await cargarDatos();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al asignar');
    } finally {
      setSaving(false);
    }
  };

  const sedesFiltradas = torneoDepId ? venues.filter(v => v.departamentoId === torneoDepId) : venues;
  const getTablasDeSede = (venueId: string) => sedesFiltradas.find(v => v.id === parseInt(venueId))?.tables ?? [];

  const pn = (player: any, slot?: string) => {
    if (player) return `${player.lastName}, ${player.firstName}`;
    if (slot) return slot;
    return '—';
  };

  const labelFaseFiltro = (fase: string) => {
    if (fase === 'todas') return 'Todas';
    if (fase === 'reduccion') return 'Reducción';
    if (fase === 'primera') return 'Primera';
    if (fase === 'master') return 'Master';
    return fase;
  };

  const labelCruce = (cruce: Cruce): string => {
    if (cruce.fase === 'reduccion') return 'Reducción';
    if (cruce.fase === 'primera') return 'Primera';
    if (cruce.fase === 'master') {
      if (cruce.round <= 16) return 'Cruce Master';
      if (cruce.round <= 24) return 'Octavos';
      if (cruce.round <= 28) return 'Cuartos';
      if (cruce.round <= 30) return 'Semifinal';
      return 'Final';
    }
    return cruce.fase;
  };

  const badgeColor = (cruce: Cruce): string => {
    if (cruce.fase === 'reduccion') return 'bg-orange-900/30 text-orange-400';
    if (cruce.fase === 'primera') return 'bg-blue-900/30 text-blue-400';
    if (cruce.fase === 'master') {
      if (cruce.round <= 16) return 'bg-purple-900/30 text-purple-400';
      if (cruce.round <= 24) return 'bg-gold/10 text-gold';
      if (cruce.round <= 28) return 'bg-gold/20 text-gold';
      if (cruce.round <= 30) return 'bg-gold/30 text-gold';
      return 'bg-gold/40 text-gold font-bold';
    }
    return 'bg-felt-light/20 text-chalk/40';
  };

  const numeroCruce = (cruce: Cruce): string => {
    if (cruce.serieId?.includes('repechaje')) return 'Repechaje';
    if (cruce.fase === 'master') {
      if (cruce.round <= 16) return `Cruce ${cruce.round}`;
      if (cruce.round <= 24) return `Octavo ${cruce.round - 16}`;
      if (cruce.round <= 28) return `Cuarto ${cruce.round - 24}`;
      if (cruce.round <= 30) return `Semi ${cruce.round - 28}`;
      return 'Final';
    }
    return `#${cruce.round}`;
  };

  // Circuitos que tienen cruces
  const circuitosConCruces = circuitos.filter(c => cruces.some(cr => cr.circuitId === c.id));

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">CRUCES</h1>
        <p className="text-chalk/50 text-sm mt-1">Reducción, Primera y Master</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Filtro de fase */}
        <div className="flex gap-2 flex-wrap items-center">
          {['todas', 'reduccion', 'primera', 'master'].map(f => (
            <button
              key={f}
              className={`py-1 px-3 text-xs rounded-lg border transition-all ${filtroFase === f ? 'border-gold/40 text-gold bg-gold/10' : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'}`}
              onClick={() => setFiltroFase(f)}
            >
              {labelFaseFiltro(f)}
            </button>
          ))}
        </div>

        {cruces.length === 0 ? (
          <EmptyState message="No hay cruces. Generá los partidos desde Fixture primero." />
        ) : (
          circuitosConCruces.map(circuito => {
            const crucesCircuito = cruces.filter(c =>
              c.circuitId === circuito.id &&
              (filtroFase === 'todas' || c.fase === filtroFase)
            );
            if (crucesCircuito.length === 0) return null;

            const oculto = circuitosOcultos.has(circuito.id);
            const asignados = crucesCircuito.filter(c => c.tableId || c.scheduledAt).length;

            return (
              <div key={circuito.id}>
                {/* Header circuito */}
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-felt-light/15 flex-wrap">
                  <h2 className="font-display text-2xl text-gold">{circuito.name}</h2>
                  <span className="text-chalk/30 text-xs font-mono">{asignados}/{crucesCircuito.length} asignados</span>

                  {/* Botones disparar para este circuito */}
                  {!oculto && (
                    <div className="flex gap-2 flex-wrap ml-2">
                      <button className="btn-secondary text-xs py-1 px-2" disabled={disparando} onClick={() => disparar('trigger-reduccion', getPhaseId(circuito.id, 'clasificatorio'))}>
                        ⚡ Cruces reducción
                      </button>
                      <button className="btn-secondary text-xs py-1 px-2" disabled={disparando} onClick={() => disparar('trigger-segunda', getPhaseId(circuito.id, 'segunda'))}>
                        ⚡ Slots Primera
                      </button>
                      <button className="btn-secondary text-xs py-1 px-2" disabled={disparando} onClick={() => disparar('trigger-primera', getPhaseId(circuito.id, 'primera'))}>
                        ⚡ Slots Master
                      </button>
                      <button className="btn-secondary text-xs py-1 px-2" disabled={disparando} onClick={() => disparar('trigger-master', getPhaseId(circuito.id, 'master'))}>
                        ⚡ Octavos
                      </button>
                    </div>
                  )}

                  <button
                    className={`ml-auto py-1 px-3 text-xs rounded-lg border transition-all ${oculto ? 'border-gold/30 text-gold/70 hover:bg-gold/10' : 'border-chalk/20 text-chalk/40 hover:border-chalk/40'}`}
                    onClick={() => toggleCircuito(circuito.id)}
                  >
                    {oculto ? '👁 Mostrar' : '🙈 Ocultar'}
                  </button>
                </div>

                {disparoMsg && !oculto && (
                  <p className={`text-xs mb-2 ${disparoMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{disparoMsg}</p>
                )}

                {/* Tabla de cruces */}
                {!oculto && (
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
                        {crucesCircuito.map(cruce => {
                          const asignado = cruce.tableId || cruce.scheduledAt;
                          return (
                            <tr key={cruce.id} className={`border-b border-felt-light/5 ${asignado ? 'bg-green-900/5' : ''}`}>
                              <td className="px-4 py-3">
                                <span className={`badge-status text-xs ${badgeColor(cruce)}`}>{labelCruce(cruce)}</span>
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
                                <button className="py-0.5 px-2 text-xs rounded border border-gold/30 text-gold/70 hover:bg-gold/10 transition-all" onClick={() => abrirAsignacion(cruce)}>
                                  {asignado ? 'Editar' : 'Asignar'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal asignación */}
      {asignandoModal && (
        <Modal title={`ASIGNAR — ${labelCruce(asignandoModal)} ${numeroCruce(asignandoModal)}`} onClose={() => setAsignandoModal(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-chalk/60 text-xs uppercase tracking-widest mb-1">Partido</p>
              <p className="text-chalk/80 text-sm">{pn(asignandoModal.playerA, asignandoModal.slotA)} vs {pn(asignandoModal.playerB, asignandoModal.slotB)}</p>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Sede {torneoDepId ? '(filtradas por departamento)' : ''}</label>
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
