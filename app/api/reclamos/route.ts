import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db/postgres"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

// Función utilitaria para generar el memorando PDF con formato y mensaje
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
  let y = 800

  // Encabezado
  page.drawText("UGEL ILO", { x: 50, y, size: 10, font: fontBold })
  page.drawText("MEMORANDO", { x: 250, y, size: 16, font: fontBold })
  y -= 30

  // Datos principales
  page.drawText(`Expediente: ${numeroExpediente}`, { x: 50, y, size: 12, font })
  y -= 20
  page.drawText(`Asunto: ${asunto}`, { x: 50, y, size: 12, font })
  y -= 20
  page.drawText(`Fecha: ${fecha}`, { x: 50, y, size: 12, font })
  y -= 30

  // Mensaje formal
  const mensaje = `Por la presente se comunica al(la) Sr(a). ${usuarioNombre}, quien desempeña el cargo de ${cargo}, que se ha registrado la siguiente solicitud de licencia:\n\n` +
    `- Razón: ${razon}\n` +
    `- Tipo: ${goceRemuneraciones ? "Con goce de remuneraciones" : "Sin goce de remuneraciones"}\n` +
    `- Período solicitado: ${periodo}\n\n` +
    `Se le informa que la presente solicitud ha sido aprobada y se procederá conforme a la normativa vigente.\n\n` +
    `Atentamente,\nUGEL ILO`

  const lines = mensaje.split("\n")
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font })
    y -= 18
  }

  return await pdfDoc.save()
}

// Endpoint para obtener reclamos
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const estado = url.searchParams.get("estado") || "pendiente"

    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    // Filtrar por usuario si no es admin
    let queryText = `
      SELECT 
        r.*, 
        s.numero_expediente AS solicitud_numero_expediente,
        s.tipo AS solicitud_tipo,
        s.fecha_inicio AS solicitud_fecha_inicio,
        s.fecha_fin AS solicitud_fecha_fin,
        s.estado AS solicitud_estado
      FROM reclamos r
      LEFT JOIN solicitudes s ON r.solicitud_id = s.id
      WHERE r.estado = $1
    `
    const params: any[] = [estado]

    if (userCheck.user.role !== "admin") {
      queryText += " AND r.usuario_id = $2"
      params.push(userCheck.user.id)
    }

    queryText += " ORDER BY r.created_at DESC"

    const result = await query(queryText, params)

    if (result.rowCount === 0) {
      return NextResponse.json({
        reclamos: [],
        message: "no hay reclamos disponibles"
      }, { status: 200 })
    }

    return NextResponse.json({
      reclamos: result.rows.map(r => ({
        ...r,
        solicitud: {
          numeroExpediente: r.solicitud_numero_expediente,
          tipo: r.solicitud_tipo,
          fechaInicio: r.solicitud_fecha_inicio,
          fechaFin: r.solicitud_fecha_fin,
          estado: r.solicitud_estado,
        }
      }))
    })

  } catch (error: any) {
    console.error("Error al cargar los reclamos:", error);
    return NextResponse.json({ message: "Error en el servidor", error: error.stack }, { status: 500 });
  }
}

