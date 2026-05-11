import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/ui';

interface Report {
  id: number;
  tipo: string;
  phaseId: number;
  serieId?: string;
  matchId?: number;
  titulo: string;
  contenido: any;
  texto: string;
  publicado: boolean;
  createdAt: string;
}

export default function AdminReportesPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState<number | null>(null);
  const [accion, setAccion] = useState<number | null>(null);

  const cargar = () => {
    api.get('/reports/admin').then(r => { setReports(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const copiar = async (report: Report) => {
    try { await navigator.clipboard.writeText(report.texto); }
    catch {
      const el = document.createElement('textarea');
      el.value = report.texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiado(report.id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const togglePublicado = async (report: Report) => {
    setAccion(report.id);
    try { await api.put(`/reports/${report.id}/toggle`); cargar(); }
    catch (e: any) { alert(e?.response?.data?.error ?? 'Error'); }
    finally { setAccion(null); }
  };

  const eliminar = async (report: Report) => {
    if (!confirm(`¿Eliminar reporte "${report.titulo}"?`)) return;
    setAccion(report.id);
    try { await api.delete(`/reports/${report.id}`); cargar(); }
    catch (e: any) { alert(e?.response?.data?.error ?? 'Error'); }
    finally { setAccion(null); }
  };

  const regenerar = async (report: Report) => {
    setAccion(report.id);
    try {
      if (report.tipo === 'serie' && report.serieId) {
        await api.post(`/reports/regenerar/serie/${report.phaseId}/${report.serieId}`);
      } else if (report.matchId) {
        await api.post(`/reports/regenerar/cruce/${report.matchId}`);
      }
      cargar();
    } catch (e: any) { alert(e?.response?.data?.error ?? 'Error'); }
    finally { setAccion(null); }
  };

  const formatFecha = (d: string) => new Date(d).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="px-6 pt-6 pb-4 border-b border-felt-light/20">
        <h1 className="font-display text-4xl text-gold">REPORTES</h1>
        <p className="text-chalk/50 text-sm mt-1">{reports.length} reportes — visibles en /reportes</p>
      </div>

      <div className="p-6">
        {reports.length === 0 ? (
          <EmptyState message="No hay reportes aún. Se generan automáticamente al terminar partidos." />
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className={`card ${!report.publicado ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge-status text-xs ${report.tipo === 'serie' ? 'bg-blue-900/30 text-blue-400' : 'bg-gold/20 text-gold'}`}>
                        {report.tipo === 'serie' ? 'Serie' : 'Cruce'}
                      </span>
                      <span className={`badge-status text-xs ${report.publicado ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {report.publicado ? 'Publicado' : 'Oculto'}
                      </span>
                      <span className="text-chalk/30 text-xs font-mono">{formatFecha(report.createdAt)}</span>
                    </div>
                    <h3 className="text-chalk font-semibold">{report.titulo}</h3>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => copiar(report)}
                      className={`text-xs px-2 py-1 rounded border transition-all ${copiado === report.id ? 'border-green-500/40 text-green-400' : 'border-chalk/20 text-chalk/50 hover:border-chalk/40'}`}
                    >
                      {copiado === report.id ? '✓' : '📋'}
                    </button>
                    <button
                      onClick={() => regenerar(report)}
                      disabled={accion === report.id}
                      className="text-xs px-2 py-1 rounded border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-all disabled:opacity-50"
                    >
                      {accion === report.id ? '...' : '↺ Regenerar'}
                    </button>
                    <button
                      onClick={() => togglePublicado(report)}
                      disabled={accion === report.id}
                      className={`text-xs px-2 py-1 rounded border transition-all disabled:opacity-50 ${report.publicado ? 'border-orange-500/30 text-orange-400 hover:bg-orange-900/20' : 'border-green-500/30 text-green-400 hover:bg-green-900/20'}`}
                    >
                      {report.publicado ? 'Ocultar' : 'Publicar'}
                    </button>
                    <button
                      onClick={() => eliminar(report)}
                      disabled={accion === report.id}
                      className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-50"
                    >
                      Borrar
                    </button>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-felt-light/5 rounded text-xs font-mono text-chalk/40 whitespace-pre-line max-h-32 overflow-y-auto">
                  {report.texto}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
