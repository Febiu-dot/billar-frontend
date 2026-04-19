import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Table, Venue, TableStatus } from '../types';
import { PageHeader, TableStatusBadge, LoadingSpinner, Modal, EmptyState } from '../components/ui';

export default function TablesPage() {
  const [tables, setTables]   = useState<Table[]>([]);
  const [venues, setVenues]   = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]       = useState({ number: '', venueId: '' });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [filterVenue, setFilterVenue] = useState('');

  const fetchTables = () =>
    api.get('/tables').then(r => { setTables(r.data); setLoading(false); });

  useEffect(() => {
    fetchTables();
    api.get('/venues').then(r => setVenues(r.data));
    socket.on('table:updated', fetchTables);
    return () => { socket.off('table:updated', fetchTables); };
  }, []);

  const handleStatusToggle = async (table: Table) => {
    const nextStatus: Record<TableStatus, TableStatus> = {
      libre: 'ocupada', ocupada: 'libre', fuera_de_servicio: 'libre',
    };
    await api.put(`/tables/${table.id}/status`, { status: nextStatus[table.status] });
    fetchTables();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/tables', { number: Number(form.number), venueId: Number(form.venueId) });
      setShowModal(false);
      setForm({ number: '', venueId: '' });
      fetchTables();
    } catch {
      setError('Error al guardar la mesa');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterVenue ? tables.filter(t => t.venueId === Number(filterVenue)) : tables;

  // Group by venue
  const byVenue: Record<number, Table[]> = {};
  filtered.forEach(t => {
    if (!byVenue[t.venueId]) byVenue[t.venueId] = [];
    byVenue[t.venueId].push(t);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="MESAS"
        subtitle={`${tables.length} mesas en total`}
        action={<button className="btn-primary" onClick={() => setShowModal(true)}>+ Nueva Mesa</button>}
      />

      <div className="p-6 space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-chalk/50 text-xs uppercase tracking-widest">Sede:</label>
          <select
            className="input w-auto"
            value={filterVenue}
            onChange={e => setFilterVenue(e.target.value)}
          >
            <option value="">Todas</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No hay mesas registradas" />
        ) : (
          Object.entries(byVenue).map(([venueId, venueTables]) => {
            const venue = venues.find(v => v.id === Number(venueId));
            return (
              <div key={venueId}>
                <h2 className="font-display text-xl text-chalk/70 mb-3">
                  🏛️ {venue?.name ?? `Sede ${venueId}`}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {venueTables.sort((a, b) => a.number - b.number).map(t => (
                    <div
                      key={t.id}
                      className={`card text-center cursor-pointer transition-all hover:scale-105 select-none ${
                        t.status === 'ocupada'
                          ? 'border-gold/50 bg-gold/5'
                          : t.status === 'fuera_de_servicio'
                          ? 'border-red-700/30 opacity-50'
                          : 'border-green-600/30'
                      }`}
                      onClick={() => handleStatusToggle(t)}
                      title="Click para cambiar estado"
                    >
                      <p className="font-display text-5xl text-gold mb-1">{t.number}</p>
                      <TableStatusBadge status={t.status} />
                      {t.matches && t.matches[0] && (
                        <p className="text-chalk/40 text-xs mt-2 leading-tight">
                          {t.matches[0].playerA?.firstName} vs {t.matches[0].playerB?.firstName}
                        </p>
                      )}
                      <p className="text-chalk/20 text-xs mt-1">toca para cambiar</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <Modal title="NUEVA MESA" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Sede *</label>
              <select className="input" value={form.venueId} onChange={e => setForm({ ...form, venueId: e.target.value })} required>
                <option value="">Seleccionar sede</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Número de mesa *</label>
              <input type="number" min="1" className="input" value={form.number}
                onChange={e => setForm({ ...form, number: e.target.value })} required placeholder="Ej: 3" />
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
