import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase"

// En una implementación real, hashearías la contraseña con bcrypt
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Verificar si el email ya existe
    const { data: existingUser, error: existingUserError } = await supabaseServer
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error("Error al verificar usuario existente:", existingUserError)
      return NextResponse.json({ message: "Error al verificar registro" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ message: "El correo electrónico ya está registrado" }, { status: 400 })
    }

    // Insertar nuevo usuario
    const { data, error } = await supabaseServer
      .from("usuarios")
      .insert([{ 
        nombre: name, 
        email, 
        password, // En producción, hashear la contraseña
        rol: "user",
        activo: true,
        fecha_creacion: new Date().toISOString()
      }])
      .select("id, nombre, email, rol")
      .single()

    if (error) {
      console.error("Error al registrar usuario:", error)
      return NextResponse.json({ 
        message: "Error al registrar usuario", 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json(
      {
        user: {
          id: data.id,
          name: data.nombre,
          email: data.email,
          role: data.rol,
        },
        message: "Usuario registrado exitosamente",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ 
      message: "Error en el servidor",
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
