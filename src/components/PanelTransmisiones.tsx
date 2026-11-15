import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

interface MesaTx { tableId: number; mesa: number; venueId: number; sede: string; canal: string | null; activa: boolean; }

// Panel del juez: prender o apagar la transmision de cada mesa. El canal de YouTube se carga una sola vez.
export default function PanelTransmisiones({ venueId }: { venueId?: number }) {
  const [abierto, setAbierto] = useState(false);
  const [mesas, setMesas] = useState<MesaTx[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState('');

  const cargar = () => {
    const q = venueId ? `?venueId=${venueId}` : '';
    api.get(`/transmisiones/mesas${q}`).then(r => setMesas(r.data)).catch(() => {});
  };
  useEffect(() => {
    cargar();
    socket.on('transmision:updated', cargar);
    return () => { socket.off('transmision:updated', cargar); };
  }, [venueId]);

  const guardar = async (tableId: number, datos: { canal?: string | null; activa?: boolean }) => {
    setGuardando(tableId); setError('');
    try {
      await api.put(`/transmisiones/mesa/${tableId}`, datos);
      setEditando(null); setValor('');
      cargar();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'No se pudo guardar. Probá de nuevo.');
    } finally { setGuardando(null); }
  };

  const prendidas = mesas.filter(m => m.activa).length;

  return (
    <div className="card space-y-3">
      <button type="button" onClick={() => setAbierto(a => !a)} aria-expanded={abierto}
        className="w-full flex items-center justify-between gap-3 text-left min-h-[48px]">
        <span className="text-gold text-sm font-semibold uppercase tracking-widest">
          📺 Transmisiones en vivo {prendidas > 0 && <span className="text-red-400 ml-1">· {prendidas} prendida{prendidas > 1 ? 's' : ''}</span>}
        </span>
        <span className="text-chalk/60 text-sm">{abierto ? 'Ocultar' : 'Mostrar'}</span>
      </button>

      {abierto && (
        <div className="space-y-3">
          <p className="text-chalk/50 text-sm">El canal de cada mesa se carga una sola vez. Después solo tocá Prender o Apagar.</p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {mesas.length === 0 && <p className="text-chalk/50 text-sm">No hay mesas.</p>}
          {mesas.map(m => (
            <div key={m.tableId} className="rounded-lg border border-felt-light/20 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {!venueId && <div className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">{m.sede}</div>}
                  <div className="font-display text-2xl text-chalk leading-none">MESA {m.mesa}</div>
                  <div className={`text-sm ${m.activa ? 'text-red-400 font-semibold' : m.canal ? 'text-chalk/50' : 'text-yellow-400'}`}>
                    {m.activa ? '● En vivo' : m.canal ? 'Apagada' : 'Falta cargar el canal'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={guardando === m.tableId || !m.canal}
                    onClick={() => guardar(m.tableId, { activa: !m.activa })}
                    className={`${m.activa ? 'btn-secondary' : 'btn-primary'} min-h-[52px] min-w-[140px] text-base disabled:opacity-40`}>
                    {m.activa ? 'Apagar' : 'Prender'}
                  </button>
                  <button type="button" className="btn-secondary min-h-[52px] text-base"
                    onClick={() => { setEditando(editando === m.tableId ? null : m.tableId); setValor(m.canal ?? ''); setError(''); }}>
                    {m.canal ? 'Cambiar canal' : 'Cargar canal'}
                  </button>
                </div>
              </div>
              {editando === m.tableId && (
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-chalk/50" htmlFor={`canal-${m.tableId}`}>Código del canal de YouTube (empieza con UC)</label>
                  <input id={`canal-${m.tableId}`} className="input w-full min-h-[48px]" value={valor} onChange={e => setValor(e.target.value)} placeholder="UC..." autoCapitalize="off" autoCorrect="off" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-primary min-h-[48px]" disabled={guardando === m.tableId} onClick={() => guardar(m.tableId, { canal: valor })}>Guardar</button>
                    {m.canal && <button type="button" className="btn-danger min-h-[48px]" disabled={guardando === m.tableId} onClick={() => guardar(m.tableId, { canal: '' })}>Quitar canal</button>}
                    <button type="button" className="btn-secondary min-h-[48px]" onClick={() => setEditando(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
