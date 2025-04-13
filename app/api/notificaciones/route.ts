import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db/postgres"

export async function GET(request: Request) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    if (!userCheck.user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener notificaciones del usuario
    const result = await query(
      `SELECT id, titulo, mensaje, leida, created_at
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC`,
      [userCheck.user.id]
    )

    if (!result) {
      console.error("Error al obtener notificaciones")
      return NextResponse.json({ message: "Error al obtener notificaciones" }, { status: 500 })
    }

    const notificaciones = result.rows.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      mensaje: n.mensaje,
      leida: n.leida,
      fechaCreacion: n.created_at,
    }))

    return NextResponse.json({ notificaciones })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const { id, leida } = await request.json()
    // Si se proporciona un ID, marcar esa notificación como leída
    if (!userCheck.user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    if (id) {
      const result = await query(
        `UPDATE notificaciones
         SET leida = $1
         WHERE id = $2 AND usuario_id = $3
         RETURNING id`,
        [leida !== undefined ? leida : true, id, userCheck.user.id]
      )

      if (!result || result.rowCount === 0) {
        console.error("Error al actualizar notificación")
        return NextResponse.json({ message: "Error al actualizar notificación" }, { status: 500 })
      }

      return NextResponse.json({ message: "Notificación actualizada" })
    }
    // Si no se proporciona ID, marcar todas como leídas
    else {
      if (!userCheck.user) {
        return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
      }

      const result = await query(
        `UPDATE notificaciones
         SET leida = true
         WHERE usuario_id = $1 AND leida = false
         RETURNING id`,
        [userCheck.user.id]
      )

      if (!result) {
        console.error("Error al actualizar notificaciones")
        return NextResponse.json({ message: "Error al actualizar notificaciones" }, { status: 500 })
      }

      return NextResponse.json({ message: "Todas las notificaciones marcadas como leídas" })
    }
  } catch (error) {
    console.error("Error al actualizar notificaciones:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
