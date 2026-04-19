import { MatchStatus, TableStatus, CategoryName } from '../../types';

// ── Status badges ──────────────────────────────────────────
export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const map: Record<MatchStatus, { label: string; cls: string }> = {
    pendiente: { label: 'Pendiente',  cls: 'bg-chalk/10 text-chalk/60' },
    asignado:  { label: 'Asignado',   cls: 'bg-blue-900/50 text-blue-300' },
    en_juego:  { label: '▶ En Juego', cls: 'bg-gold/20 text-gold pulse-gold' },
    finalizado:{ label: '✓ Finalizado',cls: 'bg-felt-light/30 text-green-400' },
    wo:        { label: 'W.O.',        cls: 'bg-red-900/40 text-red-400' },
  };
  const { label, cls } = map[status] ?? map.pendiente;
  return <span className={`badge-status ${cls}`}>{label}</span>;
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  const map: Record<TableStatus, { label: string; cls: string }> = {
    libre:             { label: '● Libre',    cls: 'bg-green-900/40 text-green-400' },
    ocupada:           { label: '● Ocupada',  cls: 'bg-gold/20 text-gold' },
    fuera_de_servicio: { label: '✕ Fuera',    cls: 'bg-red-900/40 text-red-400' },
  };
  const { label, cls } = map[status] ?? map.libre;
  return <span className={`badge-status ${cls}`}>{label}</span>;
}

export function CategoryBadge({ name }: { name: CategoryName }) {
  const map: Record<CategoryName, { label: string; cls: string }> = {
    master:  { label: 'MÁSTER',  cls: 'bg-yellow-700/40 text-yellow-300' },
    primera: { label: 'PRIMERA', cls: 'bg-blue-800/40 text-blue-300' },
    segunda: { label: 'SEGUNDA', cls: 'bg-purple-800/40 text-purple-300' },
    tercera: { label: 'TERCERA', cls: 'bg-slate-700/40 text-slate-300' },
  };
  const { label, cls } = map[name] ?? map.tercera;
  return <span className={`badge-status ${cls}`}>{label}</span>;
}

// ── PageHeader ─────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-felt-light/20">
      <div>
        <h1 className="font-display text-4xl text-gold">{title}</h1>
        {subtitle && <p className="text-chalk/50 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'gold' }: {
  label: string; value: string | number; icon: string; color?: 'gold' | 'green' | 'blue' | 'red';
}) {
  const colorMap = { gold: 'text-gold', green: 'text-green-400', blue: 'text-blue-400', red: 'text-red-400' };
  return (
    <div className="card flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`font-display text-3xl ${colorMap[color]}`}>{value}</p>
        <p className="text-chalk/50 text-xs uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

// ── PlayerName helper ──────────────────────────────────────
export function playerName(p?: { firstName: string; lastName: string }) {
  if (!p) return '—';
  return `${p.firstName} ${p.lastName}`;
}

// ── Empty state ────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-chalk/30">
      <span className="text-5xl mb-3">🎱</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── LoadingSpinner ─────────────────────────────────────────
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-felt border border-felt-light/40 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-felt-light/20">
          <h3 className="font-display text-xl text-gold">{title}</h3>
          <button onClick={onClose} className="text-chalk/40 hover:text-chalk text-xl leading-none">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
