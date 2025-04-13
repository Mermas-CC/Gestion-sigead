import { createServerClient } from "./supabase/server"
import { v4 as uuidv4 } from "uuid"

export async function uploadFile(file: File, tipo: string, userId: string) {
  try {
    const supabase = createServerClient()

    // Generar un nombre único para el archivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${tipo}/${userId}/${fileName}`

    // Subir el archivo a Supabase Storage
    const { data, error } = await supabase.storage.from("archivos").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw error
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage.from("archivos").getPublicUrl(filePath)

    // Registrar el archivo en la base de datos
    const { error: dbError } = await supabase.from("archivos").insert([
      {
        usuario_id: userId,
        nombre: file.name,
        tipo,
        ruta: filePath,
      },
    ])

    if (dbError) {
      throw dbError
    }

    return {
      ruta: filePath,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error("Error al subir archivo:", error)
    throw error
  }
}

export async function getFileUrl(ruta: string) {
  try {
    const supabase = createServerClient()

    const { data } = supabase.storage.from("archivos").getPublicUrl(ruta)

    return data.publicUrl
  } catch (error) {
    console.error("Error al obtener URL del archivo:", error)
    throw error
  }
}
