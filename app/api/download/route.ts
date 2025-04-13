import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getFileUrl } from "@/lib/upload"

export async function GET(request: Request) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const ruta = searchParams.get("ruta")

    if (!ruta) {
      return NextResponse.json({ message: "Ruta del archivo requerida" }, { status: 400 })
    }

    const url = await getFileUrl(ruta)

    // Redireccionar al archivo
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Error al descargar archivo:", error)
    return NextResponse.json({ message: "Error al descargar archivo" }, { status: 500 })
  }
}
