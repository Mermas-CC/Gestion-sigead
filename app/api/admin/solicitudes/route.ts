// app/api/admin/solicitudes/route.ts (o pages/api/admin/solicitudes.ts para Next.js 12 o anterior)
import { NextResponse } from "next/server"
import { query } from "@/lib/db/postgres"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Solo los administradores pueden ver todas las solicitudes
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    if (userCheck.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")

    // Inicializar los parámetros de búsqueda
    const params: any[] = []
    const conditions: string[] = []

    // Query para obtener todas las solicitudes
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
  u.departamento as usuario_departamento,
  u.contrato_url  -- Aquí agregas la ruta del contrato
FROM solicitudes s
JOIN usuarios u ON s.usuario_id = u.id

    `

    // Si se especifica un estado, filtrar por el estado
    if (estado) {
      conditions.push(`s.estado = $${params.length + 1}`)
      params.push(estado)
    }

    // Agregar condiciones a la query
    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ")
    }

    // Ordenar por fecha de creación
    sqlQuery += " ORDER BY s.created_at DESC"

    const result = await query(sqlQuery, params)

    if (!result) {
      return NextResponse.json({ message: "Error al obtener solicitudes" }, { status: 500 })
    }

    // Mapear resultados
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
      contratoUrl: s.contrato_url,  // Asegúrate de incluir el contrato URL
      usuario: {
        id: s.usuario_id,
        nombre: s.usuario_nombre,
        departamento: s.usuario_departamento,
      }
    }))
    

    return NextResponse.json({ solicitudes })

  } catch (error) {
    console.error("Error al obtener solicitudes:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
