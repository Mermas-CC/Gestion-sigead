import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabaseClient"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    console.log('Login attempt:', { email })
    console.log('Login attempt:', { email })

    // Buscar usuario en la base de datos usando Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol')
      .eq('email', email)
      .eq('password', password)
      .eq('activo', true)
      .single()

    console.log('Query result:', { data: data ? 'found' : 'not found', error: error?.message })

    if (!data || error) {
      return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 })
    }
    const user = data
    console.log('User found:', { id: user.id, email: user.email, rol: user.rol })

    // Crear token JWT
    const tokenData = { id: user.id, email: user.email, role: user.rol }
    // Asegurarnos de que el rol está presente
    if (!tokenData.role) {
      console.error('Role missing in token data')
      return NextResponse.json({ message: "Error en la configuración del usuario" }, { status: 500 })
    }
    console.log('Token data:', tokenData)

    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET || "secret_fallback",
      { expiresIn: "1d" }
    )

    // Crear la respuesta con el token
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    headers.append('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24}`)

    console.log('Setting cookie with token:', token)
    console.log('Headers:', headers.get('Set-Cookie'))

    const response = new NextResponse(
      JSON.stringify({
        user: {
          id: user.id,
          name: user.nombre,
          email: user.email,
          role: user.rol,
        },
        message: "Inicio de sesión exitoso",
      }),
      {
        status: 200,
        headers: headers
      }
    )

    return response

  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 })
  }
}
