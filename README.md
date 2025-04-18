# Sistema de Gestión de Permisos

Este proyecto es una aplicación web para la gestión de solicitudes de licencias, permisos y reclamos en una institución. Permite a los usuarios registrar solicitudes, adjuntar documentos, recibir notificaciones y a los administradores gestionar y aprobar/rechazar solicitudes y reclamos.

## Características principales

- Registro y autenticación de usuarios.
- Envío de solicitudes de licencias y permisos con adjuntos.
- Gestión de reclamos asociados a solicitudes.
- Panel de administración para gestionar usuarios, solicitudes y reclamos.
- Generación automática de memorandos en PDF al aprobar solicitudes.
- Notificaciones automáticas para los usuarios.
- Estadísticas y dashboard para administradores.

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <carpeta_del_proyecto>
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copia el archivo `.env.example` a `.env.local` y completa los valores necesarios (conexión a base de datos, claves, etc).

4. **Configurar la base de datos**
   - Asegúrate de tener PostgreSQL instalado y accesible.
   - Ejecuta los scripts de migración para crear las tablas necesarias:
     ```bash
     npm run migrate
     ```
   - (Opcional) Puedes usar los scripts de seed para datos de prueba.

5. **Iniciar la aplicación**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

## Estructura del proyecto

- `/app`: Rutas y páginas principales (Next.js).
- `/components`: Componentes reutilizables de la interfaz.
- `/lib`: Lógica de negocio, servicios y utilidades.
- `/public`: Archivos estáticos y subidas de archivos.
- `/scripts`: Scripts de migración y seed para la base de datos.

## Scripts útiles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia la aplicación en modo producción.
- `npm run migrate`: Ejecuta las migraciones de la base de datos.

## Requisitos

- Node.js >= 18
- PostgreSQL >= 13

## Soporte

Para dudas o problemas, abre un issue en el repositorio o contacta al equipo de desarrollo.
