import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner } from '../components/ui';

interface Documento {
  id: number; titulo: string; descripcion: string | null; orden: number;
  nombreArchivo: string; bytes: number; visible: boolean; actualizado: string; version: string;
}

const VACIO = { titulo: '', descripcion: '', orden: 0 };
const MAX = 9 * 1024 * 1024;
const mb = (b: number) => (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
const fmt = (f: string) => f.split('-').reverse().join('/');

const aBase64 = (f: File) => new Promise<string>((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => mal(new Error('No se pudo leer el archivo'));
  r.readAsDataURL(f);
});

export default function AdminDocumentosPage() {
  const [lista, setLista] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [pdf, setPdf] = useState<{ nombre: string; data: string; bytes: number } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const base = api.defaults.baseURL ?? '/api';

  const cargar = () => api.get('/documentos/admin/todos').then(r => setLista(r.data)).finally(() => setCargando(false));
  useEffect(() => { cargar(); }, []);

  const limpiar = () => { setForm(VACIO); setEditId(null); setPdf(null); setError(''); if (fileRef.current) fileRef.current.value = ''; };

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setError(''); setPdf(null);
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) { setError('El archivo tiene que ser un PDF.'); e.target.value = ''; return; }
    if (f.size > MAX) { setError(`El PDF pesa ${mb(f.size)} y el máximo es 9 MB. Probá comprimirlo (por ejemplo con ilovepdf.com) y volvé a elegirlo.`); e.target.value = ''; return; }
    try { setPdf({ nombre: f.name, data: await aBase64(f), bytes: f.size }); } catch (err: any) { setError(err.message); }
  };

  const guardar = async () => {
    setError(''); setOk('');
    if (!form.titulo.trim()) { setError('Escribí el título.'); return; }
    if (!editId && !pdf) { setError('Elegí el archivo PDF.'); return; }
    setGuardando(true);
    try {
      const datos = { titulo: form.titulo, descripcion: form.descripcion, orden: Number(form.orden) || 0, ...(pdf ? { archivo: pdf.data, nombreArchivo: pdf.nombre } : {}) };
      if (editId) await api.put(`/documentos/${editId}`, datos); else await api.post('/documentos', datos);
      setOk(editId ? 'Cambios guardados.' : 'Documento cargado. Ya se ve en la portada.');
      limpiar(); cargar();
    } catch (err: any) { setError(err?.response?.data?.error ?? 'No se pudo guardar.'); }
    finally { setGuardando(false); }
  };

  const editar = (d: Documento) => {
    setEditId(d.id); setOk(''); setError(''); setPdf(null);
    setForm({ titulo: d.titulo, descripcion: d.descripcion ?? '', orden: d.orden });
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // abre el PDF con la sesion del administrador (sirve aunque este oculto)
  const ver = async (d: Documento) => {
    try {
      const r = await api.get(`/documentos/admin/${d.id}/archivo`, { responseType: 'blob' });
      window.open(URL.createObjectURL(r.data), '_blank');
    } catch { alert('No se pudo abrir el PDF'); }
  };

  const cambiarVisible = async (d: Documento) => {
    try { await api.patch(`/documentos/${d.id}/visible`, { visible: !d.visible }); cargar(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'No se pudo cambiar'); }
  };

  const eliminar = async (d: Documento) => {
    if (!confirm(`¿Eliminar "${d.titulo}"?\n\nSi solo querés sacarlo de la portada, usá "Ocultar".`)) return;
    try { await api.delete(`/documentos/${d.id}`); if (editId === d.id) limpiar(); cargar(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'No se pudo eliminar'); }
  };

  const campo = 'input w-full';
  const etiqueta = 'block text-xs uppercase tracking-widest text-silver-dark mb-1';
  if (cargando) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Reglamento y documentos" subtitle="Subí el Reglamento y otros documentos oficiales en PDF. Se ven en la portada web para que cualquiera los lea o los descargue." />
      <div className="p-6 space-y-8 max-w-4xl">
        <div ref={formRef} className="card space-y-4 scroll-mt-4">
          <h2 className="font-display text-xl font-bold text-silver-light uppercase tracking-wide">{editId ? 'Editar documento' : 'Subir un documento nuevo'}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={etiqueta}>Título</label>
              <input className={campo} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Reglamento de la Federación" maxLength={140} />
            </div>
            <div className="md:col-span-2">
              <label className={etiqueta}>Descripción corta (opcional)</label>
              <input className={campo} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Texto completo, registrado en el MEC" maxLength={400} />
            </div>
            <div>
              <label className={etiqueta}>Orden en la lista (1 va primero)</label>
              <input type="number" min={0} className={campo} value={form.orden} onChange={e => setForm({ ...form, orden: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <label className={etiqueta}>Archivo PDF (máximo 9 MB) {editId ? '— dejalo vacío para conservar el actual; si elegís otro, reemplaza al anterior' : ''}</label>
              <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={elegir} className="text-silver-light text-sm" />
              {pdf && <p className="text-silver-light text-sm mt-2">Listo para subir: {pdf.nombre} ({mb(pdf.bytes)})</p>}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {ok && <p className="text-green-400 text-sm">{ok}</p>}
          <div className="flex gap-3">
            <button className="btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Subiendo…' : editId ? 'Guardar cambios' : 'Subir documento'}</button>
            {(editId || form.titulo || pdf) && <button className="btn-secondary" onClick={limpiar} disabled={guardando}>Cancelar</button>}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-silver-light uppercase tracking-wide orange-line pl-3">Documentos cargados</h2>
          {lista.length === 0 ? <div className="card text-silver-dark text-sm text-center py-8">Todavía no hay documentos.</div> : lista.map(d => (
            <div key={d.id} className={`card flex gap-4 items-start ${d.visible ? '' : 'opacity-60'}`}>
              <div className="text-4xl shrink-0" aria-hidden>📄</div>
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-semibold text-silver-light leading-tight">{d.titulo} {!d.visible && <span className="text-xs text-red-400 ml-2">Oculto</span>}</h3>
                {d.descripcion && <p className="text-silver-dark text-sm">{d.descripcion}</p>}
                <p className="text-silver-dark text-xs">{d.nombreArchivo} · {mb(d.bytes)} · actualizado el {fmt(d.actualizado)}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button className="btn-secondary py-1 px-3 text-xs" onClick={() => ver(d)}>Ver PDF</button>
                  <button className="btn-secondary py-1 px-3 text-xs" onClick={() => editar(d)}>Editar o reemplazar</button>
                  <button className="btn-secondary py-1 px-3 text-xs" onClick={() => cambiarVisible(d)}>{d.visible ? 'Ocultar' : 'Mostrar'}</button>
                  <button className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all" onClick={() => eliminar(d)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
          <p className="text-silver-dark text-xs">Enlace público de cada documento: {base.startsWith('http') ? '' : window.location.origin}{base}/documentos/ID/archivo</p>
        </div>
      </div>
    </div>
  );
}
