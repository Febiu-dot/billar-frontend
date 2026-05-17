import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

interface ConfigTorneo {
  cantMaster: number;
  cantPrimera: number;
  cantSegunda: number;
  cuposDesdeClasif: number;
}

interface Validacion {
  ok: boolean;
  jugClasif: number;
  seriesClasif: number;
  clasifTotal: number;
  necesitaReduccion: boolean;
  jugSegunda: number;
  segundaValida: boolean;
  seriesSegunda: number;
  clasifSegunda: number;
  jugPrimera: number;
  crucesPrimera: number;
  clasifPrimera: number;
  jugMaster: number;
  alertas: string[];
}

const PLANTILLAS: { nombre: string; config: ConfigTorneo }[] = [
  { nombre: '🟢 Grande (~131 jugadores)',  config: { cantMaster: 8, cantPrimera: 24, cantSegunda: 32, cuposDesdeClasif: 16 } },
  { nombre: '🔵 Mediano (~90 jugadores)',  config: { cantMaster: 8, cantPrimera: 16, cantSegunda: 16, cuposDesdeClasif: 12 } },
  { nombre: '🟠 Pequeño (~60 jugadores)', config: { cantMaster: 8, cantPrimera: 12, cantSegunda: 12, cuposDesdeClasif:  8 } },
  { nombre: '🔴 Chico (~35 jugadores)',   config: { cantMaster: 4, cantPrimera:  8, cantSegunda:  8, cuposDesdeClasif:  8 } },
];

function calcularValidacion(config: ConfigTorneo, totalInscriptos: number): Validacion {
  const { cantMaster, cantPrimera, cantSegunda, cuposDesdeClasif } = config;
  const alertas: string[] = [];

  const jugClasif = Math.max(0, totalInscriptos - cantMaster - cantPrimera - cantSegunda);
  const jugClasifConLibre = jugClasif % 4 === 0 ? jugClasif : jugClasif + (4 - jugClasif % 4);
  const seriesClasif = Math.ceil(jugClasifConLibre / 4);
  const clasifTotal = seriesClasif * 2;
  const necesitaReduccion = clasifTotal > cuposDesdeClasif;

  const jugSegunda = cantSegunda + cuposDesdeClasif;
  const segundaValida = jugSegunda % 4 === 0;
  if (!segundaValida) alertas.push(`Segunda: ${cantSegunda} + ${cuposDesdeClasif} = ${jugSegunda} — no es múltiplo de 4`);

  const seriesSegunda = segundaValida ? jugSegunda / 4 : 0;
  const clasifSegunda = seriesSegunda * 2;

  const jugPrimera = cantPrimera + clasifSegunda;
  const crucesPrimera = Math.floor(jugPrimera / 2);
  const clasifPrimera = crucesPrimera;

  const jugMaster = cantMaster + clasifPrimera;

  if (cantMaster + cantPrimera + cantSegunda > totalInscriptos && totalInscriptos > 0) {
    alertas.push(`Los cupos (${cantMaster + cantPrimera + cantSegunda}) superan los inscriptos (${totalInscriptos})`);
  }

  if (jugClasif === 0 && totalInscriptos > 0) {
    alertas.push('No hay jugadores para el Clasificatorio con esta configuración');
  }

  return {
    ok: alertas.length === 0 && segundaValida,
    jugClasif, seriesClasif, clasifTotal, necesitaReduccion,
    jugSegunda, segundaValida, seriesSegunda, clasifSegunda,
    jugPrimera, crucesPrimera, clasifPrimera,
    jugMaster, alertas,
  };
}

