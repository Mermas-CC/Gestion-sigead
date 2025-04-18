import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db/postgres"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts } from "pdf-lib"

// Función utilitaria para generar el memorando PDF con el mismo diseño que admin/solicitudes
async function generarMemorandoPDF({
  numeroExpediente,
  asunto,
  fecha,
  usuarioNombre,
  razon,
  goceRemuneraciones,
  cargo,
  periodo
}: {
  numeroExpediente: string,
  asunto: string,
  fecha: string,
  usuarioNombre: string,
  razon: string,
  goceRemuneraciones: boolean,
  cargo: string,
  periodo: string
}) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 12

  // Cargar imágenes de logos (PNG o JPG)
  const fs = require("fs")
  let ugelLogo, mineduLogo
  try {
    const ugelLogoPath = path.join(process.cwd(), "public", "ugel.png")
    const ugelLogoBytes = fs.readFileSync(ugelLogoPath)
    ugelLogo = await pdfDoc.embedPng(ugelLogoBytes)
  } catch (e) {
    try {
      const ugelLogoPathJpg = path.join(process.cwd(), "public", "ugel.jpg")
      if (fs.existsSync(ugelLogoPathJpg)) {
        const ugelLogoBytes = fs.readFileSync(ugelLogoPathJpg)
        ugelLogo = await pdfDoc.embedJpg(ugelLogoBytes)
      }
    } catch {}
  }
  try {
    const mineduLogoPath = path.join(process.cwd(), "public", "ministerio.png")
    const mineduLogoBytes = fs.readFileSync(mineduLogoPath)
    mineduLogo = await pdfDoc.embedPng(mineduLogoBytes)
  } catch (e) {
    try {
      const mineduLogoPathJpg = path.join(process.cwd(), "public", "ministerio.jpg")
      if (fs.existsSync(mineduLogoPathJpg)) {
        const mineduLogoBytes = fs.readFileSync(mineduLogoPathJpg)
        mineduLogo = await pdfDoc.embedJpg(mineduLogoBytes)
      }
    } catch {}
  }

  // Dibujar logos en la cabecera si existen
  if (mineduLogo) page.drawImage(mineduLogo, { x: 50, y: 770, width: 80, height: 60 })
  if (ugelLogo) page.drawImage(ugelLogo, { x: 465, y: 770, width: 80, height: 60 })

  // Título centrado (centrado manualmente)
  const title = "MEMORANDO"
  const textWidth = fontBold.widthOfTextAtSize(title, 16)
  page.drawText(title, {
    x: (595 - textWidth) / 2,
    y: 740,
    size: 16,
    font: fontBold
  })

  let y = 710

  // Formatear fecha amigable
  const formatFecha = (fechaStr: string) => {
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    const fecha = new Date(fechaStr)
    const dia = fecha.getDate()
    const mes = meses[fecha.getMonth()]
    const anio = fecha.getFullYear()
    return `${dia} de ${mes} de ${anio}`
  }

  // Datos del memorando
  const drawLabelValue = (label: string, value: any) => {
    page.drawText(`${label}:`, { x: 60, y, size: fontSize, font: fontBold })
    page.drawText(`${value ?? "-"}`, { x: 180, y, size: fontSize, font })
    y -= 22
  }

  // Campos requeridos
  drawLabelValue("Expediente", numeroExpediente)
  drawLabelValue("Asunto", asunto)
  drawLabelValue("Fecha", formatFecha(fecha))
  drawLabelValue("Nombre", usuarioNombre)
  drawLabelValue("Cargo", cargo ?? "-")
  drawLabelValue("Razón", razon)
  drawLabelValue(
    "Con/Sin Goce",
    goceRemuneraciones === true
      ? "Con goce de remuneraciones"
      : goceRemuneraciones === false
        ? "Sin goce de remuneraciones"
        : "-"
  )
  drawLabelValue("Periodo Solicitado", periodo)

  y -= 20

  // Cuerpo del memorando
  const cuerpo = `Por medio del presente, se comunica la aprobación de la solicitud registrada bajo el expediente N° ${numeroExpediente}, correspondiente al(la) trabajador(a) ${usuarioNombre} (${cargo ?? "-"}), para el periodo comprendido entre ${periodo}, por la razón: ${razon}. El beneficio es otorgado ${
    goceRemuneraciones === true
      ? "con goce de remuneraciones"
      : goceRemuneraciones === false
        ? "sin goce de remuneraciones"
        : "-"
  }.`
  page.drawText(cuerpo, { x: 60, y, size: fontSize, font, maxWidth: 475, lineHeight: 18 })

  // Pie de página
  page.drawText("Atentamente,", { x: 60, y: y - 80, size: fontSize, font })
  page.drawText("__________________________", { x: 60, y: y - 110, size: fontSize, font })
  page.drawText("UGEL", { x: 60, y: y - 125, size: fontSize, font })

  return await pdfDoc.save()
}

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
        `SELECT id, estado, numero_expediente, tipo, descripcion, fecha_inicio, fecha_fin, comentarios, usuario_id, goce_remuneraciones, cargo, updated_at, created_at FROM solicitudes WHERE id = $1`,
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

        // --- Generar PDF del memorando con el mismo diseño que admin/solicitudes ---
        let pdfUrl = null
        try {
          const s = solicitudResult.rows[0]
          // Obtener nombre del usuario
          const userResult = await query(
            `SELECT nombre FROM usuarios WHERE id = $1`,
            [s.usuario_id]
          )
          const usuarioNombre = userResult.rowCount > 0 ? userResult.rows[0].nombre : "Desconocido"
          const pdfBytes = await generarMemorandoPDF({
            numeroExpediente: s.numero_expediente,
            asunto: s.tipo,
            fecha: s.updated_at || s.created_at,
            usuarioNombre,
            razon: s.descripcion,
            goceRemuneraciones: s.goce_remuneraciones,
            cargo: s.cargo,
            periodo: `${s.fecha_inicio ? new Date(s.fecha_inicio).toISOString().split("T")[0] : "-"} a ${s.fecha_fin ? new Date(s.fecha_fin).toISOString().split("T")[0] : "-"}`
          })
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
