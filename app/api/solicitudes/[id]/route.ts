import { NextResponse } from "next/server"
import { query } from "@/lib/db/postgres" // Utiliza tu cliente de PostgreSQL
import { getCurrentUser, verifyAdmin } from "@/lib/auth" // Para verificar el usuario y el rol
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

async function generarMemorandoPDF(s: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 12;
  let y = 800;

  // Encabezado institucional simulado
  page.drawText("PERÚ | Ministerio de Educación", { x: 50, y, size: 10, font });
  page.drawText("UGEL ILO", { x: 470, y, size: 10, font });
  y -= 40;

  // Título del memorando
  const title = `MEMORANDUM N°${s.numero_expediente}-GREMO-DUGEILO-ADM`;
  page.drawText(title, {
    x: 595 / 2 - fontBold.widthOfTextAtSize(title, 14) / 2,
    y,
    size: 14,
    font: fontBold,
  });
  y -= 30;

  // Datos principales tipo oficio
  const drawInfo = (label: string, value: string) => {
    page.drawText(`${label}:`, { x: 50, y, size: fontSize, font: fontBold });
    page.drawText(value ?? "-", { x: 180, y, size: fontSize, font });
    y -= 20;
  };

  drawInfo("PARA", "RESPONSABLE DE PROYECTOS RESOLUCIÓN");
  drawInfo("ASUNTO", "PROYECTAR RESOLUCIÓN");
  drawInfo("REF", `EXPEDIENTE N°${s.numero_expediente}, INFORME N°340-2022-UGEL-ILO-ADM...`);
  drawInfo("FECHA", `ILO, ${formatearFecha(s.fecha_fin)}`);

  // Línea separadora
  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 25;

  // Cuerpo del memorando
  const otorgarTexto = `Sirvase proyectar resolución, realizando la siguiente acción:

1.- OTORGAR Licencia con Goce de Remuneraciones por ${s.tipo} a don(ña) ${
    s.usuario_nombre
  }, profesor(a) de la I.E. “Mariscal Andrés Avelino Cáceres”,
jurisdicción de la Unidad de Gestión Educativa Local Ilo, conforme se detalla:`;

  const drawMultiline = (text: string, x: number, width: number, lineHeight: number) => {
    const lines = text.split("\n");
    for (const line of lines) {
      page.drawText(line.trim(), { x, y, size: fontSize, font });
      y -= lineHeight;
    }
  };

  drawMultiline(otorgarTexto, 50, 495, 16);

  // Datos tipo tabla
  y -= 10;

  // Tabla: Empleador - EsSalud - Vigencia - CITT
  page.drawText("TOTAL DÍAS A CARGO", { x: 60, y, size: fontSize - 1, font: fontBold });
  page.drawText("Empleador", { x: 80, y: y - 15, size: fontSize - 1, font });
  page.drawText("20", { x: 90, y: y - 30, size: fontSize, font });

  page.drawText("EsSalud", { x: 160, y: y - 15, size: fontSize - 1, font });
  page.drawText("8", { x: 170, y: y - 30, size: fontSize, font });

  page.drawText("VIGENCIA", { x: 260, y, size: fontSize - 1, font: fontBold });
  page.drawText(`${s.fecha_inicio} al ${s.fecha_fin}`, { x: 270, y: y - 20, size: fontSize, font });

  page.drawText("N°. CITT/CERT. MED.", { x: 400, y, size: fontSize - 1, font: fontBold });
  page.drawText("000000000", { x: 410, y: y - 20, size: fontSize, font });

  y -= 60;

  page.drawText("Atentamente,", { x: 50, y, size: fontSize, font });

  // --- OPCIONAL: Información adicional al final tipo resumen ---
  y -= 40;
  const drawLine = (label: string, value: any) => {
    page.drawText(`${label}:`, { x: 50, y, size: fontSize - 1, font: fontBold });
    page.drawText(`${value ?? "-"}`, { x: 180, y, size: fontSize - 1, font });
    y -= 18;
  };

  drawLine("ID", s.id);
  drawLine("N° Expediente", s.numero_expediente);
  drawLine("Tipo", s.tipo);
  drawLine("Motivo", s.motivo || s.descripcion);
  drawLine("Fecha Inicio", s.fecha_inicio);
  drawLine("Fecha Fin", s.fecha_fin);
  drawLine("Estado", "aprobada");
  drawLine("Comentarios", s.comentarios);
  drawLine("Usuario", s.usuario_nombre);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function formatearFecha(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const id = params.id

    // Consulta base para obtener la solicitud
    const { rows } = await query(
      `SELECT 
        id, numero_expediente, tipo, motivo, fecha_inicio, fecha_fin, estado, comentarios, 
        fecha_solicitud, fecha_actualizacion,
        usuario_id, (SELECT nombre FROM usuarios WHERE id = usuario_id) AS usuario_nombre
       FROM solicitudes WHERE id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 })
    }

    const solicitud = rows[0]

    // Si no es admin, verificar que la solicitud pertenezca al usuario
    if (userCheck.user.role !== "admin" && solicitud.usuario_id !== userCheck.user.id) {
      return NextResponse.json({ message: "No tienes permisos para ver esta solicitud" }, { status: 403 })
    }

    // Formatear respuesta según el rol
    if (userCheck.user.role !== "admin") {
      return NextResponse.json({
        solicitud: {
          id: solicitud.id,
          numeroExpediente: solicitud.numero_expediente,
          tipo: solicitud.tipo,
          motivo: solicitud.motivo,
          fechaInicio: solicitud.fecha_inicio,
          fechaFin: solicitud.fecha_fin,
          estado: solicitud.estado,
          comentarios: solicitud.comentarios,
          fechaSolicitud: solicitud.fecha_solicitud,
          fechaActualizacion: solicitud.fecha_actualizacion,
        },
      })
    } else {
      return NextResponse.json({
        solicitud: {
          id: solicitud.id,
          numeroExpediente: solicitud.numero_expediente,
          tipo: solicitud.tipo,
          motivo: solicitud.motivo,
          fechaInicio: solicitud.fecha_inicio,
          fechaFin: solicitud.fecha_fin,
          estado: solicitud.estado,
          comentarios: solicitud.comentarios,
          fechaSolicitud: solicitud.fecha_solicitud,
          fechaActualizacion: solicitud.fecha_actualizacion,
          usuario: {
            id: solicitud.usuario_id,
            nombre: solicitud.usuario_nombre,
          },
        },
      })
    }
  } catch (error) {
    console.error("Error al obtener solicitud:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Solo los administradores pueden actualizar el estado de las solicitudes
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status })
    }

    const id = params.id
    const { estado, comentarios } = await request.json()

    // Validar estado
    if (!["pendiente", "aprobada", "rechazada"].includes(estado)) {
      return NextResponse.json({ message: "Estado no válido" }, { status: 400 })
    }

    // Consultar solicitud en la base de datos
    const result = await query(
      `SELECT id, usuario_id, numero_expediente, tipo, motivo FROM solicitudes WHERE id = $1`,
      [id]
    )

    if (!result.rows.length) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 })
    }

    const solicitud = result.rows[0]

    // Actualizar estado de la solicitud
    await query(
      `UPDATE solicitudes SET estado = $1, comentarios = $2, fecha_actualizacion = NOW() WHERE id = $3`,
      [estado, comentarios, id]
    )

    // Crear la notificación
    let pdfUrl = null
    if (estado === "aprobada") {
      try {
        // Obtener datos completos de la solicitud y usuario
        const solicitudCompletaResult = await query(
          `SELECT s.*, u.nombre as usuario_nombre
           FROM solicitudes s
           JOIN usuarios u ON s.usuario_id = u.id
           WHERE s.id = $1`,
          [id]
        );
        if (solicitudCompletaResult.rowCount > 0) {
          const s = solicitudCompletaResult.rows[0];
          const pdfBytes = await generarMemorandoPDF(s);
          const uploadsDir = path.join(process.cwd(), "public", "pdf");
          await mkdir(uploadsDir, { recursive: true });
          const filePath = path.join(uploadsDir, `solicitud_${s.id}.pdf`);
          await writeFile(filePath, pdfBytes);
          pdfUrl = `/pdf/solicitud_${s.id}.pdf`
        }
      } catch (err) {
        console.error("Error generando PDF al aprobar solicitud:", err)
      }
    }

    const estadoTexto = estado === "aprobada" ? "aprobada" : "rechazada"
    let mensajeNotificacion = `Tu solicitud ${solicitud.numero_expediente} ha sido ${estadoTexto}.`
    if (estado === "aprobada" && pdfUrl) {
      mensajeNotificacion += ` <a href="${pdfUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Ver Memorando</a>`
    }
    await query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje) VALUES ($1, $2, $3)`,
      [
        solicitud.usuario_id,
        `Solicitud ${estadoTexto}`,
        mensajeNotificacion,
      ]
    )

    return NextResponse.json({
      message: `Solicitud ${estadoTexto} exitosamente`,
      pdfUrl
    })
  } catch (error) {
    console.error("Error al actualizar solicitud:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
