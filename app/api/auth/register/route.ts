import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

import jwt from "jsonwebtoken"

// En una implementación real, hashearías la contraseña con bcrypt
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Verificar si el email ya existe
    // Crear cliente de Supabase dentro del contexto de la solicitud
    const supabase = await createServerClient()
    
    // Verificar si el email ya existe
    const { data: existingUser, error: existingUserError } = await supabase
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
    const { data, error } = await supabase
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

    // Generar token JWT para el usuario registrado
    const token = jwt.sign(
      {
        id: data.id,
        email: data.email,
        role: data.rol
      },
      process.env.JWT_SECRET || "secret_fallback",
      { expiresIn: "7d" }
    );

    // Crear headers con cookie
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    
    // Establecer cookie de autenticación utilizando Set-Cookie header
    const isSecure = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7; // 7 días
    
    headers.append(
      'Set-Cookie', 
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecure ? '; Secure' : ''}`
    );
    
    console.log('Setting cookie with token:', token);
    console.log('Headers:', headers.get('Set-Cookie'));

    // Crear respuesta con los headers que incluyen la cookie
    return new NextResponse(
      JSON.stringify({
        user: {
          id: data.id,
          name: data.nombre,
          email: data.email,
          role: data.rol,
        },
        message: "Usuario registrado exitosamente",
      }),
      {
        status: 201,
        headers: headers
      }
    )
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ 
      message: "Error en el servidor",
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
