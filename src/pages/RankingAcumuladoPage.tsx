import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

interface Tournament { id: number; name: string; year: number; }

interface AcumuladoEntry {
  position: number;
  points: number;
  matchesPlayed: number;
  matchesWon: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
  lastCircuitOrder: number;
  circuitosIncluidos: string;
  player: {
    id: number;
    firstName: string;
    lastName: string;
    club?: string;
    category?: { name: string };
  };
}

const CAT_COLORS: Record<string, string> = {
  master:  'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30',
  primera: 'bg-blue-900/40 text-blue-400 border border-blue-700/30',
  segunda: 'bg-green-900/40 text-green-400 border border-green-700/30',
  tercera: 'bg-gray-800/40 text-gray-400 border border-gray-700/30',
};

const CAT_LABEL: Record<string, string> = {
  master:  'Máster',
  primera: 'Primera',
  segunda: 'Segunda',
  tercera: 'Tercera',
};

const exportarExcel = (ranking: any[], torneoNombre: string) => {
  const headers = ['#','Apellido','Nombre','Club','Categoría','Pts','Sets G','Sets P','Dif Sets','Tantos F','Tantos C','Prom Tantos'];
  const rows = ranking.map(e => [
    e.position,
    e.player?.lastName ?? '',
    e.player?.firstName ?? '',
    e.player?.club ?? '',
    e.player?.category?.name ?? '',
    e.points,
    e.setsWon,
    e.setsLost,
    e.setsWon - e.setsLost,
    e.pointsFor,
    e.pointsAgainst,
    e.pointsAgainst > 0 ? (e.pointsFor / e.pointsAgainst).toFixed(4) : '—',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('
');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ranking-acumulado-${torneoNombre.toLowerCase().replace(/\s+/g,'-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function RankingAcumuladoPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [ranking, setRanking] = useState<AcumuladoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('general');
  const [busqueda, setBusqueda] = useState('');
  const [info, setInfo] = useState({ circuitos: '', lastOrder: 0 });

  useEffect(() => {
    api.get('/tournaments').then(r => setTournaments(r.data));
  }, []);

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    setRanking([]);
    setBusqueda('');
    if (!tournamentId) return;
    setLoading(true);
    api.get(`/acumulado/${tournamentId}`)
      .then(r => {
        setRanking(r.data);
        if (r.data.length > 0) {
          setInfo({
            circuitos: r.data[0].circuitosIncluidos ?? '',
            lastOrder: r.data[0].lastCircuitOrder ?? 0,
          });
        }
        setFiltro('general');
      })
      .catch(() => setRanking([]))
      .finally(() => setLoading(false));
  };

  const filtrado = ranking
    .filter(e => filtro === 'general' || e.player.category?.name === filtro)
    .filter(e =>
      busqueda === '' ||
      `${e.player.lastName} ${e.player.firstName}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.player.club ?? '').toLowerCase().includes(busqueda.toLowerCase())
    );

  const counts = {
    general: ranking.length,
    master:  ranking.filter(e => e.player.category?.name === 'master').length,
    primera: ranking.filter(e => e.player.category?.name === 'primera').length,
    segunda: ranking.filter(e => e.player.category?.name === 'segunda').length,
    tercera: ranking.filter(e => e.player.category?.name === 'tercera').length,
  };

  const torneoNombre = tournaments.find(t => t.id === Number(selectedTournament))?.name ?? '';

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">RANKING ACUMULADO</h1>
        <p className="text-chalk/50 text-sm mt-1">Suma de puntos en todos los circuitos jugados del torneo</p>
      </div>

      <div className="p-6 space-y-6">

        {/* Selector de torneo */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="input w-64"
            value={selectedTournament}
            onChange={e => handleTournamentChange(e.target.value)}
          >
            <option value="">Seleccioná un torneo</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.year})</option>
            ))}
          </select>
        </div>

        {/* Estado inicial */}
        {!selectedTournament && !loading && (
          <div className="text-center py-16 text-chalk/30">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-lg font-display">Seleccioná un torneo</p>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {!loading && selectedTournament && ranking.length === 0 && (
          <div className="text-center py-16 text-chalk/30">
            <p className="text-5xl mb-4">🎱</p>
            <p className="text-lg font-display">Sin datos acumulados aún</p>
            <p className="text-sm mt-2">El ranking acumulado se genera automáticamente al finalizar cada fase Master.</p>
          </div>
        )}

        {!loading && ranking.length > 0 && (
          <>
            {/* Info circuitos incluidos */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-blue-400 text-sm font-semibold">📊 {torneoNombre}</span>
              <span className="text-chalk/40 text-xs font-mono">
                Incluye: {info.circuitos || `Circuito ${info.lastOrder}`}
              </span>
              <span className="text-chalk/30 text-xs ml-auto">{ranking.length} jugadores</span>
              <button
                onClick={() => exportarExcel(ranking, torneoNombre)}
                className="ml-2 px-3 py-1 rounded-lg text-xs font-semibold border border-green-700/40 text-green-400 hover:bg-green-900/20 transition-all"
              >
                ⬇ Excel
              </button>
            </div>

            {/* Filtros por categoría */}
            <div className="flex gap-2 flex-wrap">
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

            {/* Buscador */}
            <input
              type="text"
              placeholder="Buscar jugador o club..."
              className="input w-full max-w-sm"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />

            {/* Tabla */}
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-felt-light/10 text-chalk/40 text-xs uppercase tracking-widest">
                    <th className="text-center px-3 py-3 w-12">#</th>
                    <th className="text-left px-4 py-3">Jugador</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Club</th>
                    <th className="text-center px-3 py-3 hidden md:table-cell">Categoría</th>
                    <th className="text-center px-3 py-3">Pts</th>
                    <th className="text-center px-3 py-3 hidden md:table-cell">Sets G</th>
                    <th className="text-center px-3 py-3 hidden md:table-cell">Sets P</th>
                    <th className="text-center px-3 py-3 hidden md:table-cell">Dif. Sets</th>
                    <th className="text-center px-3 py-3 hidden lg:table-cell">Tantos F</th>
                    <th className="text-center px-3 py-3 hidden lg:table-cell">Tantos C</th>
                    <th className="text-center px-3 py-3 hidden lg:table-cell">Prom. Tantos</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map(entry => (
                    <tr
                      key={entry.player.id}
                      className={`border-b border-felt-light/5 transition-colors hover:bg-felt-light/5 ${
                        entry.position <= 8  ? 'bg-yellow-900/5' :
                        entry.position <= 32 ? 'bg-blue-900/5'   :
                        entry.position <= 64 ? 'bg-green-900/5'  : ''
                      }`}
                    >
                      <td className="text-center px-3 py-2.5">
                        <span className={`font-mono font-bold text-sm ${
                          entry.position === 1 ? 'text-gold' :
                          entry.position === 2 ? 'text-chalk/60' :
                          entry.position === 3 ? 'text-orange-600/80' :
                          entry.position <= 8  ? 'text-yellow-400' :
                          entry.position <= 32 ? 'text-blue-400'   :
                          entry.position <= 64 ? 'text-green-400'  : 'text-chalk/40'
                        }`}>
                          {entry.position ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-chalk font-semibold">
                          {entry.player.lastName}, {entry.player.firstName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell text-chalk/50 text-xs">
                        {entry.player.club || '—'}
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-center">
                        {entry.player.category && (
                          <span className={`text-xs px-2 py-0.5 rounded ${CAT_COLORS[entry.player.category.name] ?? ''}`}>
                            {CAT_LABEL[entry.player.category.name] ?? entry.player.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-gold font-bold font-mono text-base">{entry.points}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center hidden md:table-cell text-chalk/70 font-mono text-xs">
                        {entry.setsWon}
                      </td>
                      <td className="px-3 py-2.5 text-center hidden md:table-cell text-red-400/60 font-mono text-xs">
                        {entry.setsLost}
                      </td>
                      <td className="px-3 py-2.5 text-center hidden md:table-cell font-mono text-xs font-bold">
                        <span className={entry.setsWon - entry.setsLost >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {entry.setsWon - entry.setsLost >= 0 ? '+' : ''}{entry.setsWon - entry.setsLost}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center hidden lg:table-cell text-chalk/70 font-mono text-xs">
                        {entry.pointsFor}
                      </td>
                      <td className="px-3 py-2.5 text-center hidden lg:table-cell text-red-400/60 font-mono text-xs">
                        {entry.pointsAgainst}
                      </td>
                      <td className="px-3 py-2.5 text-center hidden lg:table-cell text-cyan-400/60 font-mono text-xs">
                        {entry.pointsAgainst > 0 ? (entry.pointsFor / entry.pointsAgainst).toFixed(4) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-center text-chalk/20 text-xs">
              {filtrado.length} jugadores · ordenados por: Puntos → Diferencia de sets → Promedio de tantos
            </p>
          </>
        )}
      </div>
    </div>
  );
}
