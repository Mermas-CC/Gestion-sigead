import { createAnonymousClient } from "@/lib/supabase/server"

// Create a single instance of the anonymous client for all statistics operations
// This doesn't use cookies, so it's safe to use during build time
const supabase = createAnonymousClient()

export async function obtenerEstadisticasGenerales() {
  try {

    // Total de solicitudes
    const { count: totalSolicitudes, error: errorTotal } = await supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })

    if (errorTotal) throw errorTotal

    // Solicitudes pendientes
    const { count: pendientes, error: errorPendientes } = await supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente")

    if (errorPendientes) throw errorPendientes

    // Solicitudes aprobadas
    const { count: aprobadas, error: errorAprobadas } = await supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })
      .eq("estado", "aprobada")

    if (errorAprobadas) throw errorAprobadas

    // Solicitudes rechazadas
    const { count: rechazadas, error: errorRechazadas } = await supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })
      .eq("estado", "rechazada")

    if (errorRechazadas) throw errorRechazadas

    // Solicitudes con goce
    const { count: conGoce, error: errorConGoce } = await supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })
      .eq("goce_remuneraciones", true)

    if (errorConGoce) throw errorConGoce

    // Solicitudes sin goce
    const { count: sinGoce, error: errorSinGoce } = await supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })
      .eq("goce_remuneraciones", false)

    if (errorSinGoce) throw errorSinGoce

    return {
      totalSolicitudes: totalSolicitudes || 0,
      pendientes: pendientes || 0,
      aprobadas: aprobadas || 0,
      rechazadas: rechazadas || 0,
      conGoce: conGoce || 0,
      sinGoce: sinGoce || 0,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas generales:", error)
    throw error
  }
}

export async function obtenerDatosPorTipoLicencia() {
  try {
    const { data, error } = await supabase.from("solicitudes").select("tipo, goce_remuneraciones")

    if (error) throw error

    // Procesar los datos para agruparlos por tipo de licencia
    const tiposLicencia: Record<string, number> = {}

    data.forEach((solicitud) => {
      const tipo = solicitud.tipo || "sin_especificar"
      tiposLicencia[tipo] = (tiposLicencia[tipo] || 0) + 1
    })

    // Convertir a formato para gráficos
    return Object.entries(tiposLicencia).map(([tipo, cantidad]) => {
      // Mapear los tipos de licencia a nombres más legibles
      const nombresTipos: Record<string, string> = {
        incapacidad: "Incapacidad",
        familiar_grave: "Familiar grave",
        maternidad: "Maternidad",
        prenatal: "Prenatal",
        estudios: "Estudios",
        representacion: "Representación",
        medica: "Médica",
        particulares: "Particulares",
        capacitacion_no_oficial: "Capacitación",
        enfermedad_familiar: "Enfermedad familiar",
        varios: "Varios",
        sin_especificar: "Sin especificar",
      }

      return {
        nombre: nombresTipos[tipo] || tipo,
        cantidad,
      }
    })
  } catch (error) {
    console.error("Error al obtener datos por tipo de licencia:", error)
    throw error
  }
}

export async function obtenerDatosPorEstado() {
  try {
    const { data, error } = await supabase.from("solicitudes").select("estado")

    if (error) throw error

    // Procesar los datos para agruparlos por estado
    const estados: Record<string, number> = {}

    data.forEach((solicitud) => {
      const estado = solicitud.estado || "sin_estado"
      estados[estado] = (estados[estado] || 0) + 1
    })

    // Convertir a formato para gráficos
    return Object.entries(estados).map(([estado, cantidad]) => {
      // Mapear los estados a nombres más legibles
      const nombresEstados: Record<string, string> = {
        pendiente: "Pendiente",
        aprobada: "Aprobada",
        rechazada: "Rechazada",
        correccion: "Corrección",
        sin_estado: "Sin estado",
      }

      return {
        nombre: nombresEstados[estado] || estado,
        cantidad,
      }
    })
  } catch (error) {
    console.error("Error al obtener datos por estado:", error)
    throw error
  }
}

export async function obtenerDatosPorMes() {
  try {
    const { data, error } = await supabase.from("solicitudes").select("created_at, goce_remuneraciones")

    if (error) throw error

    // Procesar los datos para agruparlos por mes
    const meses: Record<string, { conGoce: number; sinGoce: number }> = {}

    data.forEach((solicitud) => {
      const fecha = new Date(solicitud.created_at)
      const mes = fecha.toLocaleString("es-ES", { month: "short" })

      if (!meses[mes]) {
        meses[mes] = { conGoce: 0, sinGoce: 0 }
      }

      if (solicitud.goce_remuneraciones) {
        meses[mes].conGoce++
      } else {
        meses[mes].sinGoce++
      }
    })

    // Convertir a formato para gráficos
    return Object.entries(meses).map(([mes, datos]) => ({
      mes,
      conGoce: datos.conGoce,
      sinGoce: datos.sinGoce,
    }))
  } catch (error) {
    console.error("Error al obtener datos por mes:", error)
    throw error
  }
}
