import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// En una implementación real, hashearías la contraseña con bcrypt
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase.from("usuarios").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ message: "El correo electrónico ya está registrado" }, { status: 400 })
    }

    // Insertar nuevo usuario
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nombre: name, email, password, rol: "user" }])
      .select("id, nombre, email, rol")
      .single()

    if (error) {
      console.error("Error al registrar usuario:", error)
      return NextResponse.json({ message: "Error al registrar usuario" }, { status: 500 })
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
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
