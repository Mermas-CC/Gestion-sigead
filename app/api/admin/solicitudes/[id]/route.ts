import { NextResponse } from "next/server"
import { query } from "@/lib/db/postgres"
import { getCurrentUser } from "@/lib/auth" // Asegúrate que esta ruta sea correcta

// GET: Obtener todas las solicitudes para el panel de admin
export async function GET(request: Request) {
  try {
    const userCheck = await getCurrentUser(request)

    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    if (userCheck.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const result = await query(`
      SELECT solicitudes.*, usuarios.nombre 
      FROM solicitudes 
      JOIN usuarios ON solicitudes.usuario_id = usuarios.id
      ORDER BY solicitudes.created_at DESC
    `)

    return NextResponse.json({ solicitudes: result.rows })
  } catch (error) {
    console.error("Error al obtener solicitudes:", error)
    return NextResponse.json({ message: "Error al obtener solicitudes" }, { status: 500 })
  }
}

// PATCH: Actualizar estado de una solicitud
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    if (userCheck.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const { estado, comentarios } = await request.json()
    if (!estado) {
      return NextResponse.json({ message: "Estado es obligatorio" }, { status: 400 })
    }

    const validStates = ["aprobada", "rechazada", "pendiente"]
    if (!validStates.includes(estado)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 })
    }

    const result = await query(
      `
        UPDATE solicitudes 
        SET estado = $1, comentarios = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `,
      [estado, comentarios, params.id]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ solicitud: result.rows[0] })
  } catch (error) {
    console.error("Error al actualizar solicitud:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
