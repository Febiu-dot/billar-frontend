import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface Tournament { id: number; name: string; }
interface Circuit    { id: number; name: string; tournamentId: number; order: number; }
interface Jugador    { id: number; firstName: string; lastName: string; club?: string; }
interface Clasificado { posicion: number; jugador: Jugador; fuente: string; }
interface FaseRanking  { publicado: boolean; clasificados: Clasificado[]; }
interface RankingTorneo {
  phaseIds:       { clasificatorio: number | null; segunda: number | null; primera: number | null; master: number | null };
  clasificatorio: FaseRanking;
  segunda:        FaseRanking;
  primera:        FaseRanking;
  master:         FaseRanking;
}

const FASES_CONFIG = [
  { key: 'clasificatorio', label: 'Clasificatorio', color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/30' },
  { key: 'segunda',        label: 'Segunda',        color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-700/30'   },
  { key: 'primera',        label: 'Primera',        color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-700/30'  },
  { key: 'master',         label: 'Master',         color: 'text-gold',       bg: 'bg-gold/10',       border: 'border-gold/30'       },
];

export default function RankingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tournaments, setTournaments]         = useState<Tournament[]>([]);
  const [circuits, setCircuits]               = useState<Circuit[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedCircuit, setSelectedCircuit]       = useState('');

  const [ranking, setRanking]     = useState<RankingTorneo | null>(null);
  const [loading, setLoading]     = useState(false);
  const [tabActivo, setTabActivo] = useState('clasificatorio');
  const [publicando, setPublicando] = useState<number | null>(null);

  useEffect(() => {
    api.get('/tournaments').then(r => setTournaments(r.data));
    api.get('/circuits').then(r => setCircuits(r.data));
  }, []);

  const circuitsFiltrados = selectedTournament
    ? circuits.filter(c => c.tournamentId === Number(selectedTournament)).sort((a, b) => a.order - b.order)
    : [];

  // ── Filtra las fases que realmente existen en este circuito ──────────
  // Para Nacional solo existen 'clasificatorio' y 'master'
  // Para Departamental existen las 4
  const getFasesConDatos = (r: RankingTorneo) =>
    FASES_CONFIG.filter(f => {
      const phaseId = r.phaseIds?.[f.key as keyof typeof r.phaseIds];
      const data = r[f.key as keyof Omit<RankingTorneo, 'phaseIds'>] as FaseRanking | undefined;
      return phaseId !== null || (data?.clasificados.length ?? 0) > 0;
    });

  const cargar = async (circuitId: string) => {
    if (!circuitId) return;
    setLoading(true);
    setRanking(null);
    try {
      const res = await api.get(`/rankings/torneo?circuitId=${circuitId}`);
      const data: RankingTorneo = res.data;
      setRanking(data);
      // Tab inicial = primera fase con phaseId real
      const faseInicial = getFasesConDatos(data)[0]?.key ?? 'clasificatorio';
      setTabActivo(faseInicial);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    setSelectedCircuit('');
    setRanking(null);
  };

  const handleCircuitChange = (circuitId: string) => {
    setSelectedCircuit(circuitId);
    cargar(circuitId);
  };

  const handlePublicar = async (phaseId: number | null, publicado: boolean) => {
    if (!phaseId) return;
    setPublicando(phaseId);
    try {
      await api.put(`/rankings/torneo/${phaseId}/publicar`, { publicado });
      await cargar(selectedCircuit);
    } catch (e) {
      alert('Error al cambiar estado de publicación');
    } finally {
      setPublicando(null);
    }
  };

  const faseActual    = FASES_CONFIG.find(f => f.key === tabActivo)!;
  const dataActual    = ranking?.[tabActivo as keyof Omit<RankingTorneo, 'phaseIds'>] as FaseRanking | undefined;
  const phaseIdActual = ranking?.phaseIds?.[tabActivo as keyof typeof ranking.phaseIds] ?? null;

  // Tabs visibles: para admin, todas las que tienen phaseId; para público, solo las publicadas con datos
  const fasesConDatos    = ranking ? getFasesConDatos(ranking) : FASES_CONFIG;
  const fasesVisibles    = isAdmin
    ? fasesConDatos
    : fasesConDatos.filter(f => (ranking?.[f.key as keyof Omit<RankingTorneo, 'phaseIds'>] as FaseRanking | undefined)?.publicado);

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">RANKING</h1>
        <p className="text-chalk/50 text-sm mt-1">Clasificados por fase del torneo</p>
      </div>

      <div className="p-6 space-y-6">

        {/* Selectores torneo / circuito */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="input w-56"
            value={selectedTournament}
            onChange={e => handleTournamentChange(e.target.value)}
          >
            <option value="">Seleccioná un torneo</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <select
            className="input w-56"
            value={selectedCircuit}
            onChange={e => handleCircuitChange(e.target.value)}
            disabled={!selectedTournament}
          >
            <option value="">Seleccioná un circuito</option>
            {circuitsFiltrados.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Estado inicial */}
        {!selectedCircuit && !loading && (
          <div className="text-center py-16 text-chalk/30">
            <p className="text-5xl mb-4">🏆</p>
            <p className="text-lg font-display">Seleccioná un torneo y circuito</p>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {ranking && !loading && (
          <>
            {/* Tabs de fases — dinámicos, solo muestra las que existen */}
            <div className="flex gap-2 flex-wrap">
              {fasesConDatos.map(f => {
                const data = ranking[f.key as keyof Omit<RankingTorneo, 'phaseIds'>] as FaseRanking;
                const phaseId = ranking.phaseIds?.[f.key as keyof typeof ranking.phaseIds];
                const activo = tabActivo === f.key;
                // Público: solo ve tabs publicadas
                if (!isAdmin && !data.publicado) return null;
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
                    {/* Indicador de que no tiene fase (solo admin) */}
                    {isAdmin && !phaseId && (
                      <span className="text-xs text-chalk/20 font-mono">—</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Panel de la fase activa */}
            {dataActual && (
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
                      disabled={publicando === phaseIdActual || !phaseIdActual}
                      onClick={() => handlePublicar(phaseIdActual, !dataActual.publicado)}
                    >
                      {publicando === phaseIdActual
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
                          c.posicion === 3 ? 'text-orange-600/80' : 'text-chalk/30'
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
            )}

            {!isAdmin && fasesVisibles.length === 0 && (
              <div className="text-center py-16 text-chalk/30">
                <p className="text-5xl mb-4">🏆</p>
                <p className="text-lg font-display">El ranking aún no está disponible</p>
                <p className="text-sm mt-2">Volvé más tarde para ver los resultados.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
