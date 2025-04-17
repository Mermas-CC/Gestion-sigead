import { NextResponse } from "next/server"
import { query } from "@/lib/db/postgres"
import { getCurrentUser } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts } from "pdf-lib"

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

// PATCH: Actualizar estado de una solicitud y generar PDF si es aprobada
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

    const solicitud = result.rows[0]

    // Obtener información del usuario
    const userResult = await query(
      `
        SELECT id, nombre 
        FROM usuarios 
        WHERE id = $1
      `,
      [solicitud.usuario_id]
    )

    if (userResult.rowCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    const usuario = userResult.rows[0]

    let pdfUrl = null

    if (estado === "aprobada") {
      // Crear PDF del memorando
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontSize = 12
      let y = 780

      const drawLine = (label: string, value: any) => {
        page.drawText(`${label}: ${value ?? "-"}`, { x: 50, y, size: fontSize, font })
        y -= 20
      }

      drawLine("ID", solicitud.id)
      drawLine("N° Expediente", solicitud.numero_expediente)
      drawLine("Tipo", solicitud.tipo)
      drawLine("Motivo", solicitud.descripcion)
      drawLine("Fecha Inicio", solicitud.fecha_inicio)
      drawLine("Fecha Fin", solicitud.fecha_fin)
      drawLine("Estado", solicitud.estado)
      drawLine("Comentarios", solicitud.comentarios)
      drawLine("Usuario", usuario.nombre)

      const pdfBytes = await pdfDoc.save()

      const uploadsDir = path.join(process.cwd(), "public", "pdf")
      await mkdir(uploadsDir, { recursive: true })

      const filePath = path.join(uploadsDir, `solicitud_${solicitud.id}.pdf`)
      await writeFile(filePath, pdfBytes)

      pdfUrl = `/pdf/solicitud_${solicitud.id}.pdf`
    }

    // Crear notificación
    const titulo = `Solicitud ${estado === "aprobada" ? "aprobada" : "rechazada"}`
    const mensaje =
      estado === "aprobada"
        ? `Tu solicitud ${solicitud.numero_expediente} ha sido aprobada. ${
            pdfUrl ? `Puedes descargar el memorando [aquí](${pdfUrl}).` : ""
          }`
        : `Tu solicitud ${solicitud.numero_expediente} ha sido rechazada.`

    await query(
      `
        INSERT INTO notificaciones (usuario_id, titulo, mensaje)
        VALUES ($1, $2, $3)
      `,
      [usuario.id, titulo, mensaje]
    )

    return NextResponse.json({ message: `Solicitud ${estado} exitosamente`, pdfUrl })
  } catch (error) {
    console.error("Error al actualizar solicitud:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
