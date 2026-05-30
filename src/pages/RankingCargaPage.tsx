import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

interface Tournament { id: number; name: string; year: number; }
interface Circuit    { id: number; name: string; tournamentId: number; order: number; }
interface Player     { id: number; firstName: string; lastName: string; dni?: string; club?: string; }
interface RankingRow { posicion: number; dni: string; apellido: string; nombre: string; club: string; }

export default function RankingCargaPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [circuits, setCircuits]       = useState<Circuit[]>([]);
  const [players, setPlayers]         = useState<Player[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedCircuit, setSelectedCircuit]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Datos parseados del Excel
  const [rows, setRows]       = useState<RankingRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');

  // Resultado de la carga
  const [uploading, setUploading]     = useState(false);
  const [resultado, setResultado]     = useState<{ cargados: number; errores: string[] } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/tournaments').then(r => setTournaments(r.data)),
      api.get('/circuits').then(r => setCircuits(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const circuitsFiltrados = selectedTournament
    ? circuits.filter(c => c.tournamentId === Number(selectedTournament)).sort((a, b) => a.order - b.order)
    : [];

  const handleCircuitChange = async (circuitId: string) => {
    setSelectedCircuit(circuitId);
    setRows([]); setFileName(''); setParseError(''); setResultado(null);
    if (!circuitId) { setPlayers([]); return; }
    setLoadingPlayers(true);
    try {
      const res = await api.get(`/circuits/${circuitId}`);
      const ps = (res.data.players ?? [])
        .map((cp: any) => cp.player)
        .filter((p: any) => p.dni !== 'FEBIU000')
        .sort((a: any, b: any) => a.lastName.localeCompare(b.lastName));
      setPlayers(ps);
    } catch { setPlayers([]); }
    finally { setLoadingPlayers(false); }
  };

  // ── Descargar template con jugadores del circuito ─────────────────
  const handleDownloadTemplate = () => {
    if (players.length === 0) {
      alert('Primero seleccioná un circuito con jugadores inscriptos');
      return;
    }
    const data = [
      ['Posicion', 'DNI', 'Apellido', 'Nombre', 'Club'],
      ...players.map((p, i) => [
        i + 1,
        p.dni ?? '',
        p.lastName,
        p.firstName,
        p.club ?? '',
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking');

    const circuit = circuits.find(c => c.id === Number(selectedCircuit));
    const tournament = tournaments.find(t => t.id === Number(selectedTournament));
    const fileName = `ranking_${tournament?.name ?? 'torneo'}_${circuit?.name ?? 'circuito'}.xlsx`
      .replace(/\s+/g, '_').toLowerCase();

    XLSX.writeFile(wb, fileName);
  };

  // ── Parsear Excel subido ──────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(''); setRows([]); setResultado(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (raw.length < 2) { setParseError('El archivo está vacío o no tiene datos'); return; }

        // Detectar fila de encabezados
        const headers = raw[0].map((h: any) => String(h ?? '').toLowerCase().trim());
        const colPos  = headers.findIndex(h => h.includes('posic'));
        const colDni  = headers.findIndex(h => h.includes('dni'));
        const colApe  = headers.findIndex(h => h.includes('apel'));
        const colNom  = headers.findIndex(h => h.includes('nomb'));
        const colClub = headers.findIndex(h => h.includes('club'));

        if (colDni === -1) { setParseError('No se encontró la columna DNI'); return; }

        const parsed: RankingRow[] = [];
        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          const dni = String(row[colDni] ?? '').trim();
          if (!dni) continue;
          const posicion = colPos >= 0 ? Number(row[colPos]) : i;
          parsed.push({
            posicion:  isNaN(posicion) ? i : posicion,
            dni,
            apellido: colApe  >= 0 ? String(row[colApe]  ?? '') : '',
            nombre:   colNom  >= 0 ? String(row[colNom]  ?? '') : '',
            club:     colClub >= 0 ? String(row[colClub] ?? '') : '',
          });
        }

        if (parsed.length === 0) { setParseError('No se encontraron filas válidas'); return; }
        setRows(parsed);
      } catch (err) {
        setParseError('Error al leer el archivo. Verificá que sea un Excel válido (.xlsx o .xls)');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input para poder subir el mismo archivo de nuevo
    e.target.value = '';
  };

  // ── Confirmar carga ───────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (!selectedCircuit || rows.length === 0) return;
    setUploading(true); setResultado(null);
    try {
      const res = await api.post(`/circuits/${selectedCircuit}/ranking-upload`, {
        rankings: rows.map(r => ({ dni: r.dni, position: r.posicion }))
      });
      setResultado({ cargados: res.data.cargados, errores: res.data.errores ?? [] });
      if (res.data.errores?.length === 0) setRows([]);
    } catch (err: any) {
      setResultado({ cargados: 0, errores: [err?.response?.data?.error ?? 'Error al cargar'] });
    } finally { setUploading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const circuit    = circuits.find(c => c.id === Number(selectedCircuit));
  const tournament = tournaments.find(t => t.id === Number(selectedTournament));

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">CARGA DE RANKING</h1>
        <p className="text-chalk/50 text-sm mt-1">Importar ranking inicial desde Excel</p>
      </div>

      <div className="p-6 space-y-6">

        {/* Selectors */}
        <div className="card space-y-4">
          <h2 className="font-display text-lg text-chalk">Seleccionar circuito</h2>
          <div className="flex flex-wrap gap-3">
            <select
              className="input w-64"
              value={selectedTournament}
              onChange={e => { setSelectedTournament(e.target.value); setSelectedCircuit(''); setPlayers([]); setRows([]); setResultado(null); }}
            >
              <option value="">Seleccioná un torneo</option>
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
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

          {selectedCircuit && (
            <div className="flex items-center gap-3 pt-1">
              {loadingPlayers ? (
                <span className="text-chalk/40 text-sm">Cargando jugadores...</span>
              ) : (
                <span className="text-chalk/50 text-sm font-mono">{players.length} jugadores inscriptos</span>
              )}
            </div>
          )}
        </div>

        {/* Paso 1: Descargar template */}
        <div className="card space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg text-chalk">Paso 1 — Descargar template</h2>
              <p className="text-chalk/40 text-sm mt-1">Descargá el Excel con los jugadores del circuito ya cargados. Solo tenés que ordenarlos por posición.</p>
            </div>
            <button
              className="btn-primary"
              onClick={handleDownloadTemplate}
              disabled={!selectedCircuit || players.length === 0}
            >
              📥 Descargar template
            </button>
          </div>

          <div className="bg-felt-dark/30 rounded-lg p-3 text-xs text-chalk/40 space-y-1">
            <p className="font-semibold text-chalk/60 mb-1">Formato del Excel:</p>
            <p>• Columna <span className="text-gold font-mono">Posicion</span> — número de ranking (1 = mejor)</p>
            <p>• Columna <span className="text-gold font-mono">DNI</span> — clave de identificación del jugador</p>
            <p>• Columnas Apellido, Nombre, Club — solo informativas, no se usan para matching</p>
          </div>
        </div>

        {/* Paso 2: Subir Excel */}
        <div className="card space-y-3">
          <h2 className="font-display text-lg text-chalk">Paso 2 — Subir Excel completado</h2>
          <p className="text-chalk/40 text-sm">Una vez que ordenaste los jugadores por ranking en el Excel, subilo acá.</p>

          <div className="flex items-center gap-3 flex-wrap">
            <label className={`btn-secondary cursor-pointer ${!selectedCircuit ? 'opacity-40 pointer-events-none' : ''}`}>
              📂 Seleccionar archivo
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={!selectedCircuit}
              />
            </label>
            {fileName && <span className="text-chalk/60 text-sm font-mono">{fileName}</span>}
          </div>

          {parseError && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-sm">
              ❌ {parseError}
            </div>
          )}
        </div>

        {/* Paso 3: Preview y confirmar */}
        {rows.length > 0 && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display text-lg text-chalk">Paso 3 — Confirmar carga</h2>
                <p className="text-chalk/40 text-sm mt-1">
                  {rows.length} jugadores listos para cargar en <span className="text-gold">{tournament?.name} — {circuit?.name}</span>
                </p>
              </div>
              <button
                className="btn-primary px-8"
                onClick={handleConfirmar}
                disabled={uploading}
              >
                {uploading ? 'Cargando...' : `✅ Confirmar carga (${rows.length} jugadores)`}
              </button>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm font-mono">
                <thead className="sticky top-0 bg-felt-dark">
                  <tr className="text-chalk/40 text-xs uppercase tracking-widest">
                    <th className="text-left px-3 py-2 w-16">Pos.</th>
                    <th className="text-left px-3 py-2 w-24">DNI</th>
                    <th className="text-left px-3 py-2">Apellido</th>
                    <th className="text-left px-3 py-2">Nombre</th>
                    <th className="text-left px-3 py-2">Club</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-t border-felt-light/5 ${i % 2 === 0 ? 'bg-felt-dark/20' : ''}`}>
                      <td className="px-3 py-1.5">
                        <span className={`font-bold ${row.posicion <= 3 ? 'text-gold' : 'text-chalk/60'}`}>
                          {row.posicion}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-blue-400/80">{row.dni}</td>
                      <td className="px-3 py-1.5 text-chalk/80">{row.apellido}</td>
                      <td className="px-3 py-1.5 text-chalk/60">{row.nombre}</td>
                      <td className="px-3 py-1.5 text-chalk/40">{row.club}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className={`card space-y-3 border ${resultado.errores.length === 0 ? 'border-green-700/40' : 'border-yellow-700/40'}`}>
            <h2 className="font-display text-lg text-chalk">Resultado</h2>
            <div className={`rounded-lg px-4 py-3 text-sm ${resultado.errores.length === 0 ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'}`}>
              ✅ <span className="font-semibold">{resultado.cargados} jugadores</span> cargados correctamente
              {resultado.errores.length > 0 && (
                <span className="ml-2 text-yellow-400">· {resultado.errores.length} errores</span>
              )}
            </div>
            {resultado.errores.length > 0 && (
              <div className="space-y-1">
                <p className="text-chalk/40 text-xs uppercase tracking-widest">Errores:</p>
                {resultado.errores.map((e, i) => (
                  <div key={i} className="bg-red-900/20 border border-red-700/30 rounded px-3 py-1 text-red-400 text-xs font-mono">
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
