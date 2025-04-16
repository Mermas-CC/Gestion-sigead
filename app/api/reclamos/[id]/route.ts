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

    const reclamoQuery = await query(`SELECT * FROM reclamos WHERE id = $1`, [id])

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
      respuesta: reclamo.respuesta,
      fechaCreacion: reclamo.created_at
    })

  } catch (error: any) {
    console.error("Error al obtener el reclamo:", error)
    return NextResponse.json({ message: "Error en el servidor", error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const { id } = context.params
    const data = await request.json()

    // Campos válidos para actualizar
    const camposValidos = ['respuesta', 'estado']
    const camposActualizar = Object.keys(data)
    const camposInvalidos = camposActualizar.filter(campo => !camposValidos.includes(campo))

    if (camposInvalidos.length > 0) {
      return NextResponse.json({
        message: `Los siguientes campos no son válidos para actualizar: ${camposInvalidos.join(', ')}`,
      }, { status: 400 })
    }

    const updateQuery = await query(
      `UPDATE reclamos
       SET respuesta = COALESCE($1, respuesta), estado = COALESCE($2, estado), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, solicitud_id, mensaje, archivo_url, estado, respuesta, created_at`,
      [data.respuesta, data.estado, id]
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
      respuesta: reclamoActualizado.respuesta,
      fechaCreacion: reclamoActualizado.created_at
    })

  } catch (error: any) {
    console.error("Error al actualizar el reclamo:", error)
    return NextResponse.json({ message: "Error en el servidor", error: error.message }, { status: 500 })
  }
}
