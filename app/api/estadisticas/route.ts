import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/auth"
import {
  obtenerEstadisticasGenerales,
  obtenerDatosPorTipoLicencia,
  obtenerDatosPorEstado,
  obtenerDatosPorMes,
} from "@/lib/services/estadisticas-service"

export async function GET(request: Request) {
  try {
    // Verificar que el usuario es administrador
    const adminCheck = await verifyAdmin(request)
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
    return NextResponse.json({ message: "Error al obtener estadísticas" }, { status: 500 })
  }
}
