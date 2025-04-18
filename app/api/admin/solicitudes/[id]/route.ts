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
export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { params } = context
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
        SELECT id, nombre, cargo 
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
      drawLabelValue("Expediente", solicitud.numero_expediente)
      drawLabelValue("Asunto", solicitud.tipo)
      drawLabelValue("Fecha", formatFecha(solicitud.updated_at || solicitud.created_at))
      drawLabelValue("Nombre", usuario.nombre)
      drawLabelValue("Cargo", solicitud.cargo ?? usuario.cargo ?? "-")
      drawLabelValue("Razón", solicitud.descripcion)
      drawLabelValue(
        "Con/Sin Goce",
        solicitud.goce_remuneraciones === true
          ? "Con goce de remuneraciones"
          : solicitud.goce_remuneraciones === false
            ? "Sin goce de remuneraciones"
            : "-"
      )
      drawLabelValue("Periodo Solicitado", `${formatFecha(solicitud.fecha_inicio)} a ${formatFecha(solicitud.fecha_fin)}`)

      y -= 20

      // Cuerpo del memorando
      const cuerpo = `Por medio del presente, se comunica la aprobación de la solicitud registrada bajo el expediente N° ${solicitud.numero_expediente}, correspondiente al(la) trabajador(a) ${usuario.nombre} (${solicitud.cargo ?? usuario.cargo ?? "-"}), para el periodo comprendido entre ${formatFecha(solicitud.fecha_inicio)} y ${formatFecha(solicitud.fecha_fin)}, por la razón: ${solicitud.descripcion}. El beneficio es otorgado ${
        solicitud.goce_remuneraciones === true
          ? "con goce de remuneraciones"
          : solicitud.goce_remuneraciones === false
            ? "sin goce de remuneraciones"
            : "-"
      }.`
      page.drawText(cuerpo, { x: 60, y, size: fontSize, font, maxWidth: 475, lineHeight: 18 })

      // Pie de página
      page.drawText("Atentamente,", { x: 60, y: y - 80, size: fontSize, font })
      page.drawText("__________________________", { x: 60, y: y - 110, size: fontSize, font })
      page.drawText("UGEL", { x: 60, y: y - 125, size: fontSize, font })

      const pdfBytes = await pdfDoc.save()

      const uploadsDir = path.join(process.cwd(), "public", "pdf")
      await mkdir(uploadsDir, { recursive: true })

      const filePath = path.join(uploadsDir, `solicitud_${solicitud.id}.pdf`)
      await writeFile(filePath, pdfBytes)

      pdfUrl = `/pdf/solicitud_${solicitud.id}.pdf`
    }

    // Crear notificación
    const titulo = `Solicitud ${estado === "aprobada" ? "aprobada" : "rechazada"}`
    let mensaje: string
    if (estado === "aprobada") {
      mensaje = `Tu solicitud ${solicitud.numero_expediente} ha sido aprobada.`
      if (pdfUrl) {
        mensaje += ` <a href="${pdfUrl}" target="_blank" style="display:inline-block;padding:6px 14px;background:#2563eb;color:#fff;border-radius:4px;text-decoration:none;font-weight:bold;margin-top:6px;">Ver Memorando</a>`
      }
    } else {
      mensaje = `Tu solicitud ${solicitud.numero_expediente} ha sido rechazada.`
    }

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
