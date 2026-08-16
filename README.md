# CDN-client

Frontend en **React 19 + Vite + JavaScript + React Router** para la API de CDN-backend.

## Requisitos

- Node 20+
- La API corriendo (ver [README.md](../README.md) en la raíz)

## Instalación y arranque

```bash
cd CDN-client
npm install
npm run dev        # → http://localhost:5173
```

Build de producción: `npm run build` (vite). Lint: `npm run lint` (oxlint).

## Configuración del proxy

El dev server de Vite proxya `/api` y `/hubs` (WebSocket para SignalR) hacia la API.
Por defecto apunta a `https://localhost:7057` (perfil `https` de VS). Si la API corre en otro puerto:

```bash
VITE_API_TARGET=http://localhost:5220 npm run dev
```

(La clave está en `vite.config.js` → `server.proxy`.)

## Estructura

```
src/
├── api.js                  cliente HTTP (fetch) con JWT, refresh de sesión y endpoints
├── App.jsx                 rutas + navegación (CardNav)
├── auth/
│   └── AuthContext.jsx     sesión global (login/registro/logout, persistida)
├── components/
│   ├── CardNav.jsx         navegación por tarjetas + badge admin
│   ├── Dialog.jsx          diálogo modal (edición de perfil)
│   ├── ImageCard.jsx       tarjeta de imagen (subidas recientes)
│   ├── Masonry.jsx         grid masonry nativo (CSS Grid, lazy loading)
│   ├── ProtectedRoute.jsx  redirige a /login si no hay sesión
│   ├── Skeletons.jsx       skeletons de carga (masonry, perfil, detalle)
│   └── UserAvatar.jsx      avatar con fallback a la inicial
├── hooks/
│   └── useFeed.js          feed global: datos + caché + polling + realtime
├── i18n/
│   ├── index.js            configuración de i18next
│   └── locales/es.js, en.js
├── pages/
│   ├── HomePage.jsx            feed (galería pública)
│   ├── ExplorePage.jsx         explorar (imágenes / usuarios + búsqueda)
│   ├── ImageDetailPage.jsx     detalle de imagen + recomendaciones
│   ├── LoginPage.jsx           formulario de login
│   ├── RegisterPage.jsx        formulario de registro
│   ├── SettingsPage.jsx        ajustes (sesión, idioma)
│   ├── UploadPage.jsx          subida de imagen (requiere sesión)
│   └── UserProfilePage.jsx     perfil (feed / guardados + edición)
├── realtime/
│   └── client.js           cliente SignalR (singleton + reconexión)
└── utils/
    ├── cache.js            helpers de caché en localStorage
    └── masonry.js          convierte imágenes de la API en items del grid
```

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Feed: galería pública |
| `/explore` | Explorar: imágenes / usuarios + búsqueda |
| `/users/:username` | Perfil de usuario (tabs feed/guardados, edición si es el propio) |
| `/images/:id` | Detalle de imagen + recomendaciones |
| `/upload` | Subir imagen (requiere sesión) |
| `/settings` | Ajustes (requiere sesión) |
| `/login` / `/register` | Ingresar / registrarse |

## Caché (stale-while-revalidate)

- El feed, los perfiles, las imágenes de perfil y el detalle de imagen se cachean en `localStorage` con TTL.
- Al navegar a una ruta ya visitada se muestra la caché al instante y se refresca en segundo plano (sin skeleton).
- Claves: `cdn_feed_cache`, `cdn_profile_{username}`, `cdn_profile_images_{userId}`, `cdn_image_{id}`, `cdn_saved_{userId}`.
- Las rutas de perfil e imagen usan `key` por `username`/`id` para que el estado arranque cacheado.

## Tiempo real (SignalR)

- Se conecta al hub `/hubs/feed` (vía proxy con `ws: true`), con reconexión automática.
- Al recibir `ImageUploaded`, `ImageDeleted` o `UserUpdated` refresca el feed con un debounce e **invalida la caché** de la imagen borrada.
- El perfil también se actualiza en vivo si el usuario visto cambia o le borran una imagen.
- El polling de 15s queda como respaldo si la conexión se cae.

## Imágenes

- Los grids usan **miniaturas** (`/api/images/{id}/thumbnail`); el detalle usa el original (`/api/images/{id}/download`).
- Carga lazy nativa (`loading="lazy"`) + `decoding="async"` en las cards.

## Notas

- La sesión se guarda en `localStorage` (`cdn_token`, `cdn_user`, `cdn_refresh_token`) y se renueva automáticamente con el refresh token (una petición en vuelo).
- **Borrar** una imagen: solo el dueño o un usuario con rol `admin`.
- Los usuarios admin ven el badge `admin` y pueden borrar imágenes ajenas.
- Idioma: español e inglés (`i18n`), con selector en Ajustes.
- El username se normaliza en minúsculas y, al editar el perfil, se valida en vivo contra el backend (disponibilidad) antes de guardar.
