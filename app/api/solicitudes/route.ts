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

export async function POST(request: Request) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    let data: any = {}
    let archivo: File | null = null
    let archivoUrl: string | null = null

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      data = {
        tipo: (formData.get('tipo') || '').toString().trim(),
        motivo: (formData.get('motivo') || '').toString().trim(),
        fechaInicio: (formData.get('fechaInicio') || '').toString().trim(),
        fechaFin: (formData.get('fechaFin') || '').toString().trim(),
        celular: (formData.get('celular') || '').toString().trim(),
        correo: (formData.get('correo') || '').toString().trim(),
        cargo: (formData.get('cargo') || '').toString().trim(),
        institucion: (formData.get('institucion') || '').toString().trim(),
        goceRemuneraciones: formData.get('goceRemuneraciones') === 'true',
        comentarios: (formData.get('comentarios') || '').toString().trim(),
      }
      // Procesar archivo
      const archivoData = formData.get('archivo')
      archivo = archivoData instanceof File && archivoData.size > 0 ? archivoData : null

      // Guardar archivo si existe
      if (archivo) {
        const buffer = Buffer.from(await archivo.arrayBuffer())
        const safeName = archivo.name.replace(/[^a-z0-9.\-_]/gi, "_")
        const filename = `${Date.now()}_${safeName}`
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        await mkdir(uploadDir, { recursive: true })
        const filePath = path.join(uploadDir, filename)
        await writeFile(filePath, buffer)
        archivoUrl = `/uploads/${filename}` // <-- Esta ruta se guarda en la base de datos
      }
    } else {
      // Si es JSON, simplemente parseamos la solicitud
      data = await request.json()
      // Si viene archivo_url desde el frontend (por ejemplo, subido previamente)
      if (data.rutaAdjunto) {
        archivoUrl = data.rutaAdjunto
      }
    }

    // Validar campos requeridos
    const camposRequeridos = [
      'tipo',
      'motivo',
      'fechaInicio',
      'fechaFin',
      'celular',
      'correo',
      'cargo',
      'institucion'
    ]
    
    const camposVacios = camposRequeridos.filter(campo => !data[campo])
    
    if (camposVacios.length > 0) {
      return NextResponse.json({
        message: `Los siguientes campos son requeridos: ${camposVacios.join(', ')}`,
        camposVacios
      }, { status: 400 })
    }

    if (!userCheck.user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Generar el número de expediente automáticamente con el formato "EXP-{año}-{número de 4 cifras}"
    const currentYear = new Date().getFullYear()
    
    // Usar Supabase para contar expedientes del año actual
    const { data: expedienteData, error: expedienteError } = await supabase
      .from('solicitudes')
      .select('id', { count: 'exact' })
      .gte('created_at', `${currentYear}-01-01`)
      .lte('created_at', `${currentYear}-12-31`)
    
    if (expedienteError) {
      console.error("Error al obtener conteo de expedientes:", expedienteError)
      return NextResponse.json({ message: "Error al generar número de expediente" }, { status: 500 })
    }
    
    const expedienteCount = (expedienteData ? expedienteData.length : 0) + 1
    const numeroExpediente = `EXP-${currentYear}-${expedienteCount.toString().padStart(4, '0')}`

    // Insertar la solicitud con Supabase
    const { data: insertData, error: insertError } = await supabase
      .from('solicitudes')
      .insert({
        usuario_id: userCheck.user.id,
        tipo: data.tipo,
        descripcion: data.motivo,
        fecha_inicio: data.fechaInicio,
        fecha_fin: data.fechaFin,
        estado: "pendiente",
        archivo_url: archivoUrl,
        numero_expediente: numeroExpediente,
        celular: data.celular,
        correo: data.correo,
        cargo: data.cargo,
        institucion: data.institucion,
        goce_remuneraciones: data.goceRemuneraciones,
        comentarios: data.comentarios || ""
      })
      .select('id, numero_expediente, tipo, descripcion, fecha_inicio, fecha_fin, estado, archivo_url, created_at, celular, correo, cargo, institucion, goce_remuneraciones, comentarios')
      .single()
    
    if (insertError || !insertData) {
      console.error("Error al crear solicitud:", insertError)
      return NextResponse.json({ message: "Error al crear solicitud" }, { status: 500 })
    }
    
    const solicitudCreada = {
      ...insertData,
      motivo: insertData.descripcion
    }

    // --- Generar PDF si la solicitud es aprobada al crearla (caso raro, pero cubierto) ---
    let pdfUrl = null
    if (solicitudCreada.estado === "aprobada") {
      try {
        const pdfBytes = await generarMemorandoPDF({
          numeroExpediente: solicitudCreada.numero_expediente,
          asunto: solicitudCreada.tipo,
          fecha: new Date(solicitudCreada.created_at).toLocaleDateString("es-PE"),
          usuarioNombre: userCheck.user.nombre || "",
          razon: solicitudCreada.motivo,
          goceRemuneraciones: solicitudCreada.goce_remuneraciones,
          cargo: solicitudCreada.cargo,
          periodo: `${solicitudCreada.fecha_inicio} al ${solicitudCreada.fecha_fin}`
        })
        const uploadsDir = path.join(process.cwd(), "public", "pdf")
        await mkdir(uploadsDir, { recursive: true })
        const filePath = path.join(uploadsDir, `solicitud_${solicitudCreada.id}.pdf`)
        await writeFile(filePath, pdfBytes)
        pdfUrl = `/pdf/solicitud_${solicitudCreada.id}.pdf`
      } catch (err) {
        console.error("Error generando PDF al crear solicitud:", err)
      }
    }
    // --- Fin generación PDF ---

    // Crear notificación con Supabase
    const { error: notificacionError } = await supabase
      .from('notificaciones')
      .insert({
        usuario_id: userCheck.user.id,
        titulo: "Solicitud creada",
        mensaje: `Tu solicitud #${solicitudCreada.id} ha sido creada y está pendiente de revisión.`
      })
    
    if (notificacionError) {
      console.error("Error al crear notificación:", notificacionError)
    }

    return NextResponse.json({
      solicitud: {
        id: solicitudCreada.id,
        numeroExpediente: solicitudCreada.numero_expediente,
        tipo: solicitudCreada.tipo,
        motivo: solicitudCreada.motivo,
        fechaInicio: solicitudCreada.fecha_inicio,
        fechaFin: solicitudCreada.fecha_fin,
        estado: solicitudCreada.estado,
        fechaSolicitud: solicitudCreada.created_at,
        celular: solicitudCreada.celular,
        correo: solicitudCreada.correo,
        cargo: solicitudCreada.cargo,
        institucion: solicitudCreada.institucion,
        goceRemuneraciones: solicitudCreada.goce_remuneraciones,
        comentarios: solicitudCreada.comentarios,
        rutaAdjunto: solicitudCreada.archivo_url,
        pdfUrl // Devuelve la URL del PDF si existe
      },
      message: "Solicitud creada exitosamente",
    }, { status: 201 })

  } catch (error) {
    console.error("Error al crear solicitud:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    if (!userCheck.user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")

    // Iniciar consulta con Supabase
    let query = supabase
      .from('solicitudes')
      .select(`
        id,
        numero_expediente,
        tipo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        estado,
        created_at,
        updated_at,
        celular,
        correo,
        cargo,
        institucion,
        goce_remuneraciones,
        comentarios,
        archivo_url,
        usuario_id,
        usuarios (
          id,
          nombre,
          departamento
        )
      `)
      .order('created_at', { ascending: false })
    
    // Agregar condición de usuario si no es admin
    if (userCheck.user.role !== "admin") {
      query = query.eq('usuario_id', userCheck.user.id)
    }

    // Agregar condición de estado si se especifica
    if (estado) {
      query = query.eq('estado', estado)
    }

    // Ejecutar la consulta
    const { data: solicitudesData, error } = await query

    if (error) {
      console.error("Error al obtener solicitudes:", error)
      return NextResponse.json({ message: "Error al obtener solicitudes" }, { status: 500 })
    }
    
    if (!solicitudesData) {
      return NextResponse.json({ solicitudes: [] })
    }

    // Mapear resultados
    const solicitudes = solicitudesData.map((s) => ({
      id: s.id,
      numeroExpediente: s.numero_expediente,
      tipo: s.tipo,
      motivo: s.descripcion,
      fechaInicio: s.fecha_inicio,
      fechaFin: s.fecha_fin,
      estado: s.estado,
      fechaSolicitud: s.created_at,
      fechaActualizacion: s.updated_at,
      celular: s.celular,
      correo: s.correo,
      cargo: s.cargo,
      institucion: s.institucion,
      goceRemuneraciones: s.goce_remuneraciones,
      comentarios: s.comentarios,
      rutaAdjunto: s.archivo_url,
      usuario: userCheck.user.role === "admin" ? {
        id: s.usuario_id,
        nombre: s.usuarios?.nombre,
        departamento: s.usuarios?.departamento,
      } : undefined
    }))

    return NextResponse.json({ solicitudes })

  } catch (error) {
    console.error("Error al obtener solicitudes:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
