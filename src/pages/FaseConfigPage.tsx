import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState, Modal } from '../components/ui';

interface Venue { id: number; name: string; departamentoId?: number; tables?: { id: number; number: number }[]; }
interface Phase { id: number; name: string; type: string; order: number; }
interface Circuit { id: number; name: string; order?: number; phases?: Phase[]; }
interface Tournament { id: number; name: string; year: number; departamentoId?: number; circuits?: Circuit[]; }

interface HorarioMesa { mesaId: number; horarios: string[]; }
interface ConfigFecha {
  fecha: string;
  sedes: { venueId: number; mesas: HorarioMesa[]; }[];
}
interface FaseConfigData {
  duracionSerie: number;
  configuracion: { fechas: ConfigFecha[]; };
}

const HORAS_SERIES = (() => {
  const horas: string[] = [];
  let h = 10, m = 30;
  while (true) {
    horas.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 45;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
    if (h > 21 || (h === 21 && m > 45)) break;
  }
  return horas;
})();

const HORAS_CRUCES = Array.from({ length: 13 }, (_, i) => `${String(i + 10).padStart(2, '0')}:00`);
const esFaseDeSeries = (type: string) => type === 'clasificatorio' || type === 'segunda';

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
  const [fechaModal, setFechaModal] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [soloActivo, setSoloActivo] = useState(true);

  const [asignarModal, setAsignarModal] = useState(false);
  const [horaP1, setHoraP1] = useState('19:30');
  const [horaP2, setHoraP2] = useState('20:15');
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [crucesPerMesa, setCrucesPerMesa] = useState(4);
  const [asignando, setAsignando] = useState(false);
  const [asignadoMsg, setAsignadoMsg] = useState('');

  useEffect(() => {
    Promise.all([api.get('/tournaments'), api.get('/venues')]).then(([tRes, vRes]) => {
      setTournaments(tRes.data);
      setVenues(vRes.data);
      if (tRes.data.length > 0) {
        const t = tRes.data[0];
        setSelectedTournament(t);
        // Seleccionar el circuito con mayor order por defecto
        const circuitos = t.circuits ?? [];
        const maxOrder = Math.max(...circuitos.map((c: Circuit) => c.order ?? 0));
        const ultimoCircuito = circuitos.find((c: Circuit) => c.order === maxOrder) ?? circuitos[0];
        setSelectedCircuit(ultimoCircuito ?? null);
        if (ultimoCircuito?.phases?.length > 0) setSelectedPhase(ultimoCircuito.phases[0]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedPhase) return;
    api.get(`/faseconfig/${selectedPhase.id}`).then(r => {
      setConfig({
        duracionSerie: r.data.duracionSerie ?? 45,
        configuracion: r.data.configuracion?.fechas ? r.data.configuracion : { fechas: [] }
      });
    });
  }, [selectedPhase]);

  // Circuitos filtrados según toggle
  const circuitosFiltrados = (() => {
    const todos = selectedTournament?.circuits ?? [];
    if (!soloActivo || todos.length <= 1) return todos;
    const maxOrder = Math.max(...todos.map(c => c.order ?? 0));
    return todos.filter(c => c.order === maxOrder);
  })();

  const sedesFiltradas = selectedTournament?.departamentoId
    ? venues.filter(v => v.departamentoId === selectedTournament.departamentoId)
    : venues;

  const horasDisponibles = selectedPhase ? (esFaseDeSeries(selectedPhase.type) ? HORAS_SERIES : HORAS_CRUCES) : HORAS_SERIES;

  const handleSave = async () => {
    if (!selectedPhase) return;
    setSaving(true);
    try {
      await api.put(`/faseconfig/${selectedPhase.id}`, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Error al guardar la configuración'); }
    finally { setSaving(false); }
  };

  const handleAsignar = async () => {
    if (!selectedPhase) return;
    setAsignando(true); setAsignadoMsg('');
    try {
      const esSeries = esFaseDeSeries(selectedPhase.type);
      const body = esSeries ? { horaP1, horaP2 } : { horaInicio, crucesPerMesa };
      const res = await api.post(`/faseconfig/${selectedPhase.id}/asignar`, body);
      setAsignadoMsg(`✅ ${res.data.message} — ${res.data.asignados} de ${res.data.total} asignados`);
    } catch (err: any) {
      setAsignadoMsg(`❌ ${err?.response?.data?.error ?? 'Error al asignar'}`);
    } finally { setAsignando(false); }
  };

  const agregarFecha = () => {
    if (!nuevaFecha) return;
    if (config.configuracion.fechas.find(f => f.fecha === nuevaFecha)) { alert('Esa fecha ya existe'); return; }
    setConfig({ ...config, configuracion: { fechas: [...config.configuracion.fechas, { fecha: nuevaFecha, sedes: [] }] } });
    setNuevaFecha(''); setFechaModal(false);
  };

  const eliminarFecha = (fecha: string) =>
    setConfig({ ...config, configuracion: { fechas: config.configuracion.fechas.filter(f => f.fecha !== fecha) } });

  const toggleSede = (fecha: string, venueId: number) =>
    setConfig(prev => ({
      ...prev, configuracion: {
        fechas: prev.configuracion.fechas.map(f => f.fecha !== fecha ? f : {
          ...f, sedes: f.sedes.find(s => s.venueId === venueId)
            ? f.sedes.filter(s => s.venueId !== venueId)
            : [...f.sedes, { venueId, mesas: [] }]
        })
      }
    }));

  const toggleMesa = (fecha: string, venueId: number, mesaId: number) =>
    setConfig(prev => ({
      ...prev, configuracion: {
        fechas: prev.configuracion.fechas.map(f => f.fecha !== fecha ? f : {
          ...f, sedes: f.sedes.map(s => s.venueId !== venueId ? s : {
            ...s, mesas: s.mesas.find(m => m.mesaId === mesaId)
              ? s.mesas.filter(m => m.mesaId !== mesaId)
              : [...s.mesas, { mesaId, horarios: [] }]
          })
        })
      }
    }));

  const toggleHorario = (fecha: string, venueId: number, mesaId: number, hora: string) =>
    setConfig(prev => ({
      ...prev, configuracion: {
        fechas: prev.configuracion.fechas.map(f => f.fecha !== fecha ? f : {
          ...f, sedes: f.sedes.map(s => s.venueId !== venueId ? s : {
            ...s, mesas: s.mesas.map(m => m.mesaId !== mesaId ? m : {
              ...m, horarios: m.horarios.includes(hora)
                ? m.horarios.filter(h => h !== hora)
                : [...m.horarios, hora].sort()
            })
          })
        })
      }
    }));

  const seleccionarTodosHorarios = (fecha: string, venueId: number, mesaId: number) =>
    setConfig(prev => ({
      ...prev, configuracion: {
        fechas: prev.configuracion.fechas.map(f => f.fecha !== fecha ? f : {
          ...f, sedes: f.sedes.map(s => s.venueId !== venueId ? s : {
            ...s, mesas: s.mesas.map(m => m.mesaId !== mesaId ? m : {
              ...m, horarios: horasDisponibles.every(h => m.horarios.includes(h)) ? [] : [...horasDisponibles]
            })
          })
        })
      }
    }));

  const getVenue = (id: number) => venues.find(v => v.id === id);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl text-gold">PROGRAMACIÓN</h1>
          <p className="text-chalk/50 text-sm mt-1">Fechas, sedes, mesas y horarios disponibles por fase</p>
        </div>
        <div className="flex gap-2">
          {selectedPhase && (
            <button className="btn-secondary" onClick={() => { setAsignarModal(true); setAsignadoMsg(''); }}>
              ⚡ Asignar automáticamente
            </button>
          )}
          <button className="btn-primary" disabled={saving || !selectedPhase} onClick={handleSave}>
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-display text-lg text-chalk">Selección</h2>
            {(selectedTournament?.circuits?.length ?? 0) > 1 && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloActivo}
                  onChange={e => {
                    setSoloActivo(e.target.checked);
                    if (!e.target.checked) {
                      // Al mostrar todos, resetear al primero disponible
                      const todos = selectedTournament?.circuits ?? [];
                      setSelectedCircuit(todos[0] ?? null);
                      setSelectedPhase(todos[0]?.phases?.[0] ?? null);
                    }
                  }}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-chalk/60 text-xs uppercase tracking-widest">Solo circuito activo</span>
              </label>
            )}
          </div>

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
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                Circuito {soloActivo && circuitosFiltrados.length === 1 && (
                  <span className="text-gold/60 ml-1">(activo)</span>
                )}
              </label>
              <select className="input" value={selectedCircuit?.id ?? ''} onChange={e => {
                const c = circuitosFiltrados.find(c => c.id === Number(e.target.value));
                setSelectedCircuit(c ?? null);
                setSelectedPhase(c?.phases?.[0] ?? null);
              }}>
                {circuitosFiltrados.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

          {selectedPhase && (
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`badge-status text-xs ${esFaseDeSeries(selectedPhase.type) ? 'bg-blue-900/30 text-blue-400' : 'bg-gold/20 text-gold'}`}>
                {esFaseDeSeries(selectedPhase.type) ? '🎱 Series — Horarios cada 45 min (10:30-21:45)' : '⚔️ Cruces — Horarios cada 60 min (10:00-22:00)'}
              </span>
              {esFaseDeSeries(selectedPhase.type) && (
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Duración entre P1 y P2 (min)</label>
                  <input type="number" min="15" max="120" className="input w-24" value={config.duracionSerie}
                    onChange={e => setConfig({ ...config, duracionSerie: Number(e.target.value) })} />
                </div>
              )}
              {selectedTournament?.departamentoId && (
                <span className="text-gold/50 text-xs font-mono">{sedesFiltradas.length} sede{sedesFiltradas.length !== 1 ? 's' : ''} del departamento</span>
              )}
            </div>
          )}
        </div>

        {selectedPhase && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-chalk">Fechas disponibles</h2>
              <button className="btn-primary py-1 px-3 text-xs" onClick={() => setFechaModal(true)}>+ Agregar fecha</button>
            </div>

            {config.configuracion.fechas.length === 0 ? (
              <EmptyState message="No hay fechas configuradas. Agregá una fecha para comenzar." />
            ) : (
              config.configuracion.fechas.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(cfecha => (
                <div key={cfecha.fecha} className="card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg text-gold">
                      {new Date(cfecha.fecha + 'T12:00:00').toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <button className="py-0.5 px-2 text-xs rounded border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                      onClick={() => eliminarFecha(cfecha.fecha)}>Eliminar fecha</button>
                  </div>

                  <div>
                    <p className="text-chalk/60 text-xs uppercase tracking-widest mb-2">Sedes disponibles</p>
                    <div className="flex flex-wrap gap-2">
                      {sedesFiltradas.map(v => {
                        const activa = cfecha.sedes.find(s => s.venueId === v.id);
                        return (
                          <button key={v.id} onClick={() => toggleSede(cfecha.fecha, v.id)}
                            className={`py-1 px-3 text-xs rounded-lg border transition-all ${activa ? 'border-gold/40 text-gold bg-gold/10' : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'}`}>
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

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
                                <button key={t.id} onClick={() => toggleMesa(cfecha.fecha, csede.venueId, t.id)}
                                  className={`py-1 px-3 text-xs rounded-lg border transition-all ${activa ? 'border-blue-400/40 text-blue-400 bg-blue-900/20' : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'}`}>
                                  Mesa {t.number}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {csede.mesas.map(cmesa => {
                          const mesa = venue.tables?.find(t => t.id === cmesa.mesaId);
                          if (!mesa) return null;
                          const todosSeleccionados = horasDisponibles.every(h => cmesa.horarios.includes(h));
                          return (
                            <div key={cmesa.mesaId} className="bg-felt-dark/60 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-chalk/50 text-xs uppercase tracking-widest">Mesa {mesa.number} — Horarios</p>
                                <button onClick={() => seleccionarTodosHorarios(cfecha.fecha, csede.venueId, cmesa.mesaId)}
                                  className="text-xs text-gold/60 hover:text-gold transition-all">
                                  {todosSeleccionados ? 'Quitar todos' : 'Seleccionar todos'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {horasDisponibles.map(hora => {
                                  const activo = cmesa.horarios.includes(hora);
                                  return (
                                    <button key={hora} onClick={() => toggleHorario(cfecha.fecha, csede.venueId, cmesa.mesaId, hora)}
                                      className={`py-0.5 px-2 text-xs rounded border transition-all font-mono ${activo ? 'border-green-400/40 text-green-400 bg-green-900/20' : 'border-felt-light/10 text-chalk/30 hover:border-chalk/20'}`}>
                                      {hora}
                                    </button>
                                  );
                                })}
                              </div>
                              {cmesa.horarios.length > 0 && (
                                <p className="text-green-400/60 text-xs mt-2">
                                  {cmesa.horarios.length} horario{cmesa.horarios.length > 1 ? 's' : ''}: {cmesa.horarios.join(', ')}
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

      {fechaModal && (
        <Modal title="AGREGAR FECHA" onClose={() => setFechaModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Fecha</label>
              <input type="date" className="input" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={agregarFecha}>Agregar</button>
              <button className="btn-secondary flex-1" onClick={() => setFechaModal(false)}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {asignarModal && selectedPhase && (
        <Modal title="⚡ ASIGNACIÓN AUTOMÁTICA" onClose={() => setAsignarModal(false)}>
          <div className="space-y-4">
            <div className="bg-felt-dark/50 rounded-lg px-3 py-2">
              <p className="text-chalk/60 text-xs uppercase tracking-widest">Fase</p>
              <p className="text-chalk/80 text-sm font-medium">{selectedPhase.name}</p>
              <p className="text-chalk/40 text-xs capitalize">{selectedPhase.type}</p>
            </div>

            {esFaseDeSeries(selectedPhase.type) ? (
              <>
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Hora Partido 1</label>
                  <select className="input" value={horaP1} onChange={e => setHoraP1(e.target.value)}>
                    {HORAS_SERIES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Hora Partido 2</label>
                  <select className="input" value={horaP2} onChange={e => setHoraP2(e.target.value)}>
                    {HORAS_SERIES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <p className="text-chalk/40 text-xs">Los partidos 3, 4 y 5 se juegan a continuación sin horario fijo.</p>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Hora del primer cruce</label>
                  <select className="input" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}>
                    {HORAS_CRUCES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Máximo de cruces por mesa</label>
                  <input type="number" min="1" max="13" className="input" value={crucesPerMesa}
                    onChange={e => setCrucesPerMesa(Number(e.target.value))} />
                </div>
                <p className="text-chalk/40 text-xs">Los siguientes cruces se asignan con diferencia de 1 hora.</p>
              </>
            )}

            {asignadoMsg && (
              <p className={`text-sm ${asignadoMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{asignadoMsg}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" disabled={asignando} onClick={handleAsignar}>
                {asignando ? 'Asignando...' : '⚡ Asignar'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setAsignarModal(false)}>Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
