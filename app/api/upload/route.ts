import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { uploadFile } from "@/lib/upload"

export async function POST(request: Request) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const tipo = formData.get("tipo") as string

    if (!file || !tipo) {
      return NextResponse.json({ message: "Archivo y tipo son requeridos" }, { status: 400 })
    }

    const result = await uploadFile(file, tipo, userCheck.user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json({ message: "Error al subir archivo" }, { status: 500 })
  }
}
