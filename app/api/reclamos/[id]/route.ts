import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db/postgres"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts } from "pdf-lib"

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const { id } = await context.params
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

    // --- Lógica para actualizar la solicitud asociada ---
    if (
      data.estado === "aprobado" &&
      reclamoActualizado.solicitud_id
    ) {
      // Obtener la solicitud asociada
      const solicitudResult = await query(
        `SELECT id, estado, numero_expediente, tipo, descripcion, fecha_inicio, fecha_fin, comentarios, usuario_id FROM solicitudes WHERE id = $1`,
        [reclamoActualizado.solicitud_id]
      )
      if (
        solicitudResult.rowCount > 0 &&
        typeof solicitudResult.rows[0].estado === "string" &&
        solicitudResult.rows[0].estado.trim().toLowerCase() === "rechazada"
      ) {
        // Actualizar la solicitud a "aprobada"
        await query(
          `UPDATE solicitudes SET estado = 'aprobada', updated_at = NOW() WHERE id = $1`,
          [reclamoActualizado.solicitud_id]
        )

        // --- Generar PDF del memorando ---
        let pdfUrl = null
        try {
          const s = solicitudResult.rows[0]
          // Obtener nombre del usuario
          const userResult = await query(
            `SELECT nombre FROM usuarios WHERE id = $1`,
            [s.usuario_id]
          )
          const usuarioNombre = userResult.rowCount > 0 ? userResult.rows[0].nombre : "Desconocido"
          const pdfDoc = await PDFDocument.create()
          const page = pdfDoc.addPage([595, 842]) // A4
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
          const fontSize = 12
          let y = 780
          const drawLine = (label: string, value: any) => {
            page.drawText(`${label}: ${value ?? "-"}`, { x: 50, y, size: fontSize, font })
            y -= 20
          }
          drawLine("ID", s.id)
          drawLine("N° Expediente", s.numero_expediente)
          drawLine("Tipo", s.tipo)
          drawLine("Motivo", s.descripcion)
          drawLine("Fecha Inicio", s.fecha_inicio)
          drawLine("Fecha Fin", s.fecha_fin)
          drawLine("Estado", "aprobada")
          drawLine("Comentarios", s.comentarios)
          drawLine("Usuario", usuarioNombre)
          const pdfBytes = await pdfDoc.save()
          const uploadsDir = path.join(process.cwd(), "public", "pdf")
          await mkdir(uploadsDir, { recursive: true })
          const filePath = path.join(uploadsDir, `solicitud_${s.id}.pdf`)
          await writeFile(filePath, pdfBytes)
          pdfUrl = `/pdf/solicitud_${s.id}.pdf`
        } catch (pdfError) {
          console.error("Error generando el memorando PDF tras aprobar reclamo:", pdfError)
        }
        // --- Fin generación PDF ---

        // Notificación con enlace al memorando
        let mensajeNotificacion = `Tu solicitud con expediente ${solicitudResult.rows[0].numero_expediente} ha sido aprobada tras la revisión de tu reclamo.`
        if (pdfUrl) {
          mensajeNotificacion += ` <a href="${pdfUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Ver Memorando</a>`
        }
        await query(
          `
            INSERT INTO notificaciones (usuario_id, titulo, mensaje)
            VALUES ($1, $2, $3)
          `,
          [
            solicitudResult.rows[0].usuario_id,
            "Solicitud aprobada",
            mensajeNotificacion,
          ]
        )
      }
    }
    // --- Fin lógica solicitud asociada ---

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
