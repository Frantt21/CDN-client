# CDN-client

Frontend en **React + Vite + TypeScript + React Router** para la API de CDN-backend.

> ⚠️ Vive en el repo pero está en `.gitignore` (no se trackea).

## Requisitos

- Node 20+
- La API corriendo (ver [README.md](../README.md) en la raíz)

## Instalación y arranque

```bash
cd CDN-client
npm install
npm run dev        # → http://localhost:5173
```

Build de producción: `npm run build` (tsc + vite).

## Configuración del proxy

El dev server de Vite proxya `/api` hacia la API. Por defecto apunta a
`https://localhost:7057` (perfil `https` de VS). Si la API corre en otro puerto:

```bash
VITE_API_TARGET=http://localhost:5220 npm run dev
```

(La clave está en `vite.config.ts` → `server.proxy['/api']`.)

## Estructura

```
src/
├── api.ts           cliente HTTP (fetch) con JWT, errores tipados y endpoints
├── types.ts         DTOs espejo del backend (UserDto, ImageDto, AuthResponse)
├── auth/
│   └── AuthContext.tsx   sesión global (login/registro/logout, token en localStorage)
├── components/
│   ├── NavBar.tsx        navegación + badge admin
│   ├── ProtectedRoute.tsx  redirige a /login si no hay sesión
│   └── ImageCard.tsx     tarjeta de imagen (vista previa, metadata, borrar)
└── pages/
    ├── HomePage.tsx          galería pública + lista de usuarios
    ├── LoginPage.tsx         formulario de login
    ├── RegisterPage.tsx      formulario de registro
    ├── UploadPage.tsx        subida de imagen (requiere sesión)
    └── UserProfilePage.tsx   perfil + edición de perfil (dueño)
```

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Inicio: galería + usuarios |
| `/login` | Ingresar |
| `/register` | Registrarse |
| `/users/:username` | Perfil de usuario (con edición si es el propio) |
| `/upload` | Subir imagen (requiere sesión) |

## Notas

- El JWT se guarda en `localStorage` (`cdn_token`) junto con el usuario (`cdn_user`).
- Las imágenes se muestran vía `/api/images/{id}/download` (proxy del dev server).
- **Borrar** una imagen: solo el dueño o un usuario con rol `admin`.
- Los usuarios admin ven el badge `admin` en el navbar y en su perfil.
