import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface RankingEntry {
  posicion: number;
  playerId: number;
  firstName: string;
  lastName: string;
  club: string;
  categoria: string;
  puntos: number;
  setsGanados: number;
  tantos: number;
  promedio: number;
  categoriaProxima: string;
}

const CAT_COLORS: Record<string, string> = {
  master: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30',
  primera: 'bg-blue-900/40 text-blue-400 border border-blue-700/30',
  segunda: 'bg-green-900/40 text-green-400 border border-green-700/30',
  tercera: 'bg-gray-800/40 text-gray-400 border border-gray-700/30',
};

const CAT_LABEL: Record<string, string> = {
  master: 'Máster',
  primera: 'Primera',
  segunda: 'Segunda',
  tercera: 'Tercera',
};

// circuitId del primer circuito — ajustar si cambia
const CIRCUIT_ID_PRIMERO = 9;

export default function RankingFinalPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('general');
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardadoMsg, setGuardadoMsg] = useState('');

  useEffect(() => {
    api.get('/rankings/final')
      .then(r => { setRanking(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleGuardar = async () => {
    if (!confirm('¿Guardar este ranking como base para el Segundo Circuito?')) return;
    setGuardando(true);
    setGuardadoMsg('');
    try {
      const res = await api.post(`/rankings/guardar-final/${CIRCUIT_ID_PRIMERO}`);
      setGuardadoMsg(`✅ ${res.data.message}`);
    } catch (e: any) {
      setGuardadoMsg(`❌ ${e?.response?.data?.error ?? 'Error al guardar'}`);
    } finally {
      setGuardando(false);
    }
  };

  const filtrado = ranking
    .filter(e => filtro === 'general' || e.categoria === filtro)
    .filter(e =>
      busqueda === '' ||
      `${e.lastName} ${e.firstName}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.club.toLowerCase().includes(busqueda.toLowerCase())
    );

  const counts = {
    general: ranking.length,
    master: ranking.filter(e => e.categoria === 'master').length,
    primera: ranking.filter(e => e.categoria === 'primera').length,
    segunda: ranking.filter(e => e.categoria === 'segunda').length,
    tercera: ranking.filter(e => e.categoria === 'tercera').length,
  };

  if (loading) return (
    <div className="min-h-screen bg-carbon-100 flex items-center justify-center">
      <span className="text-gold font-display text-2xl">Calculando ranking...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-carbon-100">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="text-center mb-6">
          <h1 className="font-display text-5xl text-gold mb-1">RANKING PRIMER CIRCUITO</h1>
          <p className="text-chalk/50 text-sm">Departamental Montevideo — FEBIU 2026</p>
          <p className="text-chalk/30 text-xs mt-1">Ranking base para el Segundo Circuito</p>
        </div>

        {/* Botón guardar — solo admin */}
        {user?.role === 'admin' && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <button
              className="btn-primary px-6"
              disabled={guardando}
              onClick={handleGuardar}
            >
              {guardando ? 'Guardando...' : '💾 Usar como base para el Segundo Circuito'}
            </button>
            {guardadoMsg && (
              <span className={`text-sm ${guardadoMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {guardadoMsg}
              </span>
            )}
            <p className="text-chalk/30 text-xs">Presioná este botón antes de generar los partidos del Segundo Circuito</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap justify-center mb-4">
          {(['general', 'master', 'primera', 'segunda', 'tercera'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filtro === cat
                  ? cat === 'general' ? 'bg-gold/20 text-gold border-gold/40' : CAT_COLORS[cat]
                  : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'
              }`}
            >
              {cat === 'general' ? 'General' : CAT_LABEL[cat]}
              <span className="ml-1.5 opacity-60">({counts[cat]})</span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar jugador o club..."
            className="input w-full max-w-sm mx-auto block"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-felt-light/10 text-chalk/40 text-xs uppercase tracking-widest">
                <th className="text-center px-3 py-3 w-12">#</th>
                <th className="text-left px-4 py-3">Jugador</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Club</th>
                <th className="text-center px-3 py-3 hidden md:table-cell">Categoría</th>
                <th className="text-center px-3 py-3">Pts</th>
                <th className="text-center px-3 py-3 hidden sm:table-cell">Sets</th>
                <th className="text-center px-3 py-3 hidden md:table-cell">Tantos</th>
                <th className="text-center px-3 py-3 hidden lg:table-cell">Prom.</th>
              </tr>
            </thead>
            <tbody>
              {filtrado.map(entry => (
                <tr
                  key={entry.playerId}
                  className={`border-b border-felt-light/5 transition-colors ${
                    entry.posicion <= 8 ? 'bg-yellow-900/5' :
                    entry.posicion <= 32 ? 'bg-blue-900/5' :
                    entry.posicion <= 64 ? 'bg-green-900/5' : ''
                  }`}
                >
                  <td className="text-center px-3 py-2.5">
                    <span className={`font-mono font-bold text-sm ${
                      entry.posicion <= 8 ? 'text-yellow-400' :
                      entry.posicion <= 32 ? 'text-blue-400' :
                      entry.posicion <= 64 ? 'text-green-400' : 'text-chalk/40'
                    }`}>{entry.posicion}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-chalk font-semibold">{entry.lastName}, {entry.firstName}</span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-chalk/50 text-xs">{entry.club || '—'}</td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${CAT_COLORS[entry.categoria] ?? ''}`}>
                      {CAT_LABEL[entry.categoria] ?? entry.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-gold font-bold font-mono">{entry.puntos}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center hidden sm:table-cell text-chalk/70 font-mono">{entry.setsGanados}</td>
                  <td className="px-3 py-2.5 text-center hidden md:table-cell text-chalk/70 font-mono">{entry.tantos}</td>
                  <td className="px-3 py-2.5 text-center hidden lg:table-cell text-chalk/50 font-mono text-xs">{entry.promedio.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-chalk/20 text-xs mt-4">
          {filtrado.length} jugadores · ordenados por puntos → sets → tantos → promedio
        </p>
      </div>
    </div>
  );
}
