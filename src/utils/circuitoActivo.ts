// Circuito "en uso": se recuerda entre pantallas para que al pasar de Publicaciones a Series, Cruces, Ranking, etc.
// siempre aparezca seleccionado el mismo torneo y circuito. Solo se cambia cuando la persona lo cambia a mano.
const CLAVE = 'febiu.circuitoActivo';

export interface CircuitoActivo { tournamentId: string; circuitId: string }

export function leerCircuitoActivo(): CircuitoActivo {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return { tournamentId: '', circuitId: '' };
    const o = JSON.parse(raw);
    return { tournamentId: String(o?.tournamentId ?? ''), circuitId: String(o?.circuitId ?? '') };
  } catch {
    return { tournamentId: '', circuitId: '' };
  }
}

export function guardarCircuitoActivo(tournamentId: string | number | null | undefined, circuitId: string | number | null | undefined): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ tournamentId: String(tournamentId ?? ''), circuitId: String(circuitId ?? '') }));
  } catch { /* sin almacenamiento: no pasa nada */ }
}
