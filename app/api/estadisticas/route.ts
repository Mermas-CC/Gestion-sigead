import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/auth"
import {
  obtenerEstadisticasGenerales,
  obtenerDatosPorTipoLicencia,
  obtenerDatosPorEstado,
  obtenerDatosPorMes,
} from "@/lib/services/estadisticas-service"
// No importar cookies en el nivel superior

export async function GET(request: Request) {
  try {
    // Importar cookies dentro del manejador de solicitud
    const { cookies } = await import("next/headers")
    // Obtener cookieStore dentro del contexto de la solicitud
    const cookieStore = cookies()
    
    // Verificar que el usuario es administrador, pasando cookieStore
    const adminCheck = await verifyAdmin(request, cookieStore)
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status })
    }

    // Obtener todos los datos de estadísticas
    const [estadisticasGenerales, datosPorTipo, datosPorEstado, datosPorMes] = await Promise.all([
      obtenerEstadisticasGenerales(),
      obtenerDatosPorTipoLicencia(),
      obtenerDatosPorEstado(),
      obtenerDatosPorMes(),
    ])

    return NextResponse.json({
      estadisticasGenerales,
      datosPorTipo,
      datosPorEstado,
      datosPorMes,
    })
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return NextResponse.json({ 
      message: "Error al obtener estadísticas",
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
