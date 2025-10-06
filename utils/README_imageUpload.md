# Sistema de Reputación y Subida de Imágenes

## Configuración Actual

Se está usando **Cloudinary** con variables de entorno para la subida de imágenes.

## Variables de Entorno Requeridas

Asegúrate de tener estas variables configuradas en tu `.env.local`:

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
```

## Configuración de Cloudinary

1. **Crear cuenta en Cloudinary:**
   - Ve a https://cloudinary.com
   - Regístrate o inicia sesión

2. **Obtener configuración:**
   - Cloud Name: Se encuentra en tu dashboard
   - Upload Preset: Crea uno en Settings > Upload > Upload Presets

3. **Configurar variables de entorno:**
   - Agrega las variables en `.env.local`
   - Reinicia el servidor de desarrollo

## Sistema de Reputación

### Campos agregados a la tabla users:
- `reputationScore`: Promedio de calificaciones (1-5 estrellas)
- `totalReviews`: Número total de reseñas recibidas
- `rafflesCreated`: Número de sorteos creados por el usuario

### Nueva tabla reviews:
- `reviewerId`: Usuario que hace la reseña
- `reviewedUserId`: Usuario que recibe la reseña (vendedor)
- `raffleId`: Sorteo al que se refiere la reseña
- `score`: Puntaje de 1-5 estrellas
- `comment`: Comentario opcional (para futuro)

### Funcionalidades implementadas:
- ✅ **Indicador "Nuevo vendedor"** para usuarios con <3 sorteos
- ✅ **Sistema de estrellas** para mostrar reputación
- ✅ **Cálculo automático** de reputación promedio
- ✅ **Modal de calificación** al completar sorteos
- ✅ **Componente UserReputation** reutilizable

## Servicios Alternativos

### Cloudinary (más profesional)
- Requiere cuenta en cloudinary.com
- Más características avanzadas
- Límites más altos

### Firebase Storage
- Requiere configuración de Firebase
- Integración nativa con Firebase Auth

### Tu propio servidor
- Control total sobre los archivos
- Requiere backend propio

## Características Implementadas

✅ **Selección directa desde galería** (sin modal)
✅ **Previsualización inmediata**
✅ **Subida automática a Cloudinary**
✅ **Indicadores de carga**
✅ **Manejo de errores con Toast** (compatible web)
✅ **Compresión automática**
✅ **Sin opción de recortar** (más simple)
✅ **Variables de entorno configurables**
✅ **Compatible con web y móvil**

## Cambios recientes

✅ **Corregido error de Cloudinary** - Usa el mismo patrón exitoso de create-raffle.tsx
✅ **Simplificada interfaz** - Solo galería, sin modal ni cámara
✅ **Mejor compatibilidad web** - Toast en lugar de Alert
✅ **Sin recorte** - Más simple y directo

## Próximos pasos

1. Configurar servicio de almacenamiento real (ya funciona con Cloudinary)
2. Implementar limpieza de imágenes antiguas
3. Agregar validación de tamaño de archivo
4. Optimizar para diferentes calidades de conexión