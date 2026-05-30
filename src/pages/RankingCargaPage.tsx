import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/ui';

interface Tournament { id: number; name: string; year: number; }
interface Circuit    { id: number; name: string; tournamentId: number; order: number; }
interface Player     { id: number; firstName: string; lastName: string; dni?: string; club?: string; }
interface RankingRow { posicion: number; dni: string; apellido: string; nombre: string; club: string; }

// ── Parser CSV manual (sin dependencias) ─────────────────────────────
function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return lines
    .filter(l => l.trim() !== '')
    .map(line => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if ((ch === ',' || ch === ';') && !inQuotes) { cells.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      cells.push(current.trim());
      return cells;
    });
}

export default function RankingCargaPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [circuits, setCircuits]       = useState<Circuit[]>([]);
  const [players, setPlayers]         = useState<Player[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedCircuit, setSelectedCircuit]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [rows, setRows]         = useState<RankingRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading]   = useState(false);
  const [resultado, setResultado]   = useState<{ cargados: number; errores: string[] } | null>(null);

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

  // ── Descargar template CSV ────────────────────────────────────────
  const handleDownloadTemplate = () => {
    if (players.length === 0) { alert('Primero seleccioná un circuito con jugadores inscriptos'); return; }

    const header = 'Posicion,DNI,Apellido,Nombre,Club';
    const rows = players.map((p, i) =>
      `${i + 1},${p.dni ?? ''},${p.lastName},${p.firstName},${p.club ?? ''}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const tournament = tournaments.find(t => t.id === Number(selectedTournament));
    const circuit    = circuits.find(c => c.id === Number(selectedCircuit));
    link.href     = url;
    link.download = `ranking_${tournament?.name ?? 'torneo'}_${circuit?.name ?? 'circuito'}.csv`
      .replace(/\s+/g, '_').toLowerCase();
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Subir y parsear CSV ───────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(''); setRows([]); setResultado(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const raw  = parseCSV(text);
        if (raw.length < 2) { setParseError('El archivo está vacío'); return; }

        const headers = raw[0].map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
        const colPos  = headers.findIndex(h => h.startsWith('pos'));
        const colDni  = headers.findIndex(h => h.includes('dni'));
        const colApe  = headers.findIndex(h => h.startsWith('ape'));
        const colNom  = headers.findIndex(h => h.startsWith('nom'));
        const colClub = headers.findIndex(h => h.includes('club'));

        if (colDni === -1) { setParseError('No se encontró la columna DNI'); return; }

        const parsed: RankingRow[] = [];
        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          const dni = String(row[colDni] ?? '').trim();
          if (!dni) continue;
          const posRaw  = colPos >= 0 ? Number(row[colPos]) : i;
          parsed.push({
            posicion: isNaN(posRaw) ? i : posRaw,
            dni,
            apellido: colApe  >= 0 ? String(row[colApe]  ?? '') : '',
            nombre:   colNom  >= 0 ? String(row[colNom]  ?? '') : '',
            club:     colClub >= 0 ? String(row[colClub] ?? '') : '',
          });
        }

        if (parsed.length === 0) { setParseError('No se encontraron filas válidas'); return; }
        setRows(parsed);
      } catch { setParseError('Error al leer el archivo. Verificá que sea un CSV válido.'); }
    };
    reader.readAsText(file, 'UTF-8');
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
      if ((res.data.errores ?? []).length === 0) setRows([]);
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
        <p className="text-chalk/50 text-sm mt-1">Importar ranking inicial desde archivo CSV (se abre con Excel)</p>
      </div>

      <div className="p-6 space-y-6">

        {/* Selectors */}
        <div className="card space-y-4">
          <h2 className="font-display text-lg text-chalk">Seleccionar circuito</h2>
          <div className="flex flex-wrap gap-3">
            <select className="input w-64" value={selectedTournament}
              onChange={e => { setSelectedTournament(e.target.value); setSelectedCircuit(''); setPlayers([]); setRows([]); setResultado(null); }}>
              <option value="">Seleccioná un torneo</option>
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.year})</option>)}
            </select>
            <select className="input w-56" value={selectedCircuit}
              onChange={e => handleCircuitChange(e.target.value)} disabled={!selectedTournament}>
              <option value="">Seleccioná un circuito</option>
              {circuitsFiltrados.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {selectedCircuit && (
            <p className="text-chalk/50 text-sm font-mono">
              {loadingPlayers ? 'Cargando jugadores...' : `${players.length} jugadores inscriptos`}
            </p>
          )}
        </div>

        {/* Paso 1 */}
        <div className="card space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-display text-lg text-chalk">Paso 1 — Descargar template</h2>
              <p className="text-chalk/40 text-sm mt-1">
                Descargá el CSV con los jugadores. Abrilo en Excel, ordenalos por posición y guardalo como CSV.
              </p>
            </div>
            <button className="btn-primary" onClick={handleDownloadTemplate}
              disabled={!selectedCircuit || players.length === 0}>
              📥 Descargar template CSV
            </button>
          </div>
          <div className="bg-felt-dark/30 rounded-lg p-3 text-xs text-chalk/40 space-y-1">
            <p className="font-semibold text-chalk/60 mb-1">Formato del CSV:</p>
            <p>• Columna <span className="text-gold font-mono">Posicion</span> — número de ranking (1 = mejor)</p>
            <p>• Columna <span className="text-gold font-mono">DNI</span> — clave del jugador (no modificar)</p>
            <p>• Columnas Apellido, Nombre, Club — solo informativas</p>
            <p className="text-blue-400/60 pt-1">💡 En Excel: Guardar como → CSV UTF-8 (delimitado por comas)</p>
          </div>
        </div>

        {/* Paso 2 */}
        <div className="card space-y-3">
          <h2 className="font-display text-lg text-chalk">Paso 2 — Subir CSV completado</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <label className={`btn-secondary cursor-pointer ${!selectedCircuit ? 'opacity-40 pointer-events-none' : ''}`}>
              📂 Seleccionar archivo CSV
              <input type="file" accept=".csv,.txt" className="hidden"
                onChange={handleFileUpload} disabled={!selectedCircuit} />
            </label>
            {fileName && <span className="text-chalk/60 text-sm font-mono">{fileName}</span>}
          </div>
          {parseError && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-sm">❌ {parseError}</div>
          )}
        </div>

        {/* Paso 3: Preview */}
        {rows.length > 0 && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display text-lg text-chalk">Paso 3 — Confirmar carga</h2>
                <p className="text-chalk/40 text-sm mt-1">
                  {rows.length} jugadores listos para <span className="text-gold">{tournament?.name} — {circuit?.name}</span>
                </p>
              </div>
              <button className="btn-primary px-8" onClick={handleConfirmar} disabled={uploading}>
                {uploading ? 'Cargando...' : `✅ Confirmar (${rows.length} jugadores)`}
              </button>
            </div>
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
                        <span className={`font-bold ${row.posicion <= 3 ? 'text-gold' : 'text-chalk/60'}`}>{row.posicion}</span>
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
              {resultado.errores.length > 0 && <span className="ml-2">· {resultado.errores.length} errores</span>}
            </div>
            {resultado.errores.length > 0 && (
              <div className="space-y-1">
                <p className="text-chalk/40 text-xs uppercase tracking-widest">Errores:</p>
                {resultado.errores.map((e, i) => (
                  <div key={i} className="bg-red-900/20 border border-red-700/30 rounded px-3 py-1 text-red-400 text-xs font-mono">{e}</div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
