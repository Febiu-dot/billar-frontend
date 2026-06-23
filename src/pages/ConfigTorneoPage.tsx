import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

interface ConfigDepartamental {
  tipo: 'departamental';
  cantMaster: number;
  cantPrimera: number;
  cantSegunda: number;
  cuposDesdeClasif: number;
}

interface ConfigNacional {
  tipo: 'nacional';
  categoriaFederal: 'primera' | 'segunda' | 'tercera';
  ruleSetSeries: number;
  ruleSetCruces: number;
  formato: '32' | '16';
}

type ConfigTorneo = ConfigDepartamental | ConfigNacional;

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

const PLANTILLAS_DEP: { nombre: string; config: ConfigDepartamental }[] = [
  { nombre: '🟢 Grande (~131 jugadores)',  config: { tipo: 'departamental', cantMaster: 8, cantPrimera: 24, cantSegunda: 32, cuposDesdeClasif: 16 } },
  { nombre: '🔵 Mediano (~90 jugadores)',  config: { tipo: 'departamental', cantMaster: 8, cantPrimera: 16, cantSegunda: 16, cuposDesdeClasif: 12 } },
  { nombre: '🟠 Pequeño (~60 jugadores)', config: { tipo: 'departamental', cantMaster: 8, cantPrimera: 12, cantSegunda: 12, cuposDesdeClasif:  8 } },
  { nombre: '🔴 Chico (~35 jugadores)',   config: { tipo: 'departamental', cantMaster: 4, cantPrimera:  8, cantSegunda:  8, cuposDesdeClasif:  8 } },
];

const CATEGORIAS_NAC = [
  { value: 'primera', label: 'Primera Nacional', color: 'text-blue-400', descripcion: '5 sets en series y cruces' },
  { value: 'segunda', label: 'Segunda Nacional', color: 'text-orange-400', descripcion: '3 sets en series, 5 sets en cruces' },
  { value: 'tercera', label: 'Tercera Nacional', color: 'text-green-400', descripcion: '3 sets en series y cruces' },
];

const RULESET_LABELS: Record<number, string> = {
  1: '3 sets (al mejor de 3)',
  2: '5 sets (al mejor de 5)',
};

function getRuleSetsNacional(cat: string): { series: number; cruces: number } {
  if (cat === 'primera') return { series: 2, cruces: 2 };
  if (cat === 'segunda') return { series: 1, cruces: 2 };
  return { series: 1, cruces: 1 };
}

function calcularValidacion(config: ConfigDepartamental, totalInscriptos: number): Validacion {
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

  if (cantMaster + cantPrimera + cantSegunda > totalInscriptos && totalInscriptos > 0)
    alertas.push(`Los cupos (${cantMaster + cantPrimera + cantSegunda}) superan los inscriptos (${totalInscriptos})`);
  if (jugClasif === 0 && totalInscriptos > 0)
    alertas.push('No hay jugadores para el Clasificatorio con esta configuración');

  return { ok: alertas.length === 0 && segundaValida, jugClasif, seriesClasif, clasifTotal, necesitaReduccion, jugSegunda, segundaValida, seriesSegunda, clasifSegunda, jugPrimera, crucesPrimera, clasifPrimera, jugMaster, alertas };
}

