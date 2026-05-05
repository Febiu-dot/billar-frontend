import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState, Modal } from '../components/ui';

interface Venue { id: number; name: string; tables?: { id: number; number: number }[]; }
interface Phase { id: number; name: string; type: string; order: number; }
interface Circuit { id: number; name: string; phases?: Phase[]; }
interface Tournament { id: number; name: string; year: number; circuits?: Circuit[]; }

interface HorarioMesa {
  mesaId: number;
  horarios: string[];
}

interface ConfigFecha {
  fecha: string;
  sedes: {
    venueId: number;
    mesas: HorarioMesa[];
  }[];
}

interface FaseConfigData {
  duracionSerie: number;
  configuracion: {
    fechas: ConfigFecha[];
  };
}

const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function FaseConfigPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [config, setConfig] = useState<FaseConfigData>({ duracionSerie: 45, configuracion: { fechas: [] } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modal agregar fecha
  const [fechaModal, setFechaModal] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/tournaments'),
      api.get('/venues'),
    ]).then(([tRes, vRes]) => {
      setTournaments(tRes.data);
      setVenues(vRes.data);
      if (tRes.data.length > 0) {
        const t = tRes.data[0];
        setSelectedTournament(t);
        if (t.circuits?.length > 0) {
          const c = t.circuits[0];
          setSelectedCircuit(c);
          if (c.phases?.length > 0) {
            setSelectedPhase(c.phases[0]);
          }
        }
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedPhase) return;
    api.get(`/faseconfig/${selectedPhase.id}`).then(r => {
      setConfig({
        duracionSerie: r.data.duracionSerie ?? 45,
        configuracion: r.data.configuracion?.fechas
          ? r.data.configuracion
          : { fechas: [] }
      });
    });
  }, [selectedPhase]);

  const handleSave = async () => {
    if (!selectedPhase) return;
    setSaving(true);
    try {
      await api.put(`/faseconfig/${selectedPhase.id}`, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const agregarFecha = () => {
    if (!nuevaFecha) return;
    if (config.configuracion.fechas.find(f => f.fecha === nuevaFecha)) {
      alert('Esa fecha ya existe');
      return;
    }
    setConfig({
      ...config,
      configuracion: {
        fechas: [...config.configuracion.fechas, { fecha: nuevaFecha, sedes: [] }]
      }
    });
    setNuevaFecha('');
    setFechaModal(false);
  };

  const eliminarFecha = (fecha: string) => {
    setConfig({
      ...config,
      configuracion: {
        fechas: config.configuracion.fechas.filter(f => f.fecha !== fecha)
      }
    });
  };

  const toggleSede = (fecha: string, venueId: number) => {
    setConfig(prev => ({
      ...prev,
      configuracion: {
        fechas: prev.configuracion.fechas.map(f => {
          if (f.fecha !== fecha) return f;
          const exists = f.sedes.find(s => s.venueId === venueId);
          return {
            ...f,
            sedes: exists
              ? f.sedes.filter(s => s.venueId !== venueId)
              : [...f.sedes, { venueId, mesas: [] }]
          };
        })
      }
    }));
  };

  const toggleMesa = (fecha: string, venueId: number, mesaId: number) => {
    setConfig(prev => ({
      ...prev,
      configuracion: {
        fechas: prev.configuracion.fechas.map(f => {
          if (f.fecha !== fecha) return f;
          return {
            ...f,
            sedes: f.sedes.map(s => {
              if (s.venueId !== venueId) return s;
              const exists = s.mesas.find(m => m.mesaId === mesaId);
              return {
                ...s,
                mesas: exists
                  ? s.mesas.filter(m => m.mesaId !== mesaId)
                  : [...s.mesas, { mesaId, horarios: [] }]
              };
            })
          };
        })
      }
    }));
  };

  const toggleHorario = (fecha: string, venueId: number, mesaId: number, hora: string) => {
    setConfig(prev => ({
      ...prev,
      configuracion: {
        fechas: prev.configuracion.fechas.map(f => {
          if (f.fecha !== fecha) return f;
          return {
            ...f,
            sedes: f.sedes.map(s => {
              if (s.venueId !== venueId) return s;
              return {
                ...s,
                mesas: s.mesas.map(m => {
                  if (m.mesaId !== mesaId) return m;
                  const exists = m.horarios.includes(hora);
                  return {
                    ...m,
                    horarios: exists
                      ? m.horarios.filter(h => h !== hora)
                      : [...m.horarios, hora].sort()
                  };
                })
              };
            })
          };
        })
      }
    }));
  };

  const getVenue = (id: number) => venues.find(v => v.id === id);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-gold">CONFIGURACIÓN DE FASES</h1>
          <p className="text-chalk/50 text-sm mt-1">Fechas, sedes, mesas y horarios disponibles por fase</p>
        </div>
        <button
          className="btn-primary"
          disabled={saving || !selectedPhase}
          onClick={handleSave}
        >
          {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Selección de torneo / circuito / fase */}
        <div className="card space-y-4">
          <h2 className="font-display text-lg text-chalk">Selección</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Torneo</label>
              <select className="input" value={selectedTournament?.id ?? ''} onChange={e => {
                const t = tournaments.find(t => t.id === Number(e.target.value));
                setSelectedTournament(t ?? null);
                setSelectedCircuit(t?.circuits?.[0] ?? null);
                setSelectedPhase(t?.circuits?.[0]?.phases?.[0] ?? null);
              }}>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Circuito</label>
              <select className="input" value={selectedCircuit?.id ?? ''} onChange={e => {
                const c = selectedTournament?.circuits?.find(c => c.id === Number(e.target.value));
                setSelectedCircuit(c ?? null);
                setSelectedPhase(c?.phases?.[0] ?? null);
              }}>
                {selectedTournament?.circuits?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fase</label>
              <select className="input" value={selectedPhase?.id ?? ''} onChange={e => {
                const p = selectedCircuit?.phases?.find(p => p.id === Number(e.target.value));
                setSelectedPhase(p ?? null);
              }}>
                {selectedCircuit?.phases?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Duración entre P1 y P2 (minutos)</label>
              <input
                type="number"
                min="15"
                max="120"
                className="input w-32"
                value={config.duracionSerie}
                onChange={e => setConfig({ ...config, duracionSerie: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Fechas */}
        {selectedPhase && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-chalk">Fechas disponibles</h2>
              <button className="btn-primary py-1 px-3 text-xs" onClick={() => setFechaModal(true)}>
                + Agregar fecha
              </button>
            </div>

            {config.configuracion.fechas.length === 0 ? (
              <EmptyState message="No hay fechas configuradas. Agregá una fecha para comenzar." />
            ) : (
              config.configuracion.fechas
                .sort((a, b) => a.fecha.localeCompare(b.fecha))
                .map(cfecha => (
                  <div key={cfecha.fecha} className="card space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg text-gold">
                        {new Date(cfecha.fecha + 'T12:00:00').toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <button
                        className="py-0.5 px-2 text-xs rounded border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                        onClick={() => eliminarFecha(cfecha.fecha)}
                      >
                        Eliminar fecha
                      </button>
                    </div>

                    {/* Sedes */}
                    <div>
                      <p className="text-chalk/60 text-xs uppercase tracking-widest mb-2">Sedes disponibles</p>
                      <div className="flex flex-wrap gap-2">
                        {venues.map(v => {
                          const activa = cfecha.sedes.find(s => s.venueId === v.id);
                          return (
                            <button
                              key={v.id}
                              onClick={() => toggleSede(cfecha.fecha, v.id)}
                              className={`py-1 px-3 text-xs rounded-lg border transition-all ${activa ? 'border-gold/40 text-gold bg-gold/10' : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'}`}
                            >
                              {v.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mesas y horarios por sede */}
                    {cfecha.sedes.map(csede => {
                      const venue = getVenue(csede.venueId);
                      if (!venue) return null;
                      return (
                        <div key={csede.venueId} className="bg-felt-dark/40 rounded-lg p-4 space-y-3">
                          <p className="text-chalk/80 text-sm font-semibold">{venue.name}</p>

                          <div>
                            <p className="text-chalk/50 text-xs uppercase tracking-widest mb-2">Mesas disponibles</p>
                            <div className="flex flex-wrap gap-2">
                              {venue.tables?.sort((a, b) => a.number - b.number).map(t => {
                                const activa = csede.mesas.find(m => m.mesaId === t.id);
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => toggleMesa(cfecha.fecha, csede.venueId, t.id)}
                                    className={`py-1 px-3 text-xs rounded-lg border transition-all ${activa ? 'border-blue-400/40 text-blue-400 bg-blue-900/20' : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'}`}
                                  >
                                    Mesa {t.number}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Horarios por mesa */}
                          {csede.mesas.map(cmesa => {
                            const mesa = venue.tables?.find(t => t.id === cmesa.mesaId);
                            if (!mesa) return null;
                            return (
                              <div key={cmesa.mesaId} className="bg-felt-dark/60 rounded-lg p-3">
                                <p className="text-chalk/50 text-xs uppercase tracking-widest mb-2">
                                  Mesa {mesa.number} — Horarios disponibles
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {HORAS.map(hora => {
                                    const activo = cmesa.horarios.includes(hora);
                                    return (
                                      <button
                                        key={hora}
                                        onClick={() => toggleHorario(cfecha.fecha, csede.venueId, cmesa.mesaId, hora)}
                                        className={`py-0.5 px-2 text-xs rounded border transition-all font-mono ${activo ? 'border-green-400/40 text-green-400 bg-green-900/20' : 'border-felt-light/10 text-chalk/30 hover:border-chalk/20'}`}
                                      >
                                        {hora}
                                      </button>
                                    );
                                  })}
                                </div>
                                {cmesa.horarios.length > 0 && (
                                  <p className="text-green-400/60 text-xs mt-2">
                                    {cmesa.horarios.length} horario{cmesa.horarios.length > 1 ? 's' : ''} seleccionado{cmesa.horarios.length > 1 ? 's' : ''}: {cmesa.horarios.join(', ')}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Modal agregar fecha */}
      {fechaModal && (
        <Modal title="AGREGAR FECHA" onClose={() => setFechaModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fecha</label>
              <input
                type="date"
                className="input"
                value={nuevaFecha}
                onChange={e => setNuevaFecha(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={agregarFecha}>Agregar</button>
              <button className="btn-secondary flex-1" onClick={() => setFechaModal(false)}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
