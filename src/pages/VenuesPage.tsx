mport { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Venue, Table } from '../types';
import { PageHeader, TableStatusBadge, LoadingSpinner, Modal, EmptyState } from '../components/ui';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Mesas modal
  const [tablesModal, setTablesModal] = useState<Venue | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [savingTable, setSavingTable] = useState(false);
  const [tableError, setTableError] = useState('');

  const fetchVenues = () =>
    api.get('/venues').then(r => { setVenues(r.data); setLoading(false); });

  useEffect(() => { fetchVenues(); }, []);

  const openAdd = () => {
    setEditVenue(null);
    setForm({ name: '', address: '', city: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (v: Venue) => {
    setEditVenue(v);
    setForm({ name: v.name, address: v.address ?? '', city: v.city ?? '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editVenue) {
        await api.put(`/venues/${editVenue.id}`, form);
      } else {
        await api.post('/venues', form);
      }
      setShowModal(false);
      setForm({ name: '', address: '', city: '' });
      fetchVenues();
    } catch {
      setError('Error al guardar la sede');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Venue) => {
    if (!confirm(`¿Eliminar la sede "${v.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/venues/${v.id}`);
      fetchVenues();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar la sede');
    }
  };

  const openTablesModal = (v: Venue) => {
    setTablesModal(v);
    setNewTableNumber('');
    setTableError('');
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tablesModal) return;
    setSavingTable(true);
    setTableError('');
    try {
      await api.post('/tables', { number: Number(newTableNumber), venueId: tablesModal.id });
      setNewTableNumber('');
      const updated = await api.get(`/venues/${tablesModal.id}`);
      setTablesModal(updated.data);
      fetchVenues();
    } catch {
      setTableError('Error al agregar la mesa. El número puede estar repetido.');
    } finally {
      setSavingTable(false);
    }
  };

  const handleDeleteTable = async (table: Table) => {
    if (!confirm(`¿Eliminar mesa #${table.number}?`)) return;
    try {
      await api.delete(`/tables/${table.id}`);
      if (tablesModal) {
        const updated = await api.get(`/venues/${tablesModal.id}`);
        setTablesModal(updated.data);
      }
      fetchVenues();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar la mesa');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="SEDES"
        subtitle={`${venues.length} sedes registradas`}
        action={<button className="btn-primary" onClick={openAdd}>+ Nueva Sede</button>}
      />

      <div className="p-6">
        {venues.length === 0 ? (
          <EmptyState message="No hay sedes registradas" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map(v => (
              <div key={v.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-chalk text-lg">{v.name}</h3>
                    {v.address && <p className="text-chalk/50 text-sm">{v.address}</p>}
                    {v.city && <p className="text-chalk/40 text-xs">{v.city}</p>}
                  </div>
                  <span className="font-display text-3xl text-gold">{v._count?.tables ?? v.tables?.length ?? 0}</span>
                </div>

                <div className="border-t border-felt-light/20 pt-3">
                  <p className="text-chalk/40 text-xs uppercase tracking-widest mb-2">Mesas</p>
                  {v.tables && v.tables.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {v.tables.sort((a, b) => a.number - b.number).map(t => (
                        <div key={t.id} className="flex items-center gap-1.5">
                          <span className="text-chalk/60 text-xs font-mono">#{t.number}</span>
                          <TableStatusBadge status={t.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-chalk/30 text-xs">Sin mesas registradas</p>
                  )}
                </div>

                <div className="border-t border-felt-light/20 pt-3 flex gap-2">
                  <button
                    className="btn-secondary py-1 px-3 text-xs flex-1"
                    onClick={() => openTablesModal(v)}
                  >
                    🎱 Mesas
                  </button>
                  <button
                    className="btn-secondary py-1 px-3 text-xs flex-1"
                    onClick={() => openEdit(v)}
                  >
                    Editar
                  </button>
                  <button
                    className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                    onClick={() => handleDelete(v)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal sede */}
      {showModal && (
        <Modal title={editVenue ? 'EDITAR SEDE' : 'NUEVA SEDE'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nombre *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la sede" />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Dirección</label>
              <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Av. Ejemplo 123" />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Ciudad</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Montevideo" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal mesas */}
      {tablesModal && (
        <Modal title={`MESAS — ${tablesModal.name}`} onClose={() => setTablesModal(null)}>
          <div className="space-y-4">
            {/* Lista de mesas */}
            {tablesModal.tables && tablesModal.tables.length > 0 ? (
              <div className="space-y-2">
                {tablesModal.tables.sort((a, b) => a.number - b.number).map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-felt-dark/30 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-2xl text-gold">{t.number}</span>
                      <TableStatusBadge status={t.status} />
                    </div>
                    <button
                      className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                      onClick={() => handleDeleteTable(t)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-chalk/30 text-sm text-center py-4">Sin mesas registradas</p>
            )}

            {/* Agregar mesa */}
            <div className="border-t border-felt-light/20 pt-4">
              <p className="text-chalk/60 text-xs uppercase tracking-widest mb-2">Agregar mesa</p>
              <form onSubmit={handleAddTable} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  className="input flex-1"
                  placeholder="Número de mesa"
                  value={newTableNumber}
                  onChange={e => setNewTableNumber(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary px-4" disabled={savingTable}>
                  {savingTable ? '...' : '+ Agregar'}
                </button>
              </form>
              {tableError && <p className="text-red-400 text-xs mt-1">{tableError}</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
