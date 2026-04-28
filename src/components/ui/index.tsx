import { MatchStatus, TableStatus, CategoryName } from '../../types';

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const map: Record<MatchStatus, { label: string; cls: string }> = {
    pendiente:  { label: 'Pendiente',    cls: 'bg-silver-muted/20 text-silver-dark' },
    asignado:   { label: 'Asignado',     cls: 'bg-blue-900/40 text-blue-300' },
    en_juego:   { label: '▶ En Juego',  cls: 'bg-orange/20 text-orange pulse-orange' },
    finalizado: { label: '✓ Finalizado', cls: 'bg-silver-muted/20 text-green-400' },
    wo:         { label: 'W.O.',          cls: 'bg-red-900/40 text-red-400' },
  };
  const { label, cls } = map[status] ?? map.pendiente;
  return <span className={`badge-status ${cls}`}>{label}</span>;
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  const map: Record<TableStatus, { label: string; cls: string }> = {
    libre:             { label: '● Libre',   cls: 'bg-green-900/30 text-green-400' },
    ocupada:           { label: '● Ocupada', cls: 'bg-orange/20 text-orange' },
    fuera_de_servicio: { label: '✕ Fuera',   cls: 'bg-red-900/30 text-red-400' },
  };
  const { label, cls } = map[status] ?? map.libre;
  return <span className={`badge-status ${cls}`}>{label}</span>;
}

export function CategoryBadge({ name }: { name: CategoryName }) {
  const map: Record<CategoryName, { label: string; cls: string }> = {
    master:  { label: 'MASTER',  cls: 'bg-orange/20 text-orange' },
    primera: { label: 'PRIMERA', cls: 'bg-blue-900/30 text-blue-300' },
    segunda: { label: 'SEGUNDA', cls: 'bg-purple-900/30 text-purple-300' },
    tercera: { label: 'TERCERA', cls: 'bg-silver-muted/20 text-silver-dark' },
  };
  const { label, cls } = map[name] ?? map.tercera;
  return <span className={`badge-status ${cls}`}>{label}</span>;
}

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-silver-muted/10">
      <div className="orange-line pl-4">
        <h1 className="font-display text-3xl font-bold text-silver-light uppercase tracking-wide">{title}</h1>
        {subtitle && <p className="text-silver-dark text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, color = 'orange' }: {
  label: string; value: string | number; icon: string; color?: 'orange' | 'green' | 'blue' | 'red';
}) {
  const colorMap = { orange: 'text-orange', green: 'text-green-400', blue: 'text-blue-400', red: 'text-red-400' };
  return (
    <div className="card flex items-center gap-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`font-display text-4xl font-bold ${colorMap[color]}`}>{value}</p>
        <p className="text-silver-dark text-xs uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

const CLUB_ABBR: Record<string, string> = {
  CAPOLAVORO: 'CAP',
  'FERIA FRANCA': 'FF',
  YATAY: 'YAT',
  CABRERA: 'CAB',
  'MODEL CENTER': 'MC',
  'NUEVO MALVIN': 'NM',
  'SPORTING UNION': 'SU',
  CENTENARIO: 'CEN',
  'CASA DEL BILLAR': 'CDB',
  'PIEDRA HONDA': 'PH',
};

export function playerName(p?: { firstName: string; lastName: string; club?: string }) {
  if (!p) return '-';
  const abbr = p.club ? CLUB_ABBR[p.club.toUpperCase()] : null;
  return abbr ? `${p.firstName} ${p.lastName} (${abbr})` : `${p.firstName} ${p.lastName}`;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-silver-muted">
      <span className="text-4xl mb-3">o</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-orange/30 border-t-orange rounded-full animate-spin" />
    </div>
  );
}

export function Modal({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-carbon-50 border border-silver-muted/20 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-silver-muted/10 flex-shrink-0">
          <h3 className="font-display text-xl font-bold text-orange uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-silver-dark hover:text-silver text-xl leading-none">X</button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}