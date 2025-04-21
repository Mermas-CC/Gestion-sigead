import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"
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
    let query = supabase
      .from('reclamos')
      .select(`
        *,
        solicitudes (
          numero_expediente,
          tipo,
          fecha_inicio,
          fecha_fin,
          estado
        )
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false })
    
    if (userCheck.user.role !== "admin") {
      query = query.eq('usuario_id', userCheck.user.id)
    }

    const { data, error } = await query
    
    if (error) {
      console.error("Error al obtener reclamos:", error)
      return NextResponse.json({ message: "Error al obtener reclamos" }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({
        reclamos: [],
        message: "No hay reclamos disponibles"
      }, { status: 200 })
    }

    return NextResponse.json({
      reclamos: data.map(r => ({
        ...r,
        solicitud: r.solicitudes ? {
          numeroExpediente: r.solicitudes.numero_expediente,
          tipo: r.solicitudes.tipo,
          fechaInicio: r.solicitudes.fecha_inicio,
          fechaFin: r.solicitudes.fecha_fin,
          estado: r.solicitudes.estado,
        } : null
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
      // Verificar si la solicitud existe con Supabase
      const { data: solicitudData, error: solicitudError } = await supabase
        .from('solicitudes')
        .select('estado, created_at')
        .eq('id', data.solicitudId)
        .single()
      
      if (solicitudError || !solicitudData) {
        return NextResponse.json({ message: "La solicitud no existe." }, { status: 404 })
      }
      
      const { estado, created_at } = solicitudData
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

      // Verificar si ya existe un reclamo para esta solicitud con Supabase
      const { data: reclamoExistente, error: reclamoExistenteError } = await supabase
        .from('reclamos')
        .select('id')
        .eq('solicitud_id', data.solicitudId)
        .eq('usuario_id', userCheck.user.id)
        .maybeSingle()
      
      if (reclamoExistente) {
        return NextResponse.json({
          message: "Ya has registrado un reclamo para esta solicitud.",
        }, { status: 400 })
      }
    }

    // Insertar reclamo con Supabase
    const { data: reclamoCreado, error: insertError } = await supabase
      .from('reclamos')
      .insert({
        solicitud_id: data.solicitudId || null,
        usuario_id: userCheck.user.id,
        mensaje: data.descripcion,
        archivo_url: archivoUrl || null,
        estado: 'pendiente'
      })
      .select('id, solicitud_id, mensaje, archivo_url, estado, created_at')
      .single()
    
    if (insertError || !reclamoCreado) {
      console.error("Error al registrar reclamo:", insertError)
      return NextResponse.json({ message: "Error al registrar el reclamo" }, { status: 500 })
    }

    // Crear notificación con Supabase
    const { error: notificacionError } = await supabase
      .from('notificaciones')
      .insert({
        usuario_id: userCheck.user.id,
        titulo: "Reclamo registrado",
        mensaje: `Tu reclamo para la solicitud #${data.solicitudId || "sin solicitud"} ha sido registrado y está pendiente de revisión.`
      })
    
    if (notificacionError) {
      console.error("Error al crear notificación:", notificacionError)
    }

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
    // Preparar datos para la actualización
    let updateData: any = {
      estado: estado,
      respuesta: respuesta,
      updated_at: new Date().toISOString()
    };
    
    // Si viene solicitudId, incluirlo en la actualización
    // Si viene solicitudId, incluirlo en la actualización
    if (typeof solicitudId !== "undefined") {
      updateData.solicitud_id = solicitudId;
    }
    // Actualizar el reclamo con Supabase
    const { data: reclamoData, error: updateError } = await supabase
      .from('reclamos')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (updateError || !reclamoData) {
      console.log("No se encontró el reclamo para actualizar:", id);
      return NextResponse.json({ message: "Reclamo no encontrado" }, { status: 404 });
    }
    
    const reclamo = reclamoData;
    if (reclamo.solicitud_id) {
      console.log("Buscando solicitud asociada con ID:", reclamo.solicitud_id);
      // Obtener solicitud con Supabase
      const { data: solicitudData, error: solicitudError } = await supabase
        .from('solicitudes')
        .select('id, numero_expediente, estado, usuario_id')
        .eq('id', reclamo.solicitud_id)
        .single();
      
      if (solicitudError || !solicitudData) {
        console.log("No se encontró la solicitud asociada:", reclamo.solicitud_id);
        return NextResponse.json({ message: "Solicitud asociada no encontrada" }, { status: 404 });
      }
      
      const solicitud = solicitudData;

      // Comparar estado ignorando mayúsculas/minúsculas y espacios
      console.log("Estado actual de la solicitud:", solicitud.estado, "| Estado esperado: 'rechazada'");
      if (
        estado === "aprobado" &&
        typeof solicitud.estado === "string" &&
        solicitud.estado.trim().toLowerCase() === "rechazada"
      ) {
        console.log("Actualizando solicitud a 'aprobada'...");
        console.log("Actualizando solicitud a 'aprobada'...");
        const { error: updateSolicitudError } = await supabase
          .from('solicitudes')
          .update({ 
            estado: 'aprobada', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', solicitud.id);
          
        if (updateSolicitudError) {
          console.error("Error al actualizar la solicitud:", updateSolicitudError);
        }
        // --- Generar el memorando PDF al aprobar el reclamo ---
        let pdfUrl = null
        try {
          // Obtener datos completos de la solicitud y usuario con Supabase
          const { data: solicitudCompleta, error: solicitudCompletaError } = await supabase
            .from('solicitudes')
            .select(`
              *,
              usuarios (
                nombre
              )
            `)
            .eq('id', solicitud.id)
            .single();
            
          if (!solicitudCompletaError && solicitudCompleta) {
            const s = {
              ...solicitudCompleta,
              usuario_nombre: solicitudCompleta.usuarios?.nombre,
              descripcion: solicitudCompleta.descripcion
            };
            
            // Generar el PDF
            const pdfBytes = await generarMemorandoPDF({
              numeroExpediente: s.numero_expediente,
              asunto: s.tipo,
              fecha: new Date(s.updated_at || s.created_at).toLocaleDateString("es-PE"),
              usuarioNombre: s.usuario_nombre,
              razon: s.descripcion,
              goceRemuneraciones: s.goce_remuneraciones,
              cargo: s.cargo,
              periodo: `${s.fecha_inicio} al ${s.fecha_fin}`
            });
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
        // Crear notificación con Supabase
        const { error: notificacionError } = await supabase
          .from('notificaciones')
          .insert({
            usuario_id: solicitud.usuario_id,
            titulo: "Solicitud aprobada",
            mensaje: mensajeNotificacion
          });
          
        if (notificacionError) {
          console.error("Error al crear notificación de solicitud aprobada:", notificacionError);
        }
      } else {
        console.log("No se cumplen condiciones para actualizar la solicitud.");
      }

      // Crear notificación para el usuario sobre el estado del reclamo
      const titulo = `Reclamo ${estado === "aprobado" ? "aprobado" : "rechazado"}`;
      const mensaje =
        estado === "aprobado"
          ? `Tu reclamo para la solicitud con expediente ${solicitud.numero_expediente} ha sido aprobado. Respuesta: ${respuesta || "Sin respuesta"}`
          : `Tu reclamo para la solicitud con expediente ${solicitud.numero_expediente} ha sido rechazado. Respuesta: ${respuesta || "Sin respuesta"}`;

      // Crear notificación con Supabase
      const { error: notificacionReclamoError } = await supabase
        .from('notificaciones')
        .insert({
          usuario_id: solicitud.usuario_id,
          titulo: titulo,
          mensaje: mensaje
        });
        
      if (notificacionReclamoError) {
        console.error("Error al crear notificación de estado de reclamo:", notificacionReclamoError);
      }
    } else {
      console.log("El reclamo no tiene solicitud_id asociado.");
    }

    return NextResponse.json({ message: `Reclamo ${estado} exitosamente` });
  } catch (error) {
    console.error("Error al actualizar reclamo:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
