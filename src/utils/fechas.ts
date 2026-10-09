// Fechas del sistema: SIEMPRE en horario de Uruguay (UTC-3, sin horario de verano), sin depender
// de la zona horaria del navegador ni del servidor. Usar estas funciones en vez de
// split('T') / toISOString() / toLocaleDateString() sobre fechas ISO.
const TZ = 'America/Montevideo';

function partes(iso: string | Date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
  const g = (t: string) => f.find(x => x.type === t)?.value ?? '';
  return { y: g('year'), m: g('month'), d: g('day'), hh: g('hour') === '24' ? '00' : g('hour'), mm: g('minute') };
}

/** 'YYYY-MM-DD' en Uruguay de un instante (para <input type="date">). */
export const fechaUY = (iso?: string | Date | null): string => { if (!iso) return ''; const p = partes(iso); return `${p.y}-${p.m}-${p.d}`; };
/** 'HH' y 'MM' en Uruguay de un instante. */
export const horaUY = (iso?: string | Date | null): { hora: string; minutos: string } => { if (!iso) return { hora: '', minutos: '' }; const p = partes(iso); return { hora: p.hh, minutos: p.mm }; };
/** Instante ISO (UTC) a partir de fecha 'YYYY-MM-DD' y hora/minutos de Uruguay. */
export const isoDesdeUY = (fecha: string, hora: string, minutos = '00'): string =>
  new Date(`${fecha}T${hora.padStart(2, '0')}:${(minutos || '00').padStart(2, '0')}:00-03:00`).toISOString();

/** Fechas "de calendario" (inicio/fin de circuito): se toma el dia calendario guardado, sin convertir zona. */
export const diaCalendario = (iso?: string | null): string => (iso ? String(iso).slice(0, 10) : '');
export const diaCalendarioFmt = (iso?: string | null): string => { const d = diaCalendario(iso); if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
