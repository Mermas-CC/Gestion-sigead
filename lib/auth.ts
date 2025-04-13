import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { query } from "./db/postgres"

// Verificar token JWT
export async function verifyToken(request: Request) {
  try {
    // Obtener token de las cookies o del header Authorization
    let token: string | undefined

    // Primero intentar obtener de las cookies
    const cookieStore = await cookies()
    console.log('All cookies:', cookieStore.getAll())
    
    const authCookie = cookieStore.get("auth_token")
    console.log('Auth cookie:', authCookie)
    token = authCookie?.value

    // Si no hay token en las cookies, intentar obtener del header Authorization
    if (!token) {
      console.log('No token in cookies, checking Authorization header')
      const authHeader = request.headers.get("Authorization")
      console.log('Authorization header:', authHeader)
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      }
    }

    console.log('Final token found:', token)

    if (!token) {
      return { success: false, message: "No autorizado", status: 401 }
    }

    // Verificar token de cookie
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_fallback") as jwt.JwtPayload
      console.log('Decoded token:', decoded)

      // Verificar que el token tenga la estructura esperada
      if (!decoded || typeof decoded !== 'object' || !decoded.role) {
        console.error('Token inválido: falta información de rol')
        return { success: false, message: "Token inválido", status: 401 }
      }

      return { success: true, user: decoded }
    } catch (error) {
      return { success: false, message: "Token inválido", status: 401 }
    }
  } catch (error) {
    console.error("Error verificando token:", error)
    return { success: false, message: "Error en el servidor", status: 500 }
  }
}

// Verificar si el usuario es administrador
export async function verifyAdmin(request: Request) {
  const tokenCheck = await verifyToken(request)

  if (!tokenCheck.success) {
    return tokenCheck
  }

  console.log('Checking admin role:', { userRole: tokenCheck.user.role })
  
  if (!tokenCheck.user || tokenCheck.user.role !== "admin") {
    return { success: false, message: "Acceso denegado", status: 403 }
  }

  return tokenCheck
}

// Obtener usuario actual
export async function getCurrentUser(request: Request) {
  const tokenCheck = await verifyToken(request)

  if (!tokenCheck.success) {
    return { success: false, message: tokenCheck.message, status: tokenCheck.status }
  }

  try {
    const result = await query(
      "SELECT id, nombre, email, departamento, rol, activo FROM usuarios WHERE id = $1",
      [tokenCheck.user.id]
    )

    if (result.rowCount === 0) {
      return { success: false, message: "Usuario no encontrado", status: 404 }
    }

    const user = result.rows[0]

    return {
      success: true,
      user: {
        id: user.id,
        name: user.nombre,
        email: user.email,
        department: user.departamento,
        role: user.rol,
        isActive: user.activo,
      },
    }
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error)
    return { success: false, message: "Error en el servidor", status: 500 }
  }
}
