// Panamericano de Billar 2026 (Willy Billar Club, San Jose, Uruguay — 4 y 5 de julio de 2026).
// Datos fijos tomados de las publicaciones oficiales; no dependen de la base de datos del sistema.
// Las imagenes estan en public/panamericano-2026/.

export interface Posicion { puesto: string; nombre: string; pais: 'URU' | 'ARG' | 'BRA' }

export interface CategoriaPana {
  id: string;
  nombre: string;
  posiciones: Posicion[];   // vacio = resultado final todavia sin cargar
  fixture: string;          // imagen del fixture inicial
  bracket?: string;         // imagen del bracket final (solo si tiene resultados)
}

export const PANAMERICANO_2026 = {
  titulo: 'Panamericano 2026',
  lugar: 'Willy Billar Club · San José, Uruguay',
  fecha: '4 y 5 de julio de 2026',
  categorias: [
    {
      id: 'maxima', nombre: 'Máxima',
      posiciones: [
        { puesto: 'Campeón', nombre: 'José Oliva', pais: 'ARG' },
        { puesto: 'Subcampeón', nombre: 'Walter Ingenieri', pais: 'ARG' },
        { puesto: 'Semifinalista', nombre: 'Eduardo Cortés', pais: 'ARG' },
        { puesto: 'Semifinalista', nombre: 'Andrés Lajuni', pais: 'URU' },
      ],
      fixture: '/panamericano-2026/maxima-fixture.jpg', bracket: '/panamericano-2026/maxima-bracket.jpg',
    },
    {
      id: 'segunda', nombre: 'Segunda',
      posiciones: [
        { puesto: 'Campeón', nombre: 'Guido Isaia', pais: 'ARG' },
        { puesto: 'Subcampeón', nombre: 'Nelson Saino', pais: 'ARG' },
        { puesto: 'Semifinalista', nombre: 'Gil Nieves', pais: 'URU' },
        { puesto: 'Semifinalista', nombre: 'Andrés Wulfson', pais: 'ARG' },
      ],
      fixture: '/panamericano-2026/segunda-fixture.jpg', bracket: '/panamericano-2026/segunda-bracket.jpg',
    },
    {
      id: 'tercera', nombre: 'Tercera',
      posiciones: [
        { puesto: 'Campeón', nombre: 'Julio Duarte', pais: 'URU' },
        { puesto: 'Subcampeón', nombre: 'Víctor Baliña', pais: 'URU' },
        { puesto: 'Semifinalista', nombre: 'Juan Pineda', pais: 'ARG' },
        { puesto: 'Semifinalista', nombre: 'Ariel Villa', pais: 'ARG' },
      ],
      fixture: '/panamericano-2026/tercera-fixture.jpg', bracket: '/panamericano-2026/tercera-bracket.jpg',
    },
    {
      id: 'juvenil', nombre: 'Juvenil',
      posiciones: [
        { puesto: 'Campeón', nombre: 'Matías Fonsalía', pais: 'URU' },
        { puesto: 'Subcampeón', nombre: 'Santino López', pais: 'ARG' },
        { puesto: 'Semifinalista', nombre: 'Julián Favale', pais: 'URU' },
        { puesto: 'Semifinalista', nombre: 'Bautista Paz', pais: 'ARG' },
      ],
      fixture: '/panamericano-2026/juvenil-fixture.jpg', bracket: '/panamericano-2026/juvenil-bracket.jpg',
    },
    {
      id: 'femenino', nombre: 'Femenino',
      posiciones: [
        { puesto: 'Campeona', nombre: 'Verónica Gutiérrez', pais: 'URU' },
        { puesto: 'Subcampeona', nombre: 'Simone Rodríguez', pais: 'URU' },
        { puesto: 'Semifinalista', nombre: 'Alfonsina Giordano', pais: 'ARG' },
        { puesto: 'Semifinalista', nombre: 'Verónica Beltrán', pais: 'URU' },
      ],
      fixture: '/panamericano-2026/femenino-fixture.jpg', bracket: '/panamericano-2026/femenino-bracket.jpg',
    },
  ] as CategoriaPana[],
};
