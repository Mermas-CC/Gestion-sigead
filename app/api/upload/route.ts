import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    // Verificar usuario autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    // Obtener los datos del formulario
    const formData = await request.formData()
    const file = formData.get("file") as File
    const tipo = formData.get("tipo") as string

    // Validación de que el archivo y tipo existan
    if (!file || !tipo) {
      return NextResponse.json({ message: "Archivo y tipo son requeridos" }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/\s+/g, "_") // Reemplazar espacios por guiones bajos
    const filename = `${tipo}_${userCheck.user.id}_${timestamp}_${sanitizedFilename}`

    // Ruta para almacenar el archivo
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, filename)

    // Convertir el archivo en un buffer y guardarlo en el directorio
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Escribir el archivo en el disco
    await writeFile(filePath, buffer)

    // Generar URL accesible públicamente
    const url = `/uploads/${filename}`

    // Devolver la URL y el nombre del archivo en la respuesta
    return NextResponse.json({ url, filename, message: "Archivo subido exitosamente" })
  } catch (error) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json({ message: "Error al subir archivo", error: error.message }, { status: 500 })
  }
}
