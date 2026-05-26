import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, Modal } from '../components/ui';

interface Venue { id: number; name: string; }
interface UserJuez {
  id: number;
  username: string;
  role: string;
  venueId: number | null;
  venueName: string | null;
}

export default function UsersPage() {
  const [users, setUsers]     = useState<UserJuez[]>([]);
  const [venues, setVenues]   = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal crear usuario
  const [createModal, setCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newVenueId, setNewVenueId]   = useState('');
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal cambiar contraseña
  const [pwModal, setPwModal]       = useState<UserJuez | null>(null);
  const [newPw, setNewPw]           = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwError, setPwError]       = useState('');
  const [pwSuccess, setPwSuccess]   = useState(false);

  const fetchUsers = () =>
    api.get('/users').then(r => setUsers(r.data));

  useEffect(() => {
    Promise.all([
      api.get('/users').then(r => setUsers(r.data)),
      api.get('/venues').then(r => setVenues(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  // ── Crear usuario ─────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (newPassword.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', {
        username: newUsername.trim(),
        password: newPassword,
        venueId: newVenueId || undefined,
      });
      setCreateModal(false);
      setNewUsername(''); setNewPassword(''); setNewVenueId('');
      await fetchUsers();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error ?? 'Error al crear el usuario');
    } finally { setCreating(false); }
  };

  // ── Cambiar contraseña ────────────────────────────────────────────
  const openPwModal = (user: UserJuez) => {
    setPwModal(user);
    setNewPw(''); setNewPwConfirm(''); setPwError(''); setPwSuccess(false);
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (newPw.length < 6) { setPwError('Mínimo 6 caracteres'); return; }
    if (newPw !== newPwConfirm) { setPwError('Las contraseñas no coinciden'); return; }
    if (!pwModal) return;
    setPwSaving(true);
    try {
      await api.put(`/users/${pwModal.id}/password`, { password: newPw });
      setPwSuccess(true);
      setNewPw(''); setNewPwConfirm('');
      setTimeout(() => setPwModal(null), 1500);
    } catch (err: any) {
      setPwError(err?.response?.data?.error ?? 'Error al cambiar la contraseña');
    } finally { setPwSaving(false); }
  };

  // ── Eliminar usuario ──────────────────────────────────────────────
  const handleDelete = async (user: UserJuez) => {
    if (!confirm(`¿Eliminar el usuario "${user.username}"?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar el usuario');
    }
  };

  if (loading) return <LoadingSpinner />;

  const jueces = users.filter(u => u.role === 'juez_sede');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-gold">USUARIOS</h1>
          <p className="text-chalk/50 text-sm mt-1">Gestión de jueces de sede</p>
        </div>
        <button className="btn-primary" onClick={() => { setCreateModal(true); setCreateError(''); }}>
          + Nuevo Juez
        </button>
      </div>

      <div className="p-6 space-y-6">

        {/* Jueces de sede */}
        <div className="card space-y-3">
          <h2 className="font-display text-lg text-chalk">
            Jueces de Sede
            <span className="ml-2 text-chalk/30 text-sm font-sans">({jueces.length})</span>
          </h2>

          {jueces.length === 0 ? (
            <p className="text-chalk/30 text-sm py-4 text-center">
              No hay jueces creados. Creá uno con "+ Nuevo Juez".
            </p>
          ) : (
            <div className="space-y-2">
              {jueces.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-felt-dark/40 border border-felt-light/10 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-chalk/90 font-semibold text-sm font-mono">{u.username}</p>
                    {u.venueName ? (
                      <p className="text-gold/60 text-xs mt-0.5">{u.venueName}</p>
                    ) : (
                      <p className="text-chalk/30 text-xs mt-0.5">Sin sede asignada</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="py-1 px-3 text-xs rounded-lg border border-blue-700/40 text-blue-400 hover:bg-blue-900/20 transition-all"
                      onClick={() => openPwModal(u)}
                    >
                      🔑 Cambiar contraseña
                    </button>
                    <button
                      className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all"
                      onClick={() => handleDelete(u)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admins (solo lectura) */}
        {admins.length > 0 && (
          <div className="card space-y-3">
            <h2 className="font-display text-lg text-chalk">
              Administradores
              <span className="ml-2 text-chalk/30 text-sm font-sans">({admins.length})</span>
            </h2>
            <div className="space-y-2">
              {admins.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-gold/90 font-semibold text-sm font-mono">{u.username}</p>
                    <p className="text-gold/40 text-xs mt-0.5">admin</p>
                  </div>
                  <button
                    className="py-1 px-3 text-xs rounded-lg border border-blue-700/40 text-blue-400 hover:bg-blue-900/20 transition-all"
                    onClick={() => openPwModal(u)}
                  >
                    🔑 Cambiar contraseña
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-felt-dark/20 border border-felt-light/10 rounded-lg p-4 text-xs text-chalk/40 space-y-1">
          <p>• Los jueces de sede inician sesión con su usuario y contraseña desde la app en su dispositivo.</p>
          <p>• Solo pueden ver y cargar resultados de partidos — no tienen acceso al panel de admin.</p>
          <p>• Si un juez olvidó su contraseña, usá "🔑 Cambiar contraseña" para asignarle una nueva.</p>
        </div>

      </div>

      {/* Modal crear usuario */}
      {createModal && (
        <Modal title="NUEVO JUEZ DE SEDE" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Usuario *</label>
              <input
                className="input"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="ej: juez_canelones"
                required
              />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Contraseña * (mín. 6 caracteres)</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="contraseña"
                required
              />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Sede (opcional)</label>
              <select className="input" value={newVenueId} onChange={e => setNewVenueId(e.target.value)}>
                <option value="">Sin sede asignada</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            {createError && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-sm">
                {createError}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={creating}>
                {creating ? 'Creando...' : 'Crear juez'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setCreateModal(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal cambiar contraseña */}
      {pwModal && (
        <Modal title="CAMBIAR CONTRASEÑA" onClose={() => setPwModal(null)}>
          <p className="text-chalk/60 text-sm mb-4">
            Usuario: <span className="text-chalk font-mono font-semibold">{pwModal.username}</span>
          </p>
          <form onSubmit={handleChangePw} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nueva contraseña *</label>
              <input
                type="password"
                className="input"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Confirmar contraseña *</label>
              <input
                type="password"
                className="input"
                value={newPwConfirm}
                onChange={e => setNewPwConfirm(e.target.value)}
                placeholder="repetir contraseña"
                required
              />
            </div>
            {pwError && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-sm">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2 text-green-400 text-sm">
                ✅ Contraseña cambiada correctamente
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={pwSaving}>
                {pwSaving ? 'Guardando...' : '🔑 Cambiar contraseña'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setPwModal(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
