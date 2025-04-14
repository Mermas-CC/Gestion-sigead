import { NextResponse } from "next/server"
import { getCurrentUser, verifyAdmin } from "@/lib/auth"
import { query } from "@/lib/db/postgres"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userCheck = await getCurrentUser(request)
  if (!userCheck.success) return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })

  const { id } = params
  const result = await query(`SELECT * FROM reclamos WHERE solicitud_id = $1`, [id])
  if (!result.rows.length) return NextResponse.json({ message: "No hay reclamo para esta solicitud" }, { status: 404 })

  const reclamo = result.rows[0]

  // Solo admin o dueño puede ver
  if (userCheck.user.role !== "admin" && reclamo.usuario_id !== userCheck.user.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 })
  }

  return NextResponse.json({ reclamo })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userCheck = await getCurrentUser(request)
  if (!userCheck.success) return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })

  const { id } = params
  const { mensaje, archivo } = await request.json()

  // Validaciones
  const solicitudRes = await query(`SELECT * FROM solicitudes WHERE id = $1`, [id])
  if (!solicitudRes.rows.length) return NextResponse.json({ message: "Solicitud no existe" }, { status: 404 })

  const solicitud = solicitudRes.rows[0]
  if (solicitud.usuario_id !== userCheck.user.id) return NextResponse.json({ message: "No autorizado" }, { status: 403 })

  // Solo se puede reclamar si está rechazada o pendiente por más de 3 días
  const puedeReclamar = solicitud.estado === "rechazada" ||
    (solicitud.estado === "pendiente" &&
     new Date().getTime() - new Date(solicitud.fecha_solicitud).getTime() > 3 * 24 * 60 * 60 * 1000)

  if (!puedeReclamar) return NextResponse.json({ message: "No puedes reclamar esta solicitud" }, { status: 400 })

  // Ya existe reclamo
  const existente = await query(`SELECT id FROM reclamos WHERE solicitud_id = $1`, [id])
  if (existente.rows.length) return NextResponse.json({ message: "Ya existe un reclamo" }, { status: 400 })

  // Crear reclamo
  await query(
    `INSERT INTO reclamos (solicitud_id, usuario_id, mensaje, archivo, estado, fecha_creacion)
     VALUES ($1, $2, $3, $4, 'pendiente', NOW())`,
    [id, userCheck.user.id, mensaje, archivo]
  )

  return NextResponse.json({ message: "Reclamo enviado" })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const adminCheck = await verifyAdmin(request)
  if (!adminCheck.success) return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status })

  const { id } = params
  const { respuesta, accion } = await request.json() // accion: 'aprobar', 'rechazar', 'cerrar'

  const reclamoRes = await query(`SELECT * FROM reclamos WHERE solicitud_id = $1`, [id])
  if (!reclamoRes.rows.length) return NextResponse.json({ message: "Reclamo no encontrado" }, { status: 404 })

  const reclamo = reclamoRes.rows[0]

  let nuevoEstadoSolicitud = null
  if (accion === "aprobar") nuevoEstadoSolicitud = "aprobada"
  else if (accion === "rechazar") nuevoEstadoSolicitud = "rechazada"

  // Actualiza solicitud si aplica
  if (nuevoEstadoSolicitud) {
    await query(
      `UPDATE solicitudes SET estado = $1, fecha_actualizacion = NOW() WHERE id = $2`,
      [nuevoEstadoSolicitud, id]
    )
  }

  // Actualiza reclamo
  await query(
    `UPDATE reclamos SET respuesta = $1, estado = 'atendido', fecha_respuesta = NOW() WHERE solicitud_id = $2`,
    [respuesta, id]
  )

  return NextResponse.json({ message: "Reclamo respondido" })
}
