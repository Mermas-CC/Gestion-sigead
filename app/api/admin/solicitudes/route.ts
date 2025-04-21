// app/api/admin/solicitudes/route.ts (o pages/api/admin/solicitudes.ts para Next.js 12 o anterior)
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Solo los administradores pueden ver todas las solicitudes
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    if (!userCheck.user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    if (userCheck.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")

    // Inicializar los parámetros de búsqueda
    const params: any[] = []
    const conditions: string[] = []

    // Preparar la consulta con Supabase
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
          departamento,
          contrato_url
        )
      `)
      .order('created_at', { ascending: false })

    // Si se especifica un estado, filtrar por el estado
    if (estado) {
      query = query.eq('estado', estado)
    }

    // Ejecutar la consulta
    const { data: solicitudesData, error } = await query

    if (error) {
      console.error("Error al obtener solicitudes:", error)
      return NextResponse.json({ message: "Error al obtener solicitudes" }, { status: 500 })
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
      contratoUrl: s.usuarios?.[0]?.contrato_url,  // <-- Corregido
      usuario: {
        id: s.usuario_id,
        nombre: s.usuarios?.[0]?.nombre,           // <-- Corregido
        departamento: s.usuarios?.[0]?.departamento, // <-- Corregido
      }
    }))
    

    return NextResponse.json({ solicitudes })

  } catch (error) {
    console.error("Error al obtener solicitudes:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
