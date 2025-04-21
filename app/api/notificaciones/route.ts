import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"

export async function GET(request: Request) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    if (!userCheck.user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener notificaciones del usuario usando Supabase
    const { data, error } = await supabase
      .from('notificaciones')
      .select('id, titulo, mensaje, leida, created_at')
      .eq('usuario_id', userCheck.user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("Error al obtener notificaciones:", error)
      return NextResponse.json({ message: "Error al obtener notificaciones" }, { status: 500 })
    }

    const notificaciones = data.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      mensaje: n.mensaje,
      leida: n.leida,
      fechaCreacion: n.created_at,
    }))

    return NextResponse.json({ notificaciones })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const { id, leida } = await request.json()
    // Si se proporciona un ID, marcar esa notificación como leída
    if (!userCheck.user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    if (id) {
      // Actualizar una notificación específica con Supabase
      const { data, error } = await supabase
        .from('notificaciones')
        .update({ leida: leida !== undefined ? leida : true })
        .eq('id', id)
        .eq('usuario_id', userCheck.user.id)
        .select('id')
      
      if (error || !data || data.length === 0) {
        console.error("Error al actualizar notificación:", error)
        return NextResponse.json({ message: "Error al actualizar notificación" }, { status: 500 })
      }

      return NextResponse.json({ message: "Notificación actualizada" })
    }
    // Si no se proporciona ID, marcar todas como leídas
    else {
      if (!userCheck.user) {
        return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
      }

      // Actualizar todas las notificaciones no leídas del usuario con Supabase
      const { data, error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', userCheck.user.id)
        .eq('leida', false)
        .select('id')
      
      if (error) {
        console.error("Error al actualizar notificaciones:", error)
        return NextResponse.json({ message: "Error al actualizar notificaciones" }, { status: 500 })
      }

      return NextResponse.json({ message: "Todas las notificaciones marcadas como leídas" })
    }
  } catch (error) {
    console.error("Error al actualizar notificaciones:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