// Endpoint para crear un reclamo
export async function POST(request: Request) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    let data: any = {}
    let archivoUrl: string | null = null

    const contentType = request.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await request.json()
      if (data.archivo_url) {
        archivoUrl = data.archivo_url
      }
    } else {
      const formData = await request.formData()
      data = {
        solicitudId: formData.get('solicitudId'),
        descripcion: (formData.get('descripcion') || '').toString().trim(),
      }

      const archivoData = formData.get('archivo')
      if (archivoData instanceof File && archivoData.size > 0) {
        const buffer = Buffer.from(await archivoData.arrayBuffer())
        const safeName = archivoData.name.replace(/[^a-z0-9.\-_]/gi, "_")
        const filename = `${Date.now()}_${safeName}`
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        await mkdir(uploadDir, { recursive: true })
        const filePath = path.join(uploadDir, filename)
        await writeFile(filePath, buffer)
        archivoUrl = `/uploads/${filename}`
      }
    }

    const camposRequeridos = ['descripcion']
    const camposVacios = camposRequeridos.filter(campo => !data[campo])
    if (camposVacios.length > 0) {
      return NextResponse.json({
        message: `Los siguientes campos son requeridos: ${camposVacios.join(', ')}`,
        camposVacios
      }, { status: 400 })
    }

    if (data.solicitudId) {
      const solicitudQuery = await query(
        `SELECT estado, created_at FROM solicitudes WHERE id = $1`,
        [data.solicitudId]
      )

      if (solicitudQuery.rowCount === 0) {
        return NextResponse.json({ message: "La solicitud no existe." }, { status: 404 })
      }

      const { estado, created_at } = solicitudQuery.rows[0]
      const tresDiasEnMs = 3 * 24 * 60 * 60 * 1000
      const fechaCreacion = new Date(created_at)
      const ahora = new Date()

      const puedeReclamar =
        estado === 'rechazada' ||
        (estado === 'pendiente' && (ahora.getTime() - fechaCreacion.getTime()) >= tresDiasEnMs)

      if (!puedeReclamar) {
        return NextResponse.json({
          message: "Solo puedes presentar un reclamo si la solicitud fue rechazada o ha estado pendiente por más de 3 días.",
        }, { status: 400 })
      }

      const reclamoExistente = await query(
        `SELECT 1 FROM reclamos WHERE solicitud_id = $1 AND usuario_id = $2`,
        [data.solicitudId, userCheck.user.id]
      )

      if (reclamoExistente.rowCount > 0) {
        return NextResponse.json({
          message: "Ya has registrado un reclamo para esta solicitud.",
        }, { status: 400 })
      }
    }

    const result = await query(
      `INSERT INTO reclamos (
        solicitud_id,
        usuario_id,
        mensaje,
        archivo_url,
        estado
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, solicitud_id, mensaje, archivo_url, estado, created_at`,
      [
        data.solicitudId || null,
        userCheck.user.id,
        data.descripcion,
        archivoUrl || null,
        'pendiente'
      ]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Error al registrar el reclamo" }, { status: 500 })
    }

    const reclamoCreado = result.rows[0]

    await query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje)
       VALUES ($1, $2, $3)`,
      [
        userCheck.user.id,
        "Reclamo registrado",
        `Tu reclamo para la solicitud #${data.solicitudId || "sin solicitud"} ha sido registrado y está pendiente de revisión.`
      ]
    )

    return NextResponse.json({
      reclamo: {
        id: reclamoCreado.id,
        solicitudId: reclamoCreado.solicitud_id,
        mensaje: reclamoCreado.mensaje,
        archivoUrl: reclamoCreado.archivo_url,
        estado: reclamoCreado.estado,
        fechaCreacion: reclamoCreado.created_at
      },
      message: "Reclamo registrado exitosamente",
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error al registrar reclamo:", error)
    return NextResponse.json({ message: "Error en el servidor", error: error.message }, { status: 500 })
  }
}

