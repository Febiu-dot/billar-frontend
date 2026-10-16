import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Captura temprana del aviso de instalacion (puede dispararse antes de que cargue React)
window.addEventListener('beforeinstallprompt', (e: any) => { e.preventDefault(); (window as any).__pwaPrompt = e; });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
