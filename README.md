# Gazeta Abierta — Flipbook

Prototipo Next.js de lector editorial con:

- efecto real de volteo de página (`react-pageflip` / StPageFlip)
- sonido de papel generado con Web Audio (sin archivo externo)
- navegación con mouse, teclado y touch
- zoom
- miniaturas
- pantalla completa
- diseño oscuro inspirado en la referencia de Gazeta Abierta
- comportamiento responsive para móvil

## Ejecutar

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Próximo paso

Reemplazar las páginas de demostración del componente `Paper` por imágenes JPG/WebP exportadas del periódico, o conectar un PDF/CMS. Después podemos agregar Supabase para administrar publicaciones, ediciones, páginas y usuarios.
