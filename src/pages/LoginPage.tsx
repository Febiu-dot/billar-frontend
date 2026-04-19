import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-felt-dark relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-felt border-2 border-gold/40 mb-4">
            <span className="text-4xl">🎱</span>
          </div>
          <h1 className="font-display text-6xl text-gold">BILLAR</h1>
          <p className="text-chalk/40 text-sm tracking-widest uppercase mt-1">Tournament Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Usuario</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="input" placeholder="Ingresá tu usuario" autoFocus required
            />
          </div>
          <div>
            <label className="block text-chalk/60 text-xs uppercase tracking-widest mb-1.5">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input" placeholder="••••••••" required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Quick access hint */}
        <div className="mt-6 card text-xs text-chalk/40 space-y-1">
          <p className="font-semibold text-chalk/50 mb-2">Usuarios de prueba:</p>
          <p><span className="text-gold font-mono">admin</span> / admin123 → Administrador</p>
          <p><span className="text-gold font-mono">juez1</span> / juez123 → Juez Sede 1</p>
          <p><span className="text-gold font-mono">juez2</span> / juez123 → Juez Sede 2</p>
          <p><span className="text-gold font-mono">publico</span> / publico123 → Vista Pública</p>
          <div className="border-t border-felt-light/20 pt-2 mt-2">
            <a href="/publico" className="text-gold/70 hover:text-gold">Ver torneo sin login →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
