# Documentación Técnica - Sistema de Gestión de Permisos

## Descripción General

El sistema permite a los empleados registrar solicitudes de licencias y permisos, adjuntar documentos, recibir notificaciones y realizar reclamos. Los administradores pueden gestionar usuarios, aprobar/rechazar solicitudes y reclamos, y acceder a estadísticas.

---

## Arquitectura

- **Frontend:** Next.js (React), componentes en `/components`.
- **Backend:** API RESTful con rutas en `/app/api`.
- **Base de datos:** PostgreSQL.
- **Autenticación:** Sesiones y roles (usuario/admin).
- **Almacenamiento de archivos:** Subidas en `/public/uploads` y PDFs generados en `/public/pdf`.

---

## Principales Entidades

- **Usuario:** nombre, email, contraseña, departamento, rol, tipo de contrato, nivel de carrera, contrato adjunto.
- **Solicitud:** tipo, motivo, fechas, estado, adjunto, comentarios, usuario asociado.
- **Reclamo:** mensaje, estado, archivo adjunto, solicitud asociada, respuesta.
- **Notificación:** usuario, título, mensaje, leída.
- **Tipos de contrato y niveles de carrera:** tablas auxiliares.

---

## Endpoints principales

- `POST /api/auth/login` — Login de usuario.
- `POST /api/auth/register` — Registro de usuario.
- `GET /api/solicitudes` — Listar solicitudes del usuario.
- `POST /api/solicitudes` — Crear nueva solicitud.
- `PATCH /api/solicitudes/:id` — Actualizar estado de solicitud (admin).
- `GET /api/reclamos` — Listar reclamos del usuario.
- `POST /api/reclamos` — Crear nuevo reclamo.
- `PATCH /api/reclamos/:id` — Actualizar estado/respuesta de reclamo.
- `GET /api/notificaciones` — Listar notificaciones del usuario.
- `PATCH /api/notificaciones` — Marcar notificaciones como leídas.
- `GET /api/admin/solicitudes` — Listar todas las solicitudes (admin).
- `GET /api/admin/users` — Listar usuarios (admin).
- `POST /api/admin/users` — Crear usuario (admin).
- `GET /api/estadisticas` — Estadísticas generales (admin).

---

## Flujo de Solicitudes

1. El usuario inicia sesión y accede a su panel.
2. Puede registrar una nueva solicitud completando el formulario y adjuntando archivos.
3. El sistema genera un número de expediente y notifica al usuario.
4. El administrador revisa las solicitudes y puede aprobar/rechazar.
5. Al aprobar, se genera un memorando PDF y se notifica al usuario.
6. Si la solicitud es rechazada o está pendiente más de 3 días, el usuario puede presentar un reclamo.

---

## Flujo de Reclamos

1. El usuario presenta un reclamo asociado a una solicitud.
2. El administrador revisa el reclamo y responde (aprobando/rechazando).
3. Si el reclamo es aprobado y la solicitud estaba rechazada, se actualiza a aprobada y se genera el memorando PDF.

---

## Notificaciones

- Se generan automáticamente en cada acción relevante (creación, aprobación, rechazo, respuesta a reclamo).
- El usuario puede marcar notificaciones como leídas.

---

## Estadísticas

- Panel de administración con gráficos de solicitudes por tipo, estado y tendencias mensuales.
- Endpoint `/api/estadisticas` para obtener datos agregados.

---

## Seguridad

- Validación de roles y permisos en cada endpoint.
- Validación de campos obligatorios y tipos de archivo.
- Las contraseñas deben ser hasheadas en producción.

---

## Consideraciones

- Adaptar los scripts de migración a la estructura de la base de datos deseada.
- Configurar correctamente las variables de entorno para la conexión a la base de datos y otros servicios.
- El sistema está preparado para ser extendido con nuevas funcionalidades y reportes.

---

## Contacto

Para soporte técnico o sugerencias, contactar al equipo de desarrollo o abrir un issue en el repositorio.
