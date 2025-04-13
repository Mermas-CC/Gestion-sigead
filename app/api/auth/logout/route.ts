import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const response = new NextResponse(
      JSON.stringify({ message: "Sesión cerrada exitosamente" }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    // Eliminar la cookie de autenticación
    response.cookies.set("auth_token", "", {
      expires: new Date(0),
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error en logout:", error)
    return NextResponse.json({ message: "Error al cerrar sesión" }, { status: 500 })
  }
}
