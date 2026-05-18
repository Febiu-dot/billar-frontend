import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Player, Category, CategoryName, Departamento } from '../types';
import { PageHeader, CategoryBadge, LoadingSpinner, Modal, EmptyState } from '../components/ui';

// Clubes por departamento — agregar según se incorporen nuevos departamentos
const CLUBS_BY_DEPARTAMENTO: Record<string, string[]> = {
  'Montevideo': ['CAPOLAVORO', 'FERIA FRANCA', 'YATAY', 'CABRERA', 'MODEL CENTER', 'NUEVO MALVIN', 'SPORTING UNION', 'CENTENARIO', 'CASA DEL BILLAR', 'PIEDRA HONDA'],
  'Canelones':  ['San Bautista', 'Centro Comercial', '23 de Marzo', 'Lomas 3', 'CAR', 'Club Carlitos'],
  'Rivera':     ['Club Uruguay Rivera'],
};

export default function PlayersPage() {
  const [players, setPlayers]             = useState<Player[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editPlayer, setEditPlayer]       = useState<Player | null>(null);
  const [form, setForm]                   = useState({ firstName: '', lastName: '', dni: '', categoryId: '', club: '', departamentoId: '' });
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [filterCat, setFilterCat]         = useState('');
  const [filterDep, setFilterDep]         = useState('');
  const [search, setSearch]               = useState('');
  const [importando, setImportando]       = useState(false);
  const [importMsg, setImportMsg]         = useState('');
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  const fetchPlayers = () =>
    api.get('/players').then(r => { setPlayers(r.data); setLoading(false); });

  useEffect(() => {
    fetchPlayers();
    api.get('/categories').then(r => setCategories(r.data));
    api.get('/departamentos').then(r => setDepartamentos(r.data));
  }, []);

  // Devuelve la lista de clubes según el departamentoId seleccionado en el form
  const getClubsForForm = (): string[] => {
    if (!form.departamentoId) return [];
    const dep = departamentos.find(d => d.id.toString() === form.departamentoId);
    if (!dep) return [];
    return CLUBS_BY_DEPARTAMENTO[dep.nombre] ?? [];
  };

  const handleDescargarPlantilla = () => {
    const header = ['ID', 'Apellido', 'Nombre', 'CI', 'Club', 'Departamento', 'Categoria'];
    const filas = players.map(p => [
      p.id, p.lastName, p.firstName, p.dni ?? '', p.club ?? '',
      p.departamento?.nombre ?? '', p.category?.name ?? '',
    ]);
    const csv = [header, ...filas].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'jugadores_departamentos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true); setImportMsg('');
    try {
      const text = await file.text();
      const filas = text.split('\n').slice(1).filter(r => r.trim());
      let actualizados = 0, sinDep = 0, erroresUpdate = 0;
      const nuevosJugadores: { firstName: string; lastName: string; dni?: string; categoryId: number; club?: string; departamentoId?: number }[] = [];

      for (const fila of filas) {
        const cols      = fila.split(';');
        const playerId  = parseInt(cols[0]);
        const apellido  = cols[1]?.trim() ?? '';
        const nombre    = cols[2]?.trim() ?? '';
        const ci        = cols[3]?.trim() ?? '';
        const club      = cols[4]?.trim() ?? '';
        const depNombre = cols[5]?.trim().replace(/\r/g, '') ?? '';
        const catNombre = cols[6]?.trim().replace(/\r/g, '').toLowerCase() ?? '';

        if (!depNombre) { sinDep++; continue; }
        const dep = departamentos.find(d => d.nombre.toLowerCase() === depNombre.toLowerCase());
        if (!dep) { erroresUpdate++; continue; }

        const existingPlayer = players.find(p => p.id === playerId);
        if (!existingPlayer || playerId === 0) {
          const cat = categories.find(c => c.name.toLowerCase() === catNombre);
          if (!cat) { erroresUpdate++; continue; }
          nuevosJugadores.push({ firstName: nombre, lastName: apellido, dni: ci || undefined, categoryId: cat.id, club: club || undefined, departamentoId: dep.id });
          continue;
        }

        try {
          await api.put(`/players/${playerId}`, {
            firstName: existingPlayer.firstName, lastName: existingPlayer.lastName,
            dni: existingPlayer.dni, categoryId: existingPlayer.categoryId,
            active: existingPlayer.active, club: existingPlayer.club ?? club,
            departamentoId: dep.id,
          });
          actualizados++;
        } catch { erroresUpdate++; }
      }

      let creados = 0, erroresCreate = 0;
      if (nuevosJugadores.length > 0) {
        try {
          const res = await api.post('/players/bulk', { players: nuevosJugadores });
          creados = res.data.creados ?? 0;
          erroresCreate = res.data.errores ?? 0;
        } catch { erroresCreate = nuevosJugadores.length; }
      }

      await fetchPlayers();
      const totalErrores = erroresUpdate + erroresCreate;
      let msg = '✅ ';
      if (actualizados > 0) msg += `${actualizados} actualizados`;
      if (creados > 0)      msg += `${actualizados > 0 ? ', ' : ''}${creados} creados`;
      if (sinDep > 0)       msg += `, ${sinDep} sin departamento`;
      if (totalErrores > 0) msg += `, ${totalErrores} errores`;
      if (actualizados === 0 && creados === 0) msg = `⚠️ 0 jugadores procesados${totalErrores > 0 ? ` — ${totalErrores} errores` : ''}`;
      setImportMsg(msg);
    } catch {
      setImportMsg('❌ Error al leer el archivo');
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openAdd = () => {
    setEditPlayer(null);
    setForm({ firstName: '', lastName: '', dni: '', categoryId: categories[0]?.id?.toString() ?? '', club: '', departamentoId: '' });
    setError(''); setShowModal(true);
  };

  const openEdit = (p: Player) => {
    setEditPlayer(p);
    setForm({
      firstName:      p.firstName,
      lastName:       p.lastName,
      dni:            p.dni ?? '',
      categoryId:     p.categoryId.toString(),
      club:           p.club ?? '',
      departamentoId: p.departamentoId?.toString() ?? '',
    });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        categoryId:     Number(form.categoryId),
        dni:            form.dni || undefined,
        club:           form.club || undefined,
        departamentoId: form.departamentoId ? Number(form.departamentoId) : undefined,
      };
      if (editPlayer) { await api.put(`/players/${editPlayer.id}`, payload); }
      else { await api.post('/players', payload); }
      setShowModal(false); fetchPlayers();
    } catch { setError('Error al guardar el jugador'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (p: Player) => {
    try {
      await api.put(`/players/${p.id}`, {
        firstName: p.firstName, lastName: p.lastName, dni: p.dni,
        categoryId: p.categoryId, active: !p.active, club: p.club,
        departamentoId: p.departamentoId,
      });
      fetchPlayers();
    } catch { alert('Error al cambiar el estado del jugador'); }
  };

  const catOrder: CategoryName[] = ['master', 'primera', 'segunda', 'tercera'];

  const filtered = players.filter(p => {
    const matchesCat    = filterCat ? p.category?.name === filterCat : true;
    const matchesDep    = filterDep ? p.departamentoId?.toString() === filterDep : true;
    const matchesSearch = search ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesCat && matchesDep && matchesSearch;
  });

  const grouped: Record<string, Player[]> = {};
  filtered.forEach(p => {
    const cat = p.category?.name ?? 'sin_categoria';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });
  Object.keys(grouped).forEach(cat => {
    grouped[cat].sort((a, b) => {
      const depA  = (a.departamento?.nombre ?? '').toUpperCase();
      const depB  = (b.departamento?.nombre ?? '').toUpperCase();
      if (depA !== depB) return depA.localeCompare(depB);
      const ciA   = (a.dni ?? '').toUpperCase();
      const ciB   = (b.dni ?? '').toUpperCase();
      if (ciA !== ciB) return ciA.localeCompare(ciB);
      const clubA = (a.club ?? '').toUpperCase();
      const clubB = (b.club ?? '').toUpperCase();
      if (clubA !== clubB) return clubA.localeCompare(clubB);
      return a.lastName.localeCompare(b.lastName);
    });
  });

  const clubsDisponibles = getClubsForForm();
  const clubActualNoEnLista = form.club && !clubsDisponibles.includes(form.club);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="JUGADORES"
        subtitle={`${players.length} jugadores registrados`}
        action={
          <div className="flex gap-2 flex-wrap">
            <button className="btn-secondary text-xs py-1.5 px-3" onClick={handleDescargarPlantilla}>⬇ Plantilla CSV</button>
            <button className="btn-secondary text-xs py-1.5 px-3" disabled={importando} onClick={() => fileInputRef.current?.click()}>
              {importando ? 'Importando...' : '⬆ Importar departamentos'}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportar} />
            <button className="btn-primary" onClick={openAdd}>+ Nuevo Jugador</button>
          </div>
        }
      />

      {importMsg && (
        <div className={`mx-6 mt-2 px-4 py-2 rounded-lg text-sm ${importMsg.startsWith('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
          {importMsg}
        </div>
      )}

      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-3 items-center">
          <input className="input w-48" placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input w-48" value={filterDep} onChange={e => setFilterDep(e.target.value)}>
            <option value="">Todos los departamentos</option>
            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            <button className={`badge-status cursor-pointer ${!filterCat ? 'bg-orange/20 text-orange' : 'bg-silver-muted/20 text-silver-dark'}`} onClick={() => setFilterCat('')}>Todos</button>
            {catOrder.map(c => (
              <button key={c} className={`badge-status cursor-pointer capitalize ${filterCat === c ? 'bg-orange/20 text-orange' : 'bg-silver-muted/20 text-silver-dark'}`} onClick={() => setFilterCat(filterCat === c ? '' : c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="bg-felt-dark/30 border border-felt-light/10 rounded-lg px-4 py-3 text-xs text-chalk/50 space-y-1">
          <p className="font-semibold text-chalk/70">¿Cómo importar departamentos?</p>
          <p>1. Descargá la plantilla CSV con el botón <strong>⬇ Plantilla CSV</strong></p>
          <p>2. Para <strong>actualizar</strong> jugadores existentes: completá la columna <strong>Departamento</strong></p>
          <p>3. Para <strong>crear jugadores nuevos</strong>: usá ID=0 y completá todas las columnas incluyendo <strong>Categoria</strong></p>
          <p>4. Guardá el archivo como CSV (separado por punto y coma) y subilo con <strong>⬆ Importar departamentos</strong></p>
          <p className="text-chalk/40">Departamentos disponibles: {departamentos.map(d => d.nombre).join(', ')}</p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No se encontraron jugadores" />
        ) : (
          catOrder.filter(c => grouped[c]?.length).map(cat => (
            <div key={cat}>
              <h2 className="font-display text-xl text-silver-dark mb-2 uppercase">{cat}</h2>
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-silver-muted/10 text-silver-dark text-xs uppercase tracking-widest">
                      <th className="text-left px-4 py-3">Jugador</th>
                      <th className="text-left px-4 py-3">Club</th>
                      <th className="text-left px-4 py-3">Departamento</th>
                      <th className="text-left px-4 py-3">Categoria</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">C.I.</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Estado</th>
                      <th className="px-4 py-3 hidden sm:table-cell"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[cat].map(p => (
                      <tr key={p.id} className="table-row">
                        <td className="px-4 py-3 font-medium text-silver-light">{p.lastName}, {p.firstName}</td>
                        <td className="px-4 py-3 text-silver-dark text-xs font-semibold">{p.club ?? '-'}</td>
                        <td className="px-4 py-3 text-silver-dark text-xs">
                          {p.departamento?.nombre
                            ? <span className="badge-status bg-blue-900/20 text-blue-400 text-xs">{p.departamento.nombre}</span>
                            : <span className="text-chalk/20">—</span>}
                        </td>
                        <td className="px-4 py-3">{p.category && <CategoryBadge name={p.category.name} />}</td>
                        <td className="px-4 py-3 text-silver-dark font-mono hidden sm:table-cell">{p.dni ?? '-'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`badge-status ${p.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <div className="flex gap-2 justify-end">
                            <button
                              className={`py-1 px-3 text-xs rounded-lg border transition-all ${p.active ? 'border-red-700/40 text-red-400 hover:bg-red-900/20' : 'border-green-700/40 text-green-400 hover:bg-green-900/20'}`}
                              onClick={() => handleToggleActive(p)}
                            >
                              {p.active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button className="btn-secondary py-1 px-3 text-xs" onClick={() => openEdit(p)}>Editar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <Modal title={editPlayer ? 'EDITAR JUGADOR' : 'NUEVO JUGADOR'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">Nombre *</label>
                <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required placeholder="Juan" />
              </div>
              <div>
                <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">Apellido *</label>
                <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required placeholder="Perez" />
              </div>
            </div>

            {/* Departamento primero para que el club se filtre correctamente */}
            <div>
              <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">Departamento</label>
              <select
                className="input"
                value={form.departamentoId}
                onChange={e => setForm({ ...form, departamentoId: e.target.value, club: '' })}
              >
                <option value="">Sin departamento</option>
                {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">Club</label>
              {clubsDisponibles.length > 0 ? (
                <select className="input" value={form.club} onChange={e => setForm({ ...form, club: e.target.value })}>
                  <option value="">Sin club</option>
                  {/* Mostrar el club actual aunque no esté en la lista del departamento */}
                  {clubActualNoEnLista && (
                    <option value={form.club}>{form.club}</option>
                  )}
                  {clubsDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  className="input"
                  value={form.club}
                  onChange={e => setForm({ ...form, club: e.target.value })}
                  placeholder="Nombre del club"
                />
              )}
            </div>

            <div>
              <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">C.I.</label>
              <input className="input" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} placeholder="Opcional" />
            </div>

            <div>
              <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">Categoria *</label>
              <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">Seleccionar</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
