import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Player, Category, CategoryName } from '../types';
import { PageHeader, CategoryBadge, LoadingSpinner, Modal, EmptyState } from '../components/ui';

export default function PlayersPage() {
  const [players, setPlayers]     = useState<Player[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [form, setForm]           = useState({ firstName: '', lastName: '', dni: '', categoryId: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch]       = useState('');

  const fetchPlayers = () =>
    api.get('/players').then(r => {
      setPlayers(r.data);
      setLoading(false);
    });

  useEffect(() => {
    fetchPlayers();
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  const openAdd = () => {
    setEditPlayer(null);
    setForm({ firstName: '', lastName: '', dni: '', categoryId: categories[0]?.id?.toString() ?? '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Player) => {
    setEditPlayer(p);
    setForm({ firstName: p.firstName, lastName: p.lastName, dni: p.dni ?? '', categoryId: p.categoryId.toString() });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, categoryId: Number(form.categoryId), dni: form.dni || undefined };
      if (editPlayer) {
        await api.put(`/players/${editPlayer.id}`, payload);
      } else {
        await api.post('/players', payload);
      }
      setShowModal(false);
      fetchPlayers();
    } catch {
      setError('Error al guardar el jugador');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Player) => {
    try {
      await api.put(`/players/${p.id}`, {
        firstName: p.firstName,
        lastName: p.lastName,
        dni: p.dni,
        categoryId: p.categoryId,
        active: !p.active,
      });
      fetchPlayers();
    } catch {
      alert('Error al cambiar el estado del jugador');
    }
  };

  const catOrder: CategoryName[] = ['master', 'primera', 'segunda', 'tercera'];

  const filtered = players.filter(p => {
    const matchesCat = filterCat ? p.category?.name === filterCat : true;
    const matchesSearch = search
      ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesCat && matchesSearch;
  });

  const grouped: Record<string, Player[]> = {};
  filtered.forEach(p => {
    const cat = p.category?.name ?? 'sin_categoria';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="JUGADORES"
        subtitle={`${players.length} jugadores registrados`}
        action={<button className="btn-primary" onClick={openAdd}>+ Nuevo Jugador</button>}
      />

      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input w-48"
            placeholder="Buscar jugador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className={`badge-status cursor-pointer ${!filterCat ? 'bg-gold/20 text-gold' : 'bg-felt-light/20 text-chalk/60'}`}
              onClick={() => setFilterCat('')}
            >Todos</button>
            {catOrder.map(c => (
              <button
                key={c}
                className={`badge-status cursor-pointer capitalize ${filterCat === c ? 'bg-gold/20 text-gold' : 'bg-felt-light/20 text-chalk/60'}`}
                onClick={() => setFilterCat(filterCat === c ? '' : c)}
              >{c}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No se encontraron jugadores" />
        ) : (
          catOrder.filter(c => grouped[c]?.length).map(cat => (
            <div key={cat}>
              <h2 className="font-display text-xl text-chalk/60 mb-2 uppercase">{cat}</h2>
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-felt-light/20 text-chalk/40 text-xs uppercase tracking-widest">
                      <th className="text-left px-4 py-3">Jugador</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">C.I.</th>
                      <th className="text-left px-4 py-3">Categoría</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Estado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[cat].map(p => (
                      <tr key={p.id} className="table-row">
                        <td className="px-4 py-3 font-medium text-chalk">
                          {p.lastName}, {p.firstName}
                        </td>
                        <td className="px-4 py-3 text-chalk/40 font-mono hidden sm:table-cell">
                          {p.dni ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {p.category && <CategoryBadge name={p.category.name} />}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`badge-status ${p.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              className={`py-1 px-3 text-xs rounded-lg border transition-all ${
                                p.active
                                  ? 'border-red-700/40 text-red-400 hover:bg-red-900/20'
                                  : 'border-green-700/40 text-green-400 hover:bg-green-900/20'
                              }`}
                              onClick={() => handleToggleActive(p)}
                            >
                              {p.active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button className="btn-secondary py-1 px-3 text-xs" onClick={() => openEdit(p)}>
                              Editar
                            </button>
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
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nombre *</label>
                <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required placeholder="Juan" />
              </div>
              <div>
                <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Apellido *</label>
                <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required placeholder="Pérez" />
              </div>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">C.I.</label>
              <input className="input" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Categoría *</label>
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