export default function ConfigTorneoPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [circuitos, setCircuitos] = useState<any[]>([]);
  const [circuitId, setCircuitId] = useState('');
  const [config, setConfig] = useState<ConfigTorneo>({ cantMaster: 8, cantPrimera: 24, cantSegunda: 32, cuposDesdeClasif: 16 });
  const [totalInscriptos, setTotalInscriptos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tournaments').then(r => {
      setTournaments(r.data);
      const allCircuits = r.data.flatMap((t: any) =>
        (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name, torneoYear: t.year }))
      );
      setCircuitos(allCircuits);
      if (allCircuits.length > 0) {
        const maxOrder = Math.max(...allCircuits.map((c: any) => c.order ?? 0));
        const ultimo = allCircuits.find((c: any) => c.order === maxOrder) ?? allCircuits[0];
        setCircuitId(String(ultimo.id));
      }
    }).catch(e => {
      console.error('Error cargando torneos:', e);
      setError('Error al cargar los torneos');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!circuitId) return;
    // Cargar config y cantidad de inscriptos
    Promise.all([
      api.get(`/circuits/${circuitId}/config-torneo`),
      api.get(`/circuits/${circuitId}`),
    ]).then(([cfgRes, circRes]) => {
      setConfig(cfgRes.data);
      const jugadores = (circRes.data.players ?? []).filter((cp: any) => cp.player?.dni !== 'FEBIU000');
      setTotalInscriptos(jugadores.length);
    }).catch(() => {});
  }, [circuitId]);

  const val = calcularValidacion(config, totalInscriptos);

  const aplicarPlantilla = (plantilla: ConfigTorneo) => {
    setConfig(plantilla);
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    if (!circuitId) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put(`/circuits/${circuitId}/config-torneo`, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">CONFIGURACIÓN DE TORNEO</h1>
        <p className="text-chalk/50 text-sm mt-1">Define el tamaño y estructura del torneo antes de generar los partidos</p>
      </div>

      <div className="p-6 space-y-6">

        {/* Selector de circuito */}
        <div className="card">
          <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Circuito</label>
          <select className="input" value={circuitId} onChange={e => setCircuitId(e.target.value)}>
            {circuitos.map(c => <option key={c.id} value={c.id}>{c.torneoNombre} — {c.name}</option>)}
          </select>
          {totalInscriptos > 0 && (
            <p className="text-chalk/40 text-xs mt-2 font-mono">{totalInscriptos} jugadores inscriptos en este circuito</p>
          )}
        </div>

        {/* Plantillas */}
        <div className="card space-y-3">
          <h2 className="font-display text-lg text-chalk">Plantillas predefinidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLANTILLAS.map(p => (
              <button
                key={p.nombre}
                onClick={() => aplicarPlantilla(p.config)}
                className="text-left p-3 rounded-lg border border-felt-light/20 hover:border-gold/40 transition-all space-y-1"
              >
                <p className="text-chalk/80 text-sm font-semibold">{p.nombre}</p>
                <p className="text-chalk/40 text-xs font-mono">
                  M:{p.config.cantMaster} P:{p.config.cantPrimera} S:{p.config.cantSegunda} C:{p.config.cuposDesdeClasif}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Parámetros */}
        <div className="card space-y-4">
          <h2 className="font-display text-lg text-chalk">Parámetros del torneo</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                Máster
                <span className="ml-1 text-gold/50">(pos 1-{config.cantMaster})</span>
              </label>
              <input type="number" min="4" max="16" step="4" className="input"
                value={config.cantMaster}
                onChange={e => { setConfig({ ...config, cantMaster: Number(e.target.value) }); setSaved(false); }} />
              <p className="text-chalk/30 text-xs mt-1">Entran directo a la Final</p>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                Primera
                <span className="ml-1 text-gold/50">(pos {config.cantMaster + 1}-{config.cantMaster + config.cantPrimera})</span>
              </label>
              <input type="number" min="8" max="48" step="4" className="input"
                value={config.cantPrimera}
                onChange={e => { setConfig({ ...config, cantPrimera: Number(e.target.value) }); setSaved(false); }} />
              <p className="text-chalk/30 text-xs mt-1">Entran directo a Primera</p>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                Segunda
                <span className="ml-1 text-gold/50">(pos {config.cantMaster + config.cantPrimera + 1}-{config.cantMaster + config.cantPrimera + config.cantSegunda})</span>
              </label>
              <input type="number" min="8" max="64" step="4" className="input"
                value={config.cantSegunda}
                onChange={e => { setConfig({ ...config, cantSegunda: Number(e.target.value) }); setSaved(false); }} />
              <p className="text-chalk/30 text-xs mt-1">Entran directo a Segunda</p>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                Cupos desde Clasif.
              </label>
              <input type="number" min="4" max="32" step="4" className="input"
                value={config.cuposDesdeClasif}
                onChange={e => { setConfig({ ...config, cuposDesdeClasif: Number(e.target.value) }); setSaved(false); }} />
              <p className="text-chalk/30 text-xs mt-1">Pasan a Segunda tras la Reducción</p>
            </div>
          </div>
        </div>

        {/* Validación / Preview */}
        <div className="card space-y-4">
          <h2 className="font-display text-lg text-chalk">Vista previa de la estructura</h2>

          {val.alertas.length > 0 && (
            <div className="space-y-2">
              {val.alertas.map((a, i) => (
                <div key={i} className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-2 text-red-400 text-sm">
                  ⚠️ {a}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Clasificatorio */}
            <div className="bg-felt-dark/40 rounded-lg p-4 border border-green-700/20">
              <p className="text-green-400 font-display text-sm uppercase tracking-widest mb-3">Clasificatorio</p>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span className="text-chalk/50">Jugadores</span><span className="text-chalk">{val.jugClasif}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Series</span><span className="text-chalk">{val.seriesClasif}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Clasificados</span><span className="text-chalk">{val.clasifTotal}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Reducción</span><span className={val.necesitaReduccion ? 'text-orange-400' : 'text-green-400'}>{val.necesitaReduccion ? 'Sí' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Pasan</span><span className="text-gold">{config.cuposDesdeClasif}</span></div>
              </div>
            </div>

            {/* Segunda */}
            <div className={`bg-felt-dark/40 rounded-lg p-4 border ${val.segundaValida ? 'border-orange-700/20' : 'border-red-700/40'}`}>
              <p className="text-orange-400 font-display text-sm uppercase tracking-widest mb-3">Segunda</p>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span className="text-chalk/50">Directos</span><span className="text-chalk">{config.cantSegunda}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Del Clasif.</span><span className="text-chalk">{config.cuposDesdeClasif}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Total</span><span className={val.segundaValida ? 'text-green-400' : 'text-red-400'}>{val.jugSegunda} {val.segundaValida ? '✓' : '✗'}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Series</span><span className="text-chalk">{val.seriesSegunda}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Pasan</span><span className="text-gold">{val.clasifSegunda}</span></div>
              </div>
            </div>

            {/* Primera */}
            <div className="bg-felt-dark/40 rounded-lg p-4 border border-blue-700/20">
              <p className="text-blue-400 font-display text-sm uppercase tracking-widest mb-3">Primera</p>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span className="text-chalk/50">Directos</span><span className="text-chalk">{config.cantPrimera}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">De Segunda</span><span className="text-chalk">{val.clasifSegunda}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Total</span><span className="text-chalk">{val.jugPrimera}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Cruces</span><span className="text-chalk">{val.crucesPrimera}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Pasan</span><span className="text-gold">{val.clasifPrimera}</span></div>
              </div>
            </div>

            {/* Master */}
            <div className="bg-felt-dark/40 rounded-lg p-4 border border-purple-700/20">
              <p className="text-purple-400 font-display text-sm uppercase tracking-widest mb-3">Máster</p>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span className="text-chalk/50">Directos</span><span className="text-chalk">{config.cantMaster}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">De Primera</span><span className="text-chalk">{val.clasifPrimera}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Total bracket</span><span className="text-chalk">{val.jugMaster}</span></div>
                <div className="flex justify-between"><span className="text-chalk/50">Primer round</span><span className="text-chalk">{Math.floor(val.jugMaster / 2)} cruces</span></div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-felt-dark/20 rounded-lg px-4 py-3">
            <div className="flex gap-6 text-sm font-mono">
              <span className="text-chalk/50">Total configurado: <span className="text-chalk">{config.cantMaster + config.cantPrimera + config.cantSegunda + val.jugClasif}</span></span>
              {totalInscriptos > 0 && <span className="text-chalk/50">Inscriptos: <span className="text-chalk">{totalInscriptos}</span></span>}
            </div>
            <div className={`text-sm font-semibold ${val.ok ? 'text-green-400' : 'text-red-400'}`}>
              {val.ok ? '✅ Configuración válida' : '❌ Hay errores'}
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        {error && <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

        <div className="flex items-center gap-4">
          <button
            className="btn-primary px-10"
            disabled={saving || !val.ok || !circuitId}
            onClick={handleSave}
          >
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : '💾 Guardar configuración'}
          </button>
          {!val.ok && <p className="text-chalk/40 text-sm">Corregí los errores antes de guardar</p>}
          {saved && <p className="text-green-400 text-sm">La configuración se aplicará al generar los partidos</p>}
        </div>

      </div>
    </div>
  );
}
