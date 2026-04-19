import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-carbon-100 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #e85d04 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange to-transparent" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo-febiu.png"
              alt="FEBIU Uruguay"
              className="w-28 h-28 rounded-full object-cover border-2 border-orange/40 shadow-2xl"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-silver-light uppercase tracking-widest leading-tight">
            Federación de Billar
          </h1>
          <h2 className="font-display text-xl font-bold text-orange uppercase tracking-widest">
            del Uruguay
          </h2>
          <p className="text-silver-dark text-xs tracking-widest uppercase mt-1">Sistema de Torneos</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">Usuario</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="input" placeholder="Ingresá tu usuario" autoFocus required
            />
          </div>
          <div>
            <label className="block text-silver-dark text-xs uppercase tracking-widest mb-1.5">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input" placeholder="••••••••" required
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-base font-bold uppercase tracking-wider" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-4 card text-xs text-silver-dark space-y-1">
          <p className="font-semibold text-silver mb-2">Usuarios de prueba:</p>
          <p><span className="text-orange font-mono">admin</span> / admin123 → Administrador</p>
          <p><span className="text-orange font-mono">juez1</span> / juez123 → Juez Sede 1</p>
          <p><span className="text-orange font-mono">juez2</span> / juez123 → Juez Sede 2</p>
          <div className="border-t border-silver-muted/10 pt-2 mt-2">
            <a href="/publico" className="text-orange/70 hover:text-orange">Ver torneo sin login →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
