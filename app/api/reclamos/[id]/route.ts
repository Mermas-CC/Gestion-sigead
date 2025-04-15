import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db/postgres"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const { id } = params

    // Obtener el reclamo por su ID
    const reclamoQuery = await query(
      `SELECT * FROM reclamos WHERE id = $1`,
      [id]
    )

    if (reclamoQuery.rowCount === 0) {
      return NextResponse.json({ message: "Reclamo no encontrado" }, { status: 404 })
    }

    const reclamo = reclamoQuery.rows[0]

    return NextResponse.json({
      id: reclamo.id,
      solicitudId: reclamo.solicitud_id,
      mensaje: reclamo.mensaje,
      archivoUrl: reclamo.archivo_url,
      estado: reclamo.estado,
      fechaCreacion: reclamo.created_at
    })

  } catch (error: any) {
    console.error("Error al obtener el reclamo:", error)
    return NextResponse.json({ message: "Error en el servidor", error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const { id } = params
    const data = await request.json()

    // Verificar si se proporcionó al menos un campo válido para actualizar
    const camposValidos = ['mensaje', 'estado']
    const camposActualizar = Object.keys(data)
    const camposInvalidos = camposActualizar.filter(campo => !camposValidos.includes(campo))

    if (camposInvalidos.length > 0) {
      return NextResponse.json({
        message: `Los siguientes campos no son válidos para actualizar: ${camposInvalidos.join(', ')}`,
      }, { status: 400 })
    }

    // Actualizar el reclamo con los nuevos datos
    const updateQuery = await query(
      `UPDATE reclamos
       SET mensaje = COALESCE($1, mensaje), estado = COALESCE($2, estado)
       WHERE id = $3
       RETURNING id, solicitud_id, mensaje, archivo_url, estado, created_at`,
      [data.mensaje, data.estado, id]
    )

    if (updateQuery.rowCount === 0) {
      return NextResponse.json({ message: "Reclamo no encontrado o no se pudo actualizar" }, { status: 404 })
    }

    const reclamoActualizado = updateQuery.rows[0]

    return NextResponse.json({
      id: reclamoActualizado.id,
      solicitudId: reclamoActualizado.solicitud_id,
      mensaje: reclamoActualizado.mensaje,
      archivoUrl: reclamoActualizado.archivo_url,
      estado: reclamoActualizado.estado,
      fechaCreacion: reclamoActualizado.created_at
    })

  } catch (error: any) {
    console.error("Error al actualizar el reclamo:", error)
    return NextResponse.json({ message: "Error en el servidor", error: error.message }, { status: 500 })
  }
}
