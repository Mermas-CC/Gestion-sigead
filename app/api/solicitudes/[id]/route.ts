import { NextResponse } from "next/server"
import { query } from "@/lib/db/postgres" // Utiliza tu cliente de PostgreSQL
import { getCurrentUser, verifyAdmin } from "@/lib/auth" // Para verificar el usuario y el rol

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const id = params.id

    // Consulta base para obtener la solicitud
    const { rows } = await query(
      `SELECT 
        id, numero_expediente, tipo, motivo, fecha_inicio, fecha_fin, estado, comentarios, 
        fecha_solicitud, fecha_actualizacion,
        usuario_id, (SELECT nombre FROM usuarios WHERE id = usuario_id) AS usuario_nombre
       FROM solicitudes WHERE id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 })
    }

    const solicitud = rows[0]

    // Si no es admin, verificar que la solicitud pertenezca al usuario
    if (userCheck.user.role !== "admin" && solicitud.usuario_id !== userCheck.user.id) {
      return NextResponse.json({ message: "No tienes permisos para ver esta solicitud" }, { status: 403 })
    }

    // Formatear respuesta según el rol
    if (userCheck.user.role !== "admin") {
      return NextResponse.json({
        solicitud: {
          id: solicitud.id,
          numeroExpediente: solicitud.numero_expediente,
          tipo: solicitud.tipo,
          motivo: solicitud.motivo,
          fechaInicio: solicitud.fecha_inicio,
          fechaFin: solicitud.fecha_fin,
          estado: solicitud.estado,
          comentarios: solicitud.comentarios,
          fechaSolicitud: solicitud.fecha_solicitud,
          fechaActualizacion: solicitud.fecha_actualizacion,
        },
      })
    } else {
      return NextResponse.json({
        solicitud: {
          id: solicitud.id,
          numeroExpediente: solicitud.numero_expediente,
          tipo: solicitud.tipo,
          motivo: solicitud.motivo,
          fechaInicio: solicitud.fecha_inicio,
          fechaFin: solicitud.fecha_fin,
          estado: solicitud.estado,
          comentarios: solicitud.comentarios,
          fechaSolicitud: solicitud.fecha_solicitud,
          fechaActualizacion: solicitud.fecha_actualizacion,
          usuario: {
            id: solicitud.usuario_id,
            nombre: solicitud.usuario_nombre,
          },
        },
      })
    }
  } catch (error) {
    console.error("Error al obtener solicitud:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Solo los administradores pueden actualizar el estado de las solicitudes
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status })
    }

    const id = params.id
    const { estado, comentarios } = await request.json()

    // Validar estado
    if (!["pendiente", "aprobada", "rechazada"].includes(estado)) {
      return NextResponse.json({ message: "Estado no válido" }, { status: 400 })
    }

    // Consultar solicitud en la base de datos
    const result = await query(
      `SELECT id, usuario_id, numero_expediente FROM solicitudes WHERE id = $1`,
      [id]
    )

    if (!result.rows.length) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 })
    }

    const solicitud = result.rows[0]

    // Actualizar estado de la solicitud
    await query(
      `UPDATE solicitudes SET estado = $1, comentarios = $2, fecha_actualizacion = NOW() WHERE id = $3`,
      [estado, comentarios, id]
    )

    // Crear la notificación
    const estadoTexto = estado === "aprobada" ? "aprobada" : "rechazada"
    await query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES ($1, $2, $3)`,
      [
        solicitud.usuario_id,
        `Solicitud ${estadoTexto}`,
        `Tu solicitud ${solicitud.numero_expediente} ha sido ${estadoTexto}.`,
      ]
    )

    return NextResponse.json({
      message: `Solicitud ${estadoTexto} exitosamente`,
    })
  } catch (error) {
    console.error("Error al actualizar solicitud:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
