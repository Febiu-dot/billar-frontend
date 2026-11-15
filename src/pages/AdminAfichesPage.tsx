import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/ui';

interface Afiche {
  id: number; titulo: string; club: string; tipo: 'oficial' | 'comercial';
  fechaInicio: string; fechaFin: string | null; lugar: string | null; contacto: string | null;
  visible: boolean; estado: 'proximo' | 'en_curso' | 'finalizado'; version: number;
}

const VACIO = { titulo: '', club: '', tipo: 'oficial' as 'oficial' | 'comercial', fechaInicio: '', fechaFin: '', lugar: '', contacto: '' };

// Achica la imagen a 1200 px de ancho como maximo y la pasa a JPG para que la web cargue rapido
function prepararImagen(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1200 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d');
      if (!ctx) { reject(new Error('No se pudo preparar la imagen')); return; }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

const fmt = (f: string) => { const [y, m, d] = f.split('-'); return `${d}/${m}/${y}`; };
const ESTADO = { proximo: 'Próximo', en_curso: 'En curso', finalizado: 'Finalizado' } as const;

export default function AdminAfichesPage() {
  const [lista, setLista] = useState<Afiche[]>([]);
  const [clubes, setClubes] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [imagen, setImagen] = useState<string>('');           // imagen nueva ya preparada
  const [imagenActual, setImagenActual] = useState<string>(''); // al editar: la que ya esta cargada
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const base = api.defaults.baseURL ?? '/api';

  const cargar = () => api.get('/afiches/admin/todos').then(r => setLista(r.data)).finally(() => setCargando(false));

  useEffect(() => {
    cargar();
    api.get('/portada/jugadores').then(r => {
      const s = new Set<string>(); (r.data as any[]).forEach(j => { if (j.club) s.add(j.club); });
      setClubes([...s].sort((a, b) => a.localeCompare(b)));
    }).catch(() => {});
  }, []);

  const limpiar = () => { setForm(VACIO); setEditId(null); setImagen(''); setImagenActual(''); setError(''); if (fileRef.current) fileRef.current.value = ''; };

  const elegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setError('');
    try { setImagen(await prepararImagen(f)); } catch (err: any) { setError(err.message); }
  };

  const guardar = async () => {
    setError(''); setOk('');
    if (!form.titulo.trim() || !form.club.trim()) { setError('Completá el título y el club.'); return; }
    if (!form.fechaInicio) { setError('Elegí la fecha de inicio.'); return; }
    if (!editId && !imagen) { setError('Elegí la imagen del afiche.'); return; }
    setGuardando(true);
    try {
      const datos = { ...form, fechaFin: form.fechaFin || null, ...(imagen ? { imagen } : {}) };
      if (editId) await api.put(`/afiches/${editId}`, datos); else await api.post('/afiches', datos);
      setOk(editId ? 'Cambios guardados.' : 'Afiche cargado. Ya se ve en la portada.');
      limpiar(); cargar();
    } catch (err: any) { setError(err?.response?.data?.error ?? 'No se pudo guardar.'); }
    finally { setGuardando(false); }
  };

  const editar = (a: Afiche) => {
    setEditId(a.id); setOk(''); setError('');
    setForm({ titulo: a.titulo, club: a.club, tipo: a.tipo, fechaInicio: a.fechaInicio, fechaFin: a.fechaFin ?? '', lugar: a.lugar ?? '', contacto: a.contacto ?? '' });
    setImagen(''); setImagenActual(`${base}/afiches/admin/${a.id}/imagen?v=${a.version}`);
    if (fileRef.current) fileRef.current.value = '';
    // la pantalla se desplaza dentro de un contenedor, no la ventana: se lleva el formulario a la vista
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cambiarVisible = async (a: Afiche) => {
    try { await api.patch(`/afiches/${a.id}/visible`, { visible: !a.visible }); cargar(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'No se pudo cambiar'); }
  };

  const eliminar = async (a: Afiche) => {
    if (!confirm(`¿Eliminar el afiche "${a.titulo}"?\n\nSi solo querés sacarlo de la portada, usá "Ocultar".`)) return;
    try { await api.delete(`/afiches/${a.id}`); if (editId === a.id) limpiar(); cargar(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'No se pudo eliminar'); }
  };

  const vigentes = useMemo(() => lista.filter(a => a.estado !== 'finalizado'), [lista]);
  const pasados = useMemo(() => lista.filter(a => a.estado === 'finalizado'), [lista]);
  const campo = 'input w-full';
  const etiqueta = 'block text-xs uppercase tracking-widest text-silver-dark mb-1';

  if (cargando) return <LoadingSpinner />;

  const fila = (a: Afiche) => (
    <div key={a.id} className={`card flex gap-4 items-start ${a.visible ? '' : 'opacity-60'}`}>
      <img src={`${base}/afiches/admin/${a.id}/imagen?v=${a.version}`} alt="" loading="lazy" className="w-20 h-28 object-cover rounded-lg border border-silver-muted/20 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge-status ${a.estado === 'en_curso' ? 'bg-orange/20 text-orange' : a.estado === 'proximo' ? 'bg-green-900/30 text-green-400' : 'bg-chalk/10 text-chalk/40'}`}>{ESTADO[a.estado]}</span>
          <span className="text-xs text-silver-dark uppercase tracking-wider">{a.tipo === 'oficial' ? 'Oficial' : 'Comercial'}</span>
          {!a.visible && <span className="text-xs text-red-400">Oculto</span>}
        </div>
        <h3 className="font-semibold text-silver-light leading-tight">{a.titulo}</h3>
        <p className="text-silver-dark text-sm">{a.club}{a.lugar ? ` · ${a.lugar}` : ''}</p>
        <p className="text-silver-dark text-xs">{fmt(a.fechaInicio)}{a.fechaFin && a.fechaFin !== a.fechaInicio ? ` al ${fmt(a.fechaFin)}` : ''}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button className="btn-secondary py-1 px-3 text-xs" onClick={() => editar(a)}>Editar</button>
          <button className="btn-secondary py-1 px-3 text-xs" onClick={() => cambiarVisible(a)}>{a.visible ? 'Ocultar' : 'Mostrar'}</button>
          <button className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all" onClick={() => eliminar(a)}>Eliminar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Campeonatos de los clubes" subtitle="Cargá el afiche que manda cada club. Se ve en la portada web hasta que termina el campeonato." />
      <div className="p-6 space-y-8 max-w-4xl">
        <div ref={formRef} className="card space-y-4 scroll-mt-4">
          <h2 className="font-display text-xl font-bold text-silver-light uppercase tracking-wide">{editId ? 'Editar afiche' : 'Cargar un afiche nuevo'}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={etiqueta}>Nombre del campeonato</label>
              <input className={campo} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Abierto de Verano" maxLength={120} />
            </div>
            <div>
              <label className={etiqueta}>Club que lo organiza</label>
              <input className={campo} list="lista-clubes" value={form.club} onChange={e => setForm({ ...form, club: e.target.value })} placeholder="Elegí o escribí el club" maxLength={80} />
              <datalist id="lista-clubes">{clubes.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className={etiqueta}>Tipo</label>
              <div className="flex gap-4 min-h-[44px] items-center text-silver-light">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tipo" checked={form.tipo === 'oficial'} onChange={() => setForm({ ...form, tipo: 'oficial' })} className="accent-orange" />Oficial</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tipo" checked={form.tipo === 'comercial'} onChange={() => setForm({ ...form, tipo: 'comercial' })} className="accent-orange" />Comercial</label>
              </div>
            </div>
            <div>
              <label className={etiqueta}>Fecha de inicio</label>
              <input type="date" className={campo} value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} />
            </div>
            <div>
              <label className={etiqueta}>Fecha de fin (si dura más de un día)</label>
              <input type="date" className={campo} value={form.fechaFin} min={form.fechaInicio} onChange={e => setForm({ ...form, fechaFin: e.target.value })} />
            </div>
            <div>
              <label className={etiqueta}>Lugar (opcional)</label>
              <input className={campo} value={form.lugar} onChange={e => setForm({ ...form, lugar: e.target.value })} placeholder="Ciudad o dirección" maxLength={120} />
            </div>
            <div>
              <label className={etiqueta}>Contacto o inscripciones (opcional)</label>
              <input className={campo} value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Teléfono o WhatsApp" maxLength={160} />
            </div>
            <div className="md:col-span-2">
              <label className={etiqueta}>Imagen del afiche {editId ? '(dejala vacía para conservar la actual)' : ''}</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirArchivo} className="text-silver-light text-sm" />
              {(imagen || imagenActual) && (
                <img src={imagen || imagenActual} alt="Vista previa del afiche" className="mt-3 max-h-72 rounded-lg border border-silver-muted/20" />
              )}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {ok && <p className="text-green-400 text-sm">{ok}</p>}
          <div className="flex gap-3">
            <button className="btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Cargar afiche'}</button>
            {(editId || form.titulo || imagen) && <button className="btn-secondary" onClick={limpiar} disabled={guardando}>Cancelar</button>}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-silver-light uppercase tracking-wide orange-line pl-3">En curso y próximos</h2>
          {vigentes.length === 0 ? <div className="card text-silver-dark text-sm text-center py-8">No hay afiches vigentes.</div> : vigentes.map(fila)}
        </div>

        {pasados.length > 0 && (
          <details className="space-y-3">
            <summary className="cursor-pointer text-silver-dark text-sm">Ya finalizados ({pasados.length}). Dejan de verse solos en la portada.</summary>
            <div className="space-y-3 mt-3">{pasados.map(fila)}</div>
          </details>
        )}
      </div>
    </div>
  );
}
