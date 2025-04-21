import { NextResponse } from "next/server"
// Eliminar la importación directa de cookies

export async function POST() {
  try {
    // Crear headers con la cookie de expiración
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    
    // Eliminar la cookie de autenticación usando Set-Cookie header
    // Establecer una fecha expirada (en el pasado) para eliminar la cookie
    headers.append(
      'Set-Cookie', 
      'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
    
    // Crear respuesta con los headers que incluyen la cookie expirada
    const response = new NextResponse(
      JSON.stringify({ message: "Sesión cerrada exitosamente" }),
      {
        status: 200,
        headers: headers
      }
    )

    return response
  } catch (error) {
    console.error("Error en logout:", error)
    return NextResponse.json({ message: "Error al cerrar sesión" }, { status: 500 })
  }
}
