import { useEffect, useState } from 'react';

// Boton grande "Instalar app". Android/Chrome: instala con un toque (sin pasos).
// iPhone (Safari): Apple no permite instalar con un boton; se muestra un cartel minimo con una flecha.
declare global { interface Window { __pwaPrompt?: any } }

const esStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export default function BotonInstalar() {
  const [prompt, setPrompt] = useState<any>(window.__pwaPrompt ?? null);
  const [instalada, setInstalada] = useState(esStandalone());
  const [oculto, setOculto] = useState(() => { try { return sessionStorage.getItem('pwa-oculto') === '1'; } catch { return false; } });
  const [ayudaIOS, setAyudaIOS] = useState(false);

  const ua = navigator.userAgent;
  const esIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  // Samsung Internet instala un paquete viejo que Android 14+ bloquea (Play Protect): hay que usar Chrome
  const esSamsung = /SamsungBrowser/i.test(ua) && /Android/i.test(ua);
  const esSafariIOS = esIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  // Navegador interno de WhatsApp/Facebook/Instagram/Gmail etc. en iPhone: no tiene "Agregar a pantalla de inicio"
  const esInternoIOS = esIOS && !/Safari|CriOS|FxiOS|EdgiOS/.test(ua);

  useEffect(() => {
    const onPrompt = (e: any) => { e.preventDefault(); window.__pwaPrompt = e; setPrompt(e); };
    const onInstalled = () => { setInstalada(true); window.__pwaPrompt = undefined; setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (instalada || oculto) return null;
  if (!esSamsung && !prompt && !esSafariIOS && !esInternoIOS) return null;

  const cerrar = () => { setOculto(true); try { sessionStorage.setItem('pwa-oculto', '1'); } catch {} };
  const abrirEnChrome = () => {
    const u = window.location;
    const web = encodeURIComponent(u.href);
    window.location.href = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${web};end`;
  };
  const instalar = async () => {
    if (esSamsung) { abrirEnChrome(); return; }
    if (prompt) {
      prompt.prompt();
      try { await prompt.userChoice; } catch {}
      window.__pwaPrompt = undefined; setPrompt(null);
    } else {
      setAyudaIOS(true);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9999, padding: '10px 12px calc(10px + env(safe-area-inset-bottom))', background: 'rgba(10,10,10,.92)', borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={instalar}
          style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 12px', fontSize: esSamsung ? 17 : 20, fontWeight: 800, letterSpacing: '.02em' }}>
          {esSamsung ? '🌐 ABRIR EN CHROME PARA INSTALAR' : '📲 INSTALAR APP'}
        </button>
        <button onClick={cerrar} aria-label="Cerrar"
          style={{ background: 'transparent', color: '#aaa', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '14px 16px', fontSize: 18 }}>✕</button>
      </div>
      {ayudaIOS && (
        <div onClick={() => setAyudaIOS(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,.75)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {esInternoIOS ? (
            <div style={{ background: '#fff', color: '#111', borderRadius: 18, padding: '22px 20px', textAlign: 'center', maxWidth: 360, fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>
              Para instalar, abrí esta página en <span style={{ color: '#16a34a' }}>Safari</span><br />
              <span style={{ fontSize: 16, fontWeight: 500 }}>Tocá ⋯ o el ícono de la brújula y elegí “Abrir en Safari”. O copiá el link y pegalo en Safari.</span>
            </div>
          ) : (
            <div style={{ background: '#fff', color: '#111', borderRadius: 18, padding: '22px 20px', textAlign: 'left', maxWidth: 360, fontSize: 19, fontWeight: 700, lineHeight: 1.4 }}>
              <div>1. Tocá <span style={{ fontSize: 26 }}>⬆️</span> <span style={{ fontSize: 15, fontWeight: 500 }}>(Compartir: abajo en el centro, o arriba a la derecha. Si no lo ves, tocá ⋯)</span></div>
              <div style={{ marginTop: 10 }}>2. Deslizá hacia arriba y elegí <span style={{ color: '#16a34a' }}>“Agregar a pantalla de inicio”</span> <span style={{ fontSize: 15, fontWeight: 500 }}>(puede estar en “Ver más”)</span></div>
              <div style={{ marginTop: 10 }}>3. Tocá <span style={{ color: '#16a34a' }}>“Agregar”</span></div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
