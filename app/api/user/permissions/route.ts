import { NextResponse } from "next/server"
import { query } from "@/lib/db/postgres"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ message: "Falta userId" }, { status: 400 })
  }

  try {
    const result = await query(
      `SELECT tc.permite_vacaciones
       FROM usuarios u
       JOIN tipos_contrato tc ON tc.id = u.tipo_contrato_id
       WHERE u.id = $1`,
      [userId]
    )

    if (!result || result.rowCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado o sin tipo de contrato válido" }, { status: 404 })
    }

    const puedeSolicitarVacaciones = result.rows[0].permite_vacaciones

    return NextResponse.json({ puedeSolicitarVacaciones })
  } catch (error) {
    console.error("Error al verificar permisos del usuario:", error)
    return NextResponse.json({ message: "Error del servidor" }, { status: 500 })
  }
}
