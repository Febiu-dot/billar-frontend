import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Venue } from '../types';
import { PageHeader, TableStatusBadge, LoadingSpinner, Modal, EmptyState } from '../components/ui';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchVenues = () =>
    api.get('/venues').then(r => { setVenues(r.data); setLoading(false); });

  useEffect(() => { fetchVenues(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/venues', form);
      setShowModal(false);
      setForm({ name: '', address: '', city: '' });
      fetchVenues();
    } catch {
      setError('Error al guardar la sede');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="SEDES"
        subtitle={`${venues.length} sedes registradas`}
        action={<button className="btn-primary" onClick={() => setShowModal(true)}>+ Nueva Sede</button>}
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
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="NUEVA SEDE" onClose={() => setShowModal(false)}>
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
    </div>
  );
}