// Endpoint para actualizar un reclamo
export async function PATCH(request: Request) {
  try {
    const userCheck = await getCurrentUser(request);
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status });
    }

    const { id, estado, respuesta, solicitudId } = await request.json();

    let result;
    if (typeof solicitudId !== "undefined") {
      // Si viene solicitudId, actualiza también ese campo
      result = await query(
        `
          UPDATE reclamos 
          SET estado = $1, respuesta = $2, updated_at = NOW(), solicitud_id = $4
          WHERE id = $3
          RETURNING *
        `,
        [estado, respuesta, id, solicitudId]
      );
    } else {
      // Si no viene solicitudId, no lo actualices
      result = await query(
        `
          UPDATE reclamos 
          SET estado = $1, respuesta = $2, updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `,
        [estado, respuesta, id]
      );
    }

    if (result.rowCount === 0) {
      console.log("No se encontró el reclamo para actualizar:", id);
      return NextResponse.json({ message: "Reclamo no encontrado" }, { status: 404 });
    }

    const reclamo = result.rows[0];
    console.log("Reclamo actualizado:", reclamo);

    // Obtener información de la solicitud asociada SOLO si existe solicitud_id
    if (reclamo.solicitud_id) {
      console.log("Buscando solicitud asociada con ID:", reclamo.solicitud_id);
      const solicitudResult = await query(
        `
          SELECT id, numero_expediente, estado, usuario_id 
          FROM solicitudes 
          WHERE id = $1
        `,
        [reclamo.solicitud_id]
      );

      if (solicitudResult.rowCount === 0) {
        console.log("No se encontró la solicitud asociada:", reclamo.solicitud_id);
        return NextResponse.json({ message: "Solicitud asociada no encontrada" }, { status: 404 });
      }

      const solicitud = solicitudResult.rows[0];
      console.log("Solicitud asociada encontrada:", solicitud);

      // Comparar estado ignorando mayúsculas/minúsculas y espacios
      console.log("Estado actual de la solicitud:", solicitud.estado, "| Estado esperado: 'rechazada'");
      if (
        estado === "aprobado" &&
        typeof solicitud.estado === "string" &&
        solicitud.estado.trim().toLowerCase() === "rechazada"
      ) {
        console.log("Actualizando solicitud a 'aprobada'...");
        await query(
          `
            UPDATE solicitudes 
            SET estado = 'aprobada', updated_at = NOW()
            WHERE id = $1
          `,
          [solicitud.id]
        );
        console.log("Solicitud actualizada a 'aprobada'");

        // --- Generar el memorando PDF al aprobar el reclamo ---
        let pdfUrl = null
        try {
          // Obtener datos completos de la solicitud y usuario
          const solicitudCompletaResult = await query(
            `SELECT s.*, u.nombre as usuario_nombre
             FROM solicitudes s
             JOIN usuarios u ON s.usuario_id = u.id
             WHERE s.id = $1`,
            [solicitud.id]
          );
          if (solicitudCompletaResult.rowCount > 0) {
            const s = solicitudCompletaResult.rows[0];
            const pdfBytes = await generarMemorandoPDF({
              numeroExpediente: s.numero_expediente,
              asunto: s.tipo,
              fecha: new Date(s.updated_at || s.created_at).toLocaleDateString("es-PE"),
              usuarioNombre: s.usuario_nombre,
              razon: s.descripcion,
              goceRemuneraciones: s.goce_remuneraciones,
              cargo: s.cargo,
              periodo: `${s.fecha_inicio} al ${s.fecha_fin}`
            })
            const uploadsDir = path.join(process.cwd(), "public", "pdf");
            try {
              await mkdir(uploadsDir, { recursive: true });
            } catch (mkdirErr) {
              console.error("Error creando el directorio public/pdf:", mkdirErr);
            }
            const filePath = path.join(uploadsDir, `solicitud_${s.id}.pdf`);
            try {
              await writeFile(filePath, pdfBytes);
              pdfUrl = `/pdf/solicitud_${s.id}.pdf`
              console.log("PDF generado y guardado en:", filePath);
            } catch (writeErr) {
              console.error("Error guardando el PDF:", writeErr, "Path:", filePath);
            }
          } else {
            console.error("No se encontró la solicitud para generar el PDF.");
          }
        } catch (pdfError) {
          console.error("Error generando el memorando PDF tras aprobar reclamo:", pdfError);
        }
        // --- Fin generación PDF ---

        // Crear notificación para el usuario sobre la actualización de la solicitud
        let mensajeNotificacion = `Tu solicitud con expediente ${solicitud.numero_expediente} ha sido aprobada tras la revisión de tu reclamo.`
        if (pdfUrl) {
          mensajeNotificacion += ` <a href="${pdfUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Ver Memorando</a>`
        }
        await query(
          `
            INSERT INTO notificaciones (usuario_id, titulo, mensaje)
            VALUES ($1, $2, $3)
          `,
          [
            solicitud.usuario_id,
            "Solicitud aprobada",
            mensajeNotificacion,
          ]
        );
      } else {
        console.log("No se cumplen condiciones para actualizar la solicitud.");
      }

      // Crear notificación para el usuario sobre el estado del reclamo
      const titulo = `Reclamo ${estado === "aprobado" ? "aprobado" : "rechazado"}`;
      const mensaje =
        estado === "aprobado"
          ? `Tu reclamo para la solicitud con expediente ${solicitud.numero_expediente} ha sido aprobado. Respuesta: ${respuesta || "Sin respuesta"}`
          : `Tu reclamo para la solicitud con expediente ${solicitud.numero_expediente} ha sido rechazado. Respuesta: ${respuesta || "Sin respuesta"}`;

      await query(
        `
          INSERT INTO notificaciones (usuario_id, titulo, mensaje)
          VALUES ($1, $2, $3)
        `,
        [solicitud.usuario_id, titulo, mensaje]
      );
    } else {
      console.log("El reclamo no tiene solicitud_id asociado.");
    }

    return NextResponse.json({ message: `Reclamo ${estado} exitosamente` });
  } catch (error) {
    console.error("Error al actualizar reclamo:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
