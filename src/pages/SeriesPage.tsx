import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState, Modal } from '../components/ui';

interface Venue { id: number; name: string; departamentoId?: number; tables?: { id: number; number: number; status: string }[]; }
interface Serie {
  serieId: string;
  fase: string;
  partidos: any[];
  torneoDepId?: number;
}

export default function SeriesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [torneoDepId, setTorneoDepId] = useState<number | null>(null);
  const [asignandoModal, setAsignandoModal] = useState<{ serie: Serie; partido: any } | null>(null);
  const [form, setForm] = useState({ venueId: '', tableId: '', scheduledAt: '', hora: '' });
  const [saving, setSaving] = useState(false);

  const filtrarPartidos = (matches: any[]) =>
    matches.filter((m: any) =>
      m.serieId &&
      (m.round % 10 === 1 || m.round % 10 === 2) &&
      !m.serieId.includes('reduccion') &&
      !m.serieId.includes('repechaje') &&
      m.playerA !== null &&
      m.playerB !== null
    );

  const getNumSerie = (id: string) => {
    const match = id.match(/(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  };

  const agruparEnSeries = (matches: any[]): Serie[] => {
    const seriesMap: Record<string, Serie> = {};
    for (const m of matches) {
      if (!seriesMap[m.serieId]) {
        seriesMap[m.serieId] = {
          serieId: m.serieId,
          fase: m.phase?.type ?? '',
          partidos: []
        };
      }
      seriesMap[m.serieId].partidos.push(m);
    }
    Object.values(seriesMap).forEach(s => s.partidos.sort((a, b) => a.round - b.round));
    return Object.values(seriesMap).sort((a, b) => {
      const faseA = a.serieId.split('-serie-')[0];
      const faseB = b.serieId.split('-serie-')[0];
      if (faseA !== faseB) return faseA.localeCompare(faseB);
      return getNumSerie(a.serieId) - getNumSerie(b.serieId);
    });
  };

  const cargarDatos = async () => {
    const [vRes, mRes, tRes] = await Promise.all([
      api.get('/venues'),
      api.get('/matches'),
      api.get('/tournaments'),
    ]);
    setVenues(vRes.data);
    setSeries(agruparEnSeries(filtrarPartidos(mRes.data)));

    // Obtener departamento del torneo activo
    const torneoActivo = tRes.data.find((t: any) => t.active) ?? tRes.data[0];
    setTorneoDepId(torneoActivo?.departamentoId ?? null);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos().catch(() => setLoading(false));
  }, []);

  const abrirAsignacion = (serie: Serie, partido: any) => {
    setAsignandoModal({ serie, partido });
    setForm({
      venueId: partido.table?.venue?.id?.toString() ?? '',
      tableId: partido.tableId?.toString() ?? '',
      scheduledAt: partido.scheduledAt ? partido.scheduledAt.split('T')[0] : '',
      hora: partido.scheduledAt ? partido.scheduledAt.split('T')[1]?.slice(0, 5) : ''
    });
  };

  const handleGuardar = async () => {
    if (!asignandoModal) return;
    setSaving(true);
    try {
      const { partido } = asignandoModal;
      const scheduledAt = form.scheduledAt && form.hora
        ? new Date(`${form.scheduledAt}T${form.hora}:00`).toISOString()
        : undefined;

      if (form.tableId) {
        await api.put(`/matches/${partido.id}/assign`, { tableId: parseInt(form.tableId) });
      }
      if (scheduledAt) {
        await api.put(`/matches/${partido.id}`, { scheduledAt });
      }

      setAsignandoModal(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al asignar');
    } finally {
      setSaving(false);
    }
  };

  // Filtrar sedes por departamento del torneo
  const sedesFiltradas = torneoDepId
    ? venues.filter(v => v.departamentoId === torneoDepId)
    : venues;

  const getTablasDeSede = (venueId: string) => {
    const venue = sedesFiltradas.find(v => v.id === parseInt(venueId));
    return venue?.tables ?? [];
  };

  const pn = (player: any) => player ? `${player.lastName}, ${player.firstName}` : '—';

  const formatSerieId = (id: string) =>
    id
      .replace('clasif-serie-', 'Clasificatorio Serie ')
      .replace('segunda-serie-', 'Segunda Serie ')
      .replace('primera-serie-', 'Primera Serie ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">SERIES</h1>
        <p className="text-chalk/50 text-sm mt-1">Asignación de sede, mesa, fecha y hora por serie</p>
      </div>

      <div className="p-6 space-y-4">
        {series.length === 0 ? (
          <EmptyState message="No hay series pendientes. Generá los partidos desde Fixture primero." />
        ) : (
          series.map(serie => (
            <div key={serie.serieId} className="card">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-display text-lg text-chalk">{formatSerieId(serie.serieId)}</h3>
                <span className="badge-status bg-felt-light/20 text-chalk/40 text-xs capitalize">{serie.fase}</span>
              </div>

              <div className="space-y-2">
                {serie.partidos.map((partido: any, idx: number) => {
                  const asignado = partido.tableId || partido.scheduledAt;
                  return (
                    <div key={partido.id} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${asignado ? 'border-green-700/30 bg-green-900/10' : 'border-felt-light/10 bg-felt-dark/30'}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-chalk/30 text-xs font-mono w-6">P{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-chalk/80 text-sm">{pn(partido.playerA)}</span>
                          <span className="text-chalk/30 text-xs mx-2">vs</span>
                          <span className="text-chalk/80 text-sm">{pn(partido.playerB)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {partido.table && (
                          <span className="text-green-400/60 text-xs font-mono">
                            {partido.table.venue?.name} — Mesa {partido.table.number}
                          </span>
                        )}
                        {partido.scheduledAt && (
                          <span className="text-chalk/40 text-xs font-mono">
                            {new Date(partido.scheduledAt).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <button
                          className="py-0.5 px-2 text-xs rounded border border-gold/30 text-gold/70 hover:bg-gold/10 transition-all"
                          onClick={() => abrirAsignacion(serie, partido)}
                        >
                          {asignado ? 'Editar' : 'Asignar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal asignación */}
      {asignandoModal && (
        <Modal title={`ASIGNAR — ${formatSerieId(asignandoModal.serie.serieId)}`} onClose={() => setAsignandoModal(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-chalk/60 text-xs uppercase tracking-widest mb-1">Partido</p>
              <p className="text-chalk/80 text-sm">
                {pn(asignandoModal.partido.playerA)} vs {pn(asignandoModal.partido.playerB)}
              </p>
            </div>

            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                Sede {torneoDepId ? '(filtradas por departamento del torneo)' : ''}
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
                  {getTablasDeSede(form.venueId).map((t: any) => (
                    <option key={t.id} value={t.id}>Mesa {t.number} — {t.status}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fecha</label>
                <input type="date" className="input" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Hora</label>
                <input type="time" className="input" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" disabled={saving} onClick={handleGuardar}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setAsignandoModal(null)}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