export default function ConfigTorneoPage() {
  const [circuitos, setCircuitos]               = useState<any[]>([]);
  const [circuitId, setCircuitId]               = useState('');
  const [tipoConfig, setTipoConfig]             = useState<'departamental' | 'nacional' | 'panamericano'>('departamental');
  const [configDep, setConfigDep]               = useState<ConfigDepartamental>({ tipo: 'departamental', cantMaster: 8, cantPrimera: 24, cantSegunda: 32, cuposDesdeClasif: 16 });
  const [categoriaFederal, setCategoriaFederal] = useState<'primera' | 'segunda' | 'tercera'>('primera');
  const [formatoNac, setFormatoNac]             = useState<'32' | '16'>('32');
  const [totalInscriptos, setTotalInscriptos]   = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [saving, setSaving]                     = useState(false);
  const [saved, setSaved]                       = useState(false);
  const [error, setError]                       = useState('');

  useEffect(() => {
    api.get('/tournaments').then(r => {
      const allCircuits = r.data.flatMap((t: any) =>
        (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name, torneoYear: t.year }))
      );
      setCircuitos(allCircuits);
      if (allCircuits.length > 0) {
        const maxOrder = Math.max(...allCircuits.map((c: any) => c.order ?? 0));
        const ultimo = allCircuits.find((c: any) => c.order === maxOrder) ?? allCircuits[0];
        setCircuitId(String(ultimo.id));
      }
    }).catch(() => setError('Error al cargar los datos')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!circuitId) return;
    Promise.all([
      api.get(`/circuits/${circuitId}/config-torneo`),
      api.get(`/circuits/${circuitId}`),
    ]).then(([cfgRes, circRes]) => {
      const cfg = cfgRes.data;
      if (cfg.tipo === 'nacional' || cfg.tipo === 'panamericano') {
        setTipoConfig(cfg.tipo);
        setCategoriaFederal(cfg.categoriaFederal ?? 'primera');
        setFormatoNac(cfg.formato === '16' ? '16' : '32');
      } else {
        setTipoConfig('departamental');
        setConfigDep({ tipo: 'departamental', cantMaster: cfg.cantMaster ?? 8, cantPrimera: cfg.cantPrimera ?? 24, cantSegunda: cfg.cantSegunda ?? 32, cuposDesdeClasif: cfg.cuposDesdeClasif ?? 16 });
      }
      const jugadores = (circRes.data.players ?? []).filter((cp: any) => cp.player?.dni !== 'FEBIU000');
      setTotalInscriptos(jugadores.length);
    }).catch(() => {});
  }, [circuitId]);

  const val = calcularValidacion(configDep, totalInscriptos);
  const rulesets = getRuleSetsNacional(categoriaFederal);
  const catNac = CATEGORIAS_NAC.find(c => c.value === categoriaFederal)!;
  const es16 = formatoNac === '16';
  const esFormatoNac = tipoConfig === 'nacional' || tipoConfig === 'panamericano';
  const jugadoresNac = es16 ? 16 : 32;
  const seriesNac = es16 ? 4 : 8;
  const clasificanNac = es16 ? 8 : 16;
  const partidosBracketNac = es16 ? 7 : 15;

  const handleSave = async () => {
    if (!circuitId) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload = esFormatoNac
        ? { tipo: tipoConfig, categoriaFederal, formato: formatoNac }
        : { ...configDep, tipo: 'departamental' };
      await api.put(`/circuits/${circuitId}/config-torneo`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  const canSave = esFormatoNac ? true : val.ok;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">CONFIGURACIÓN DE TORNEO</h1>
        <p className="text-chalk/50 text-sm mt-1">Define la estructura del torneo antes de generar los partidos</p>
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

        {/* Tipo de torneo */}
        <div className="card space-y-3">
          <h2 className="font-display text-lg text-chalk">Tipo de torneo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => { setTipoConfig('departamental'); setSaved(false); }}
              className={`py-3 px-4 rounded-lg border transition-all text-sm font-semibold ${tipoConfig === 'departamental' ? 'border-gold/50 bg-gold/10 text-gold' : 'border-felt-light/20 text-chalk/50 hover:border-chalk/30'}`}>
              🏠 Departamental
              <p className="text-xs font-normal mt-1 opacity-70">Clasificatorio → Segunda → Primera → Máster</p>
            </button>
            <button onClick={() => { setTipoConfig('nacional'); setSaved(false); }}
              className={`py-3 px-4 rounded-lg border transition-all text-sm font-semibold ${tipoConfig === 'nacional' ? 'border-blue-500/50 bg-blue-900/20 text-blue-400' : 'border-felt-light/20 text-chalk/50 hover:border-chalk/30'}`}>
              🏆 Nacional
              <p className="text-xs font-normal mt-1 opacity-70">Series + bracket eliminación directa</p>
            </button>
            <button onClick={() => { setTipoConfig('panamericano'); setSaved(false); }}
              className={`py-3 px-4 rounded-lg border transition-all text-sm font-semibold ${tipoConfig === 'panamericano' ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400' : 'border-felt-light/20 text-chalk/50 hover:border-chalk/30'}`}>
              🌎 Panamericano
              <p className="text-xs font-normal mt-1 opacity-70">Regional — mismo formato que el Nacional</p>
            </button>
          </div>
        </div>

        {/* ─── NACIONAL / PANAMERICANO ──────────────────────────────── */}
        {esFormatoNac && (
          <>
            <div className="card space-y-3">
              <h2 className="font-display text-lg text-chalk">Formato del torneo</h2>
              <div className="flex gap-3">
                <button onClick={() => { setFormatoNac('32'); setSaved(false); }}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all text-sm font-semibold ${formatoNac === '32' ? 'border-gold/50 bg-gold/10 text-gold' : 'border-felt-light/20 text-chalk/50 hover:border-chalk/30'}`}>
                  32 jugadores
                  <p className="text-xs font-normal mt-1 opacity-70">8 series + bracket de 16</p>
                </button>
                <button onClick={() => { setFormatoNac('16'); setSaved(false); }}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-all text-sm font-semibold ${formatoNac === '16' ? 'border-gold/50 bg-gold/10 text-gold' : 'border-felt-light/20 text-chalk/50 hover:border-chalk/30'}`}>
                  16 jugadores
                  <p className="text-xs font-normal mt-1 opacity-70">4 series + bracket de 8</p>
                </button>
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="font-display text-lg text-chalk">Categoría del torneo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORIAS_NAC.map(cat => (
                  <button key={cat.value} onClick={() => { setCategoriaFederal(cat.value as any); setSaved(false); }}
                    className={`text-left p-4 rounded-lg border transition-all ${categoriaFederal === cat.value ? 'border-blue-500/50 bg-blue-900/20' : 'border-felt-light/20 hover:border-chalk/30'}`}>
                    <p className={`font-semibold text-sm ${cat.color}`}>{cat.label}</p>
                    <p className="text-chalk/40 text-xs mt-1">{cat.descripcion}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-display text-lg text-chalk">Estructura del torneo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-felt-dark/40 rounded-lg p-4 border border-green-700/20">
                  <p className="text-green-400 font-display text-sm uppercase tracking-widest mb-3">Fase de Series</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between"><span className="text-chalk/50">Jugadores</span><span className="text-chalk">{jugadoresNac}</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Series</span><span className="text-chalk">{seriesNac} (de 4 jugadores c/u)</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Partidos/serie</span><span className="text-chalk">5</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Formato</span><span className={catNac.color}>{RULESET_LABELS[rulesets.series]}</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Clasifican</span><span className="text-gold">{clasificanNac} (1° y 2° de cada serie)</span></div>
                  </div>
                </div>

                <div className="bg-felt-dark/40 rounded-lg p-4 border border-purple-700/20">
                  <p className="text-purple-400 font-display text-sm uppercase tracking-widest mb-3">Bracket Final</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between"><span className="text-chalk/50">Jugadores</span><span className="text-chalk">{clasificanNac} (seeded por ranking)</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Sistema</span><span className="text-chalk">Eliminación directa</span></div>
                    {!es16 && <div className="flex justify-between"><span className="text-chalk/50">Octavos</span><span className="text-chalk">8 partidos</span></div>}
                    <div className="flex justify-between"><span className="text-chalk/50">Cuartos</span><span className="text-chalk">4 partidos</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Semis</span><span className="text-chalk">2 partidos</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Final</span><span className="text-chalk">1 partido</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Formato</span><span className={catNac.color}>{RULESET_LABELS[rulesets.cruces]}</span></div>
                    <div className="flex justify-between"><span className="text-chalk/50">Total partidos</span><span className="text-gold">{partidosBracketNac}</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-felt-dark/20 rounded-lg p-4 border border-felt-light/10">
                <p className="text-chalk/60 text-xs uppercase tracking-widest mb-3">Sistema de puntuación</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  {[['Serie 1°','8 pts','text-gold'],['Serie 2°','6 pts','text-gold'],['Serie 3°','4 pts','text-gold'],['Serie 4°','2 pts','text-gold'],
                    ['Cruce ganador','3 pts','text-blue-400'],['Cruce perdedor','1 pt','text-blue-400'],
                    ['Final ganador','5 pts','text-purple-400'],['Final perdedor','2 pts','text-purple-400']
                  ].map(([label, pts, color]) => (
                    <div key={label} className="text-center">
                      <p className="text-chalk/40">{label}</p>
                      <p className={`${color} text-lg font-bold`}>{pts}</p>
                    </div>
                  ))}
                </div>
              </div>

              {totalInscriptos > 0 && totalInscriptos !== jugadoresNac && (
                <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-2 text-yellow-400 text-sm">
                  ⚠️ Este circuito tiene {totalInscriptos} inscriptos — este formato requiere exactamente {jugadoresNac} jugadores
                </div>
              )}
              {totalInscriptos === jugadoresNac && (
                <div className="bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-2 text-green-400 text-sm">
                  ✅ {jugadoresNac} jugadores inscriptos — listo para generar
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── DEPARTAMENTAL ────────────────────────────────────────── */}
        {tipoConfig === 'departamental' && (
          <>
            <div className="card space-y-3">
              <h2 className="font-display text-lg text-chalk">Plantillas predefinidas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PLANTILLAS_DEP.map(p => (
                  <button key={p.nombre} onClick={() => { setConfigDep(p.config); setSaved(false); setError(''); }}
                    className="text-left p-3 rounded-lg border border-felt-light/20 hover:border-gold/40 transition-all space-y-1">
                    <p className="text-chalk/80 text-sm font-semibold">{p.nombre}</p>
                    <p className="text-chalk/40 text-xs font-mono">M:{p.config.cantMaster} P:{p.config.cantPrimera} S:{p.config.cantSegunda} C:{p.config.cuposDesdeClasif}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-display text-lg text-chalk">Parámetros del torneo</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'cantMaster', label: 'Máster', pos: `1-${configDep.cantMaster}`, hint: 'Entran directo a la Final' },
                  { key: 'cantPrimera', label: 'Primera', pos: `${configDep.cantMaster+1}-${configDep.cantMaster+configDep.cantPrimera}`, hint: 'Entran directo a Primera' },
                  { key: 'cantSegunda', label: 'Segunda', pos: `${configDep.cantMaster+configDep.cantPrimera+1}-${configDep.cantMaster+configDep.cantPrimera+configDep.cantSegunda}`, hint: 'Entran directo a Segunda' },
                  { key: 'cuposDesdeClasif', label: 'Cupos desde Clasif.', pos: '', hint: 'Pasan a Segunda tras la Reducción' },
                ].map(({ key, label, pos, hint }) => (
                  <div key={key}>
                    <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">
                      {label} {pos && <span className="ml-1 text-gold/50">(pos {pos})</span>}
                    </label>
                    <input type="number" min="4" max="64" step="4" className="input"
                      value={(configDep as any)[key]}
                      onChange={e => { setConfigDep({ ...configDep, [key]: Number(e.target.value) }); setSaved(false); }} />
                    <p className="text-chalk/30 text-xs mt-1">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-display text-lg text-chalk">Vista previa de la estructura</h2>
              {val.alertas.length > 0 && (
                <div className="space-y-2">
                  {val.alertas.map((a, i) => (
                    <div key={i} className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-2 text-red-400 text-sm">⚠️ {a}</div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Clasificatorio', color: 'text-green-400', border: 'border-green-700/20', rows: [['Jugadores', val.jugClasif],['Series', val.seriesClasif],['Clasificados', val.clasifTotal],['Reducción', val.necesitaReduccion ? '⚠️ Sí' : '✓ No'],['Pasan', configDep.cuposDesdeClasif]] },
                  { label: 'Segunda', color: 'text-orange-400', border: val.segundaValida ? 'border-orange-700/20' : 'border-red-700/40', rows: [['Directos', configDep.cantSegunda],['Del Clasif.', configDep.cuposDesdeClasif],['Total', `${val.jugSegunda} ${val.segundaValida ? '✓' : '✗'}`],['Series', val.seriesSegunda],['Pasan', val.clasifSegunda]] },
                  { label: 'Primera', color: 'text-blue-400', border: 'border-blue-700/20', rows: [['Directos', configDep.cantPrimera],['De Segunda', val.clasifSegunda],['Total', val.jugPrimera],['Cruces', val.crucesPrimera],['Pasan', val.clasifPrimera]] },
                  { label: 'Máster', color: 'text-purple-400', border: 'border-purple-700/20', rows: [['Directos', configDep.cantMaster],['De Primera', val.clasifPrimera],['Total bracket', val.jugMaster],['Primer round', `${Math.floor(val.jugMaster/2)} cruces`]] },
                ].map(({ label, color, border, rows }) => (
                  <div key={label} className={`bg-felt-dark/40 rounded-lg p-4 border ${border}`}>
                    <p className={`${color} font-display text-sm uppercase tracking-widest mb-3`}>{label}</p>
                    <div className="space-y-1 text-sm font-mono">
                      {rows.map(([k, v]) => (
                        <div key={String(k)} className="flex justify-between">
                          <span className="text-chalk/50">{k}</span>
                          <span className="text-chalk">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-felt-dark/20 rounded-lg px-4 py-3">
                <div className="flex gap-6 text-sm font-mono">
                  <span className="text-chalk/50">Total configurado: <span className="text-chalk">{configDep.cantMaster + configDep.cantPrimera + configDep.cantSegunda + val.jugClasif}</span></span>
                  {totalInscriptos > 0 && <span className="text-chalk/50">Inscriptos: <span className="text-chalk">{totalInscriptos}</span></span>}
                </div>
                <div className={`text-sm font-semibold ${val.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {val.ok ? '✅ Configuración válida' : '❌ Hay errores'}
                </div>
              </div>
            </div>
          </>
        )}

        {error && <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

        <div className="flex items-center gap-4">
          <button className="btn-primary px-10" disabled={saving || !canSave || !circuitId} onClick={handleSave}>
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : '💾 Guardar configuración'}
          </button>
          {tipoConfig === 'departamental' && !val.ok && <p className="text-chalk/40 text-sm">Corregí los errores antes de guardar</p>}
          {saved && <p className="text-green-400 text-sm">La configuración se aplicará al generar los partidos</p>}
        </div>

      </div>
    </div>
  );
}
