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

function EyeIcon({ open }: { open: boolean }) {
  if (open) return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordInput({
  value, onChange, placeholder = 'mínimo 6 caracteres'
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className="input pr-10"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk/40 hover:text-chalk/80 transition-colors"
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers]     = useState<UserJuez[]>([]);
  const [venues, setVenues]   = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModal, setCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newVenueId, setNewVenueId]   = useState('');
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  const [pwModal, setPwModal]           = useState<UserJuez | null>(null);
  const [newPw, setNewPw]               = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [pwSaving, setPwSaving]         = useState(false);
  const [pwError, setPwError]           = useState('');
  const [pwSuccess, setPwSuccess]       = useState(false);

  const fetchUsers = () => api.get('/users').then(r => setUsers(r.data));

  useEffect(() => {
    Promise.all([
      api.get('/users').then(r => setUsers(r.data)),
      api.get('/venues').then(r => setVenues(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (newPassword.length < 6) { setCreateError('La contraseña debe tener al menos 6 caracteres'); return; }
    setCreating(true);
    try {
      await api.post('/users', { username: newUsername.trim(), password: newPassword, venueId: newVenueId || undefined });
      setCreateModal(false);
      setNewUsername(''); setNewPassword(''); setNewVenueId('');
      await fetchUsers();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error ?? 'Error al crear el usuario');
    } finally { setCreating(false); }
  };

  const openPwModal = (user: UserJuez) => {
    setPwModal(user); setNewPw(''); setNewPwConfirm(''); setPwError(''); setPwSuccess(false);
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

  const handleDelete = async (user: UserJuez) => {
    if (!confirm(`¿Eliminar el usuario "${user.username}"?`)) return;
    try { await api.delete(`/users/${user.id}`); await fetchUsers(); }
    catch (err: any) { alert(err?.response?.data?.error ?? 'Error al eliminar el usuario'); }
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
        <button className="btn-primary" onClick={() => { setCreateModal(true); setCreateError(''); setNewUsername(''); setNewPassword(''); setNewVenueId(''); }}>
          + Nuevo Juez
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="card space-y-3">
          <h2 className="font-display text-lg text-chalk">Jueces de Sede <span className="ml-2 text-chalk/30 text-sm font-sans">({jueces.length})</span></h2>
          {jueces.length === 0 ? (
            <p className="text-chalk/30 text-sm py-4 text-center">No hay jueces. Creá uno con "+ Nuevo Juez".</p>
          ) : (
            <div className="space-y-2">
              {jueces.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-felt-dark/40 border border-felt-light/10 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-chalk/90 font-semibold text-sm font-mono">{u.username}</p>
                    {u.venueName
                      ? <p className="text-gold/60 text-xs mt-0.5">{u.venueName}</p>
                      : <p className="text-chalk/30 text-xs mt-0.5">Sin sede asignada</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="py-1 px-3 text-xs rounded-lg border border-blue-700/40 text-blue-400 hover:bg-blue-900/20 transition-all" onClick={() => openPwModal(u)}>🔑 Cambiar contraseña</button>
                    <button className="py-1 px-3 text-xs rounded-lg border border-red-700/40 text-red-400 hover:bg-red-900/20 transition-all" onClick={() => handleDelete(u)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {admins.length > 0 && (
          <div className="card space-y-3">
            <h2 className="font-display text-lg text-chalk">Administradores <span className="ml-2 text-chalk/30 text-sm font-sans">({admins.length})</span></h2>
            <div className="space-y-2">
              {admins.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-gold/90 font-semibold text-sm font-mono">{u.username}</p>
                    <p className="text-gold/40 text-xs mt-0.5">admin</p>
                  </div>
                  <button className="py-1 px-3 text-xs rounded-lg border border-blue-700/40 text-blue-400 hover:bg-blue-900/20 transition-all" onClick={() => openPwModal(u)}>🔑 Cambiar contraseña</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-felt-dark/20 border border-felt-light/10 rounded-lg p-4 text-xs text-chalk/40 space-y-1">
          <p>• El usuario debe escribirse exactamente igual (sin espacios, sin mayúsculas extra).</p>
          <p>• Si un juez no puede entrar, usá "🔑 Cambiar contraseña" y avisale la nueva.</p>
          <p>• El juez entra en: <span className="text-chalk/60 font-mono">billar-frontend-blue.vercel.app/login</span></p>
        </div>
      </div>

      {createModal && (
        <Modal title="NUEVO JUEZ DE SEDE" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Usuario *</label>
              <input className="input" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="ej: juez_canelones" autoCapitalize="none" autoCorrect="off" required />
              <p className="text-chalk/30 text-xs mt-1">Solo minúsculas, sin espacios</p>
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Contraseña * (mín. 6 caracteres)</label>
              <PasswordInput value={newPassword} onChange={setNewPassword} />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Sede (opcional)</label>
              <select className="input" value={newVenueId} onChange={e => setNewVenueId(e.target.value)}>
                <option value="">Sin sede asignada</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            {createError && <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-sm">{createError}</div>}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={creating}>{creating ? 'Creando...' : 'Crear juez'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setCreateModal(false)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {pwModal && (
        <Modal title="CAMBIAR CONTRASEÑA" onClose={() => setPwModal(null)}>
          <p className="text-chalk/60 text-sm mb-4">Usuario: <span className="text-chalk font-mono font-semibold">{pwModal.username}</span></p>
          <form onSubmit={handleChangePw} className="space-y-4">
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Nueva contraseña *</label>
              <PasswordInput value={newPw} onChange={setNewPw} placeholder="mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Confirmar contraseña *</label>
              <PasswordInput value={newPwConfirm} onChange={setNewPwConfirm} placeholder="repetir contraseña" />
            </div>
            {pwError && <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-sm">{pwError}</div>}
            {pwSuccess && <div className="bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2 text-green-400 text-sm">✅ Contraseña cambiada correctamente</div>}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1" disabled={pwSaving}>{pwSaving ? 'Guardando...' : '🔑 Cambiar contraseña'}</button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setPwModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
