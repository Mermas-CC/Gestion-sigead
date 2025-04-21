import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ message: "Falta userId" }, { status: 400 })
  }

  try {
    // Primero verificamos si el usuario existe y obtenemos su tipo_contrato_id
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, tipo_contrato_id')
      .eq('id', userId)
      .single()
    
    if (userError || !userData) {
      console.error("Error al obtener usuario:", userError || "Usuario no encontrado")
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }
    
    if (!userData.tipo_contrato_id) {
      // Si el usuario no tiene tipo de contrato, por defecto no puede solicitar vacaciones
      return NextResponse.json({ puedeSolicitarVacaciones: false })
    }
    
    // Luego consultamos el tipo de contrato para obtener el permiso
    const { data: contractData, error: contractError } = await supabase
      .from('tipos_contrato')
      .select('permite_vacaciones')
      .eq('id', userData.tipo_contrato_id)
      .single()
    
    if (contractError || !contractData) {
      console.error("Error al obtener tipo de contrato:", contractError || "Tipo de contrato no encontrado")
      // Si no se encuentra el tipo de contrato, por defecto no puede solicitar vacaciones
      return NextResponse.json({ puedeSolicitarVacaciones: false })
    }
    
    const puedeSolicitarVacaciones = contractData.permite_vacaciones

    return NextResponse.json({ puedeSolicitarVacaciones })
  } catch (error) {
    console.error("Error al verificar permisos del usuario:", error)
    return NextResponse.json({ 
      message: "Error del servidor",
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
