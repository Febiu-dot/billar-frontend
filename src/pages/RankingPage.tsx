import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface Jugador { id: number; firstName: string; lastName: string; club?: string; }
interface Clasificado { posicion: number; jugador: Jugador; fuente: string; }
interface FaseRanking { publicado: boolean; clasificados: Clasificado[]; }
interface RankingTorneo {
  clasificatorio: FaseRanking;
  segunda: FaseRanking;
  primera: FaseRanking;
  master: FaseRanking;
}

const FASES = [
  { key: 'clasificatorio', label: 'Clasificatorio', phaseId: 30, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/30' },
  { key: 'segunda', label: 'Segunda', phaseId: 31, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/30' },
  { key: 'primera', label: 'Primera', phaseId: 32, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-700/30' },
  { key: 'master', label: 'Master', phaseId: 33, color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30' },
];

export default function RankingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [ranking, setRanking] = useState<RankingTorneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabActivo, setTabActivo] = useState('clasificatorio');
  const [publicando, setPublicando] = useState<number | null>(null);

  const cargar = async () => {
    try {
      const res = await api.get('/rankings/torneo');
      setRanking(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handlePublicar = async (phaseId: number, publicado: boolean) => {
    setPublicando(phaseId);
    try {
      await api.put(`/rankings/torneo/${phaseId}/publicar`, { publicado });
      await cargar();
    } catch (e) {
      alert('Error al cambiar estado de publicación');
    } finally {
      setPublicando(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!ranking) return <div className="p-6 text-chalk/50">No se pudo cargar el ranking.</div>;

  const faseActual = FASES.find(f => f.key === tabActivo)!;
  const dataActual = ranking[tabActivo as keyof RankingTorneo];

  // Vista pública: solo mostrar fases publicadas
  const fasesVisibles = isAdmin ? FASES : FASES.filter(f => ranking[f.key as keyof RankingTorneo].publicado);

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">RANKING</h1>
        <p className="text-chalk/50 text-sm mt-1">Clasificados por fase del torneo</p>
      </div>

      <div className="p-6 space-y-6">

        {/* Tabs de fases */}
        <div className="flex gap-2 flex-wrap">
          {(isAdmin ? FASES : fasesVisibles).map(f => {
            const data = ranking[f.key as keyof RankingTorneo];
            const activo = tabActivo === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setTabActivo(f.key)}
                className={`py-1.5 px-4 text-sm rounded-lg border transition-all flex items-center gap-2 ${
                  activo
                    ? `${f.border} ${f.color} ${f.bg}`
                    : 'border-felt-light/20 text-chalk/40 hover:border-chalk/30'
                }`}
              >
                {f.label}
                {data.clasificados.length > 0 && (
                  <span className="text-xs opacity-60">{data.clasificados.length}</span>
                )}
                {isAdmin && (
                  <span className={`text-xs ml-1 ${data.publicado ? 'text-green-400' : 'text-chalk/30'}`}>
                    {data.publicado ? '●' : '○'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel de la fase activa */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className={`font-display text-2xl ${faseActual.color}`}>{faseActual.label}</h2>
              <p className="text-chalk/40 text-xs mt-0.5">
                {dataActual.clasificados.length > 0
                  ? `${dataActual.clasificados.length} clasificados`
                  : 'Sin datos aún'}
              </p>
            </div>
            {isAdmin && (
              <button
                className={`py-1.5 px-4 text-xs rounded-lg border transition-all ${
                  dataActual.publicado
                    ? 'border-green-700/40 text-green-400 bg-green-900/20 hover:bg-green-900/30'
                    : 'border-felt-light/20 text-chalk/50 hover:border-chalk/40'
                }`}
                disabled={publicando === faseActual.phaseId}
                onClick={() => handlePublicar(faseActual.phaseId, !dataActual.publicado)}
              >
                {publicando === faseActual.phaseId
                  ? 'Guardando...'
                  : dataActual.publicado
                  ? '✅ Publicado — click para despublicar'
                  : '○ No publicado — click para publicar'}
              </button>
            )}
          </div>

          {dataActual.clasificados.length === 0 ? (
            <div className="text-center py-12 text-chalk/30">
              <p className="text-4xl mb-3">🎱</p>
              <p className="text-sm">
                {isAdmin
                  ? 'Aún no hay clasificados para esta fase.'
                  : 'El ranking de esta fase aún no está disponible.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {dataActual.clasificados.map((c) => (
                <div
                  key={c.posicion}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg border ${
                    c.posicion <= 3
                      ? `${faseActual.border} ${faseActual.bg}`
                      : 'border-felt-light/5 bg-felt-dark/20'
                  }`}
                >
                  <span className={`font-display text-lg w-8 text-right shrink-0 ${
                    c.posicion === 1 ? 'text-gold' :
                    c.posicion === 2 ? 'text-chalk/60' :
                    c.posicion === 3 ? 'text-orange-600/80' :
                    'text-chalk/30'
                  }`}>
                    {c.posicion}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-chalk/90 font-medium text-sm">
                      {c.jugador ? `${c.jugador.lastName}, ${c.jugador.firstName}` : '—'}
                    </p>
                    {c.jugador?.club && (
                      <p className="text-chalk/30 text-xs">{c.jugador.club}</p>
                    )}
                  </div>
                  <span className="text-chalk/20 text-xs font-mono shrink-0">{c.fuente}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info para público */}
        {!isAdmin && fasesVisibles.length === 0 && (
          <div className="text-center py-16 text-chalk/30">
            <p className="text-5xl mb-4">🏆</p>
            <p className="text-lg font-display">El ranking aún no está disponible</p>
            <p className="text-sm mt-2">Volvé más tarde para ver los resultados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
