import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PageHeader, LoadingSpinner, Modal, EmptyState } from '../components/ui';

interface JuezUser {
  id: number;
  username: string;
  role: string;
  venueId?: number;
  venueName?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<JuezUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<JuezUser | null>(null);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = () =>
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });

  useEffect(() => { fetchUsers(); }, []);

  const openModal = (user: JuezUser) => {
    setModal(user);
    setPassword('');
    setConfirmar('');
    setError('');
    setSuccess('');
  };

  const handleGuardar = async () => {
    if (!modal) return;
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    setSaving(true);
    setError('');
    try {
      await api.put(`/users/${modal.id}/password`, { password });
      setSuccess('✅ Contraseña actualizada correctamente');
      setPassword('');
      setConfirmar('');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al actualizar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="JUECES DE SEDE"
        subtitle={`${users.length} jueces registrados`}
      />

      <div className="p-6">
        {users.length === 0 ? (
          <EmptyState message="No hay jueces de sede registrados" />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-muted/10 text-silver-dark text-xs uppercase tracking-widest">
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">Sede</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3 font-medium text-silver-light font-mono">{u.username}</td>
                    <td className="px-4 py-3 text-silver-dark">{u.venueName ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="btn-secondary py-1 px-3 text-xs"
                        onClick={() => openModal(u)}
                      >
                        🔑 Cambiar contraseña
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={`CONTRASEÑA — ${modal.username}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <p className="text-chalk/50 text-xs mb-1">Sede</p>
              <p className="text-chalk/80 text-sm font-medium">{modal.venueName ?? '—'}</p>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                className="input"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repetir contraseña"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" disabled={saving} onClick={handleGuardar}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
