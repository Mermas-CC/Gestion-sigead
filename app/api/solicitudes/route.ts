import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db/postgres"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    let data: any = {}
    let archivo: File | null = null

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
      const archivoData = formData.get('archivo')
      archivo = archivoData instanceof File && archivoData.size > 0 ? archivoData : null
    } else {
      data = await request.json()
    }

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

    let archivoUrl = null
    if (archivo) {
      const uploadsDir = path.join(process.cwd(), "public/uploads")
      await fs.mkdir(uploadsDir, { recursive: true }) // Crear el directorio si no existe
      const archivoPath = path.join(uploadsDir, archivo.name)
      const archivoBuffer = Buffer.from(await archivo.arrayBuffer())
      await fs.writeFile(archivoPath, archivoBuffer) // Guardar el archivo en el servidor
      archivoUrl = `/uploads/${archivo.name}` // URL relativa del archivo
    }

    const currentYear = new Date().getFullYear()
    const expedienteQuery = await query(
      `SELECT COUNT(*) AS count FROM solicitudes WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [currentYear]
    )
    const expedienteCount = parseInt(expedienteQuery.rows[0].count) + 1
    const numeroExpediente = `EXP-${currentYear}-${expedienteCount.toString().padStart(4, '0')}`

    const result = await query(
      `INSERT INTO solicitudes (
        usuario_id, 
        tipo, 
        descripcion, 
        fecha_inicio, 
        fecha_fin, 
        estado, 
        archivo_url, 
        numero_expediente,
        celular,
        correo,
        cargo,
        institucion,
        goce_remuneraciones,
        comentarios
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, numero_expediente, tipo, descripcion as motivo, fecha_inicio, fecha_fin, estado, archivo_url, created_at, celular, correo, cargo, institucion, goce_remuneraciones, comentarios`,
      [
        userCheck.user.id,
        data.tipo,
        data.motivo,
        data.fechaInicio,
        data.fechaFin,
        "pendiente",
        archivoUrl,
        numeroExpediente,
        data.celular,
        data.correo,
        data.cargo,
        data.institucion,
        data.goceRemuneraciones,
        data.comentarios || ""
      ]
    )
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Error al crear solicitud" }, { status: 500 })
    }

    const solicitudCreada = result.rows[0]

    await query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje)
       VALUES ($1, $2, $3)`,
      [
        userCheck.user.id,
        "Solicitud creada",
        `Tu solicitud #${solicitudCreada.id} ha sido creada y está pendiente de revisión.`
      ]
    )

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
        rutaAdjunto: solicitudCreada.archivo_url
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

    const params: any[] = []
    const conditions: string[] = []

    let sqlQuery = `
      SELECT 
        s.id, 
        s.numero_expediente, 
        s.tipo, 
        s.descripcion, 
        s.fecha_inicio, 
        s.fecha_fin,
        s.estado, 
        s.created_at, 
        s.updated_at,
        s.celular,
        s.correo,
        s.cargo,
        s.institucion,
        s.goce_remuneraciones,
        s.comentarios,
        s.archivo_url,
        u.id as usuario_id, 
        u.nombre as usuario_nombre, 
        u.departamento as usuario_departamento
      FROM solicitudes s
      JOIN usuarios u ON s.usuario_id = u.id
    `

    if (userCheck.user.role !== "admin") {
      conditions.push(`s.usuario_id = $${params.length + 1}`)
      params.push(userCheck.user.id)
    }

    if (estado) {
      conditions.push(`s.estado = $${params.length + 1}`)
      params.push(estado)
    }

    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ")
    }

    sqlQuery += " ORDER BY s.created_at DESC"

    const result = await query(sqlQuery, params)

    if (!result) {
      return NextResponse.json({ message: "Error al obtener solicitudes" }, { status: 500 })
    }

    const solicitudes = result.rows.map((s) => ({
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
        nombre: s.usuario_nombre,
        departamento: s.usuario_departamento,
      } : undefined
    }))

    return NextResponse.json({ solicitudes })

  } catch (error) {
    console.error("Error al obtener solicitudes:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
