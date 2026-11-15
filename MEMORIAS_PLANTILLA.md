# Memorias del Billar Uruguayo — plantilla oficial de la serie

El diseño de la entrega N.º 1 es la plantilla oficial. No se cambia entrega a entrega.

## Dónde está cada cosa
- Datos de todas las entregas: `src/config/memorias.ts`
- Diseño (se comparte entre todas): `src/pages/MemoriasPage.tsx`
- Fotos de cada entrega: `public/memorias/NN/` (NN = número con dos cifras)
- Datos para WhatsApp/Facebook: se generan solos al compilar (`scripts/memorias-html.mjs`) a partir de `compartir`
- Enlace permanente de cada entrega: `/portada/memorias/N`. Índice con todas las entregas: `/portada/memorias`

## Para sumar una entrega nueva
1. Copiar el bloque de la última entrega al final de `ENTREGAS` y cambiar: `numero`, `titulo`, `bajada`, `resumen`, `portada`, `cuerpo`, `fuentes`, `proxima`, `compartir` y `registroInterno`.
2. Dejarla en `estado: 'borrador'` y `fecha: null`. Revisarla en `/portada/memorias/N?borrador=1`.
3. Al autorizarse: `estado: 'publicado'` y `fecha: 'AAAA-MM-DD'`. Recién ahí entra al índice y al menú de la portada.
4. Imagen para compartir: `compartir.imagenAutorizada: false` usa el logo de FEBIU; pasar a `true` solo con el permiso de reproducción confirmado.

## Reglas
- No se modifica el contenido histórico sin consultar.
- Los créditos y permisos pendientes se guardan en `registroInterno` (no se muestra en la web). No se dan por confirmadas autorizaciones que no se tienen.
