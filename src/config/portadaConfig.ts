// Contenido editable de la portada (/portada).
// Lo que esta vacio NO se muestra en la pagina.

export interface Auspiciante {
  nombre: string;
  logo: string;      // ruta del logo, ej: /auspiciantes/marca.png
  url?: string;      // link opcional
}

export interface VideoItem {
  titulo: string;
  tipo: 'Campeonato' | 'Clase' | 'Jugadas' | 'Entrevista';
  youtubeId: string; // ej: dQw4w9WgXcQ
  fecha?: string;
}

export interface NotaItem {
  titulo: string;
  tipo: string;
  fecha?: string;
  autor?: string;
  resumen?: string;
  imagen?: string;
}

// Directo de YouTube. Vacio = se muestra "proxima transmision".
// Ejemplos: 'https://www.youtube.com/embed/live_stream?channel=ID_DEL_CANAL' o 'https://www.youtube.com/embed/ID_DEL_VIDEO'
export const YOUTUBE_EMBED_URL = '';
export const CANAL_YOUTUBE_URL = '';

// Datos de contacto para auspiciantes. Vacios = no se muestra el boton.
export const CONTACTO = {
  email: '',
  whatsapp: '', // solo numeros con codigo de pais, ej: 59899123456
};

export const TRANSMISION_PRESENTADA_POR: Auspiciante | null = null;
export const AUSPICIANTE_PRINCIPAL: Auspiciante | null = null;
export const AUSPICIANTES_OFICIALES: Auspiciante[] = [];

export const VIDEOS: VideoItem[] = [
  { titulo: 'Video de prueba del canal', tipo: 'Campeonato', youtubeId: 'LmH1rnet3AY' },
];
export const NOTAS: NotaItem[] = [];

export const PANAMERICANO_PROXIMO = 'Julio 2027';
export const MUNDIAL = { fecha: 'Octubre de 2027', sede: '' };
