import type { ReadonlyRequestCookies } from "next/headers"
import jwt from "jsonwebtoken"
import { supabase } from "./supabaseClient"

/**
 * Verificar token JWT
 * @param request - La solicitud HTTP
 * @param cookieStore - Store de cookies pasado desde el contexto de la ruta API
 * 
 * IMPORTANTE: Para usar esta función en API routes, siempre pasa el cookieStore:
 * ```
 * import { cookies } from 'next/headers'
 * 
 * export async function GET(request) {
 *   const cookieStore = cookies()
 *   const auth = await verifyToken(request, cookieStore)
 *   // ...
 * }
 * ```
 */
export async function verifyToken(request: Request, cookieStore?: ReadonlyRequestCookies) {
  try {
    // Obtener token de las cookies o del header Authorization
    let token: string | undefined

    // Primero intentar obtener de las cookies si tenemos acceso a ellas
    if (cookieStore) {
      console.log('Using provided cookieStore')
      console.log('All cookies:', cookieStore.getAll())
      
      const authCookie = cookieStore.get("auth_token")
      console.log('Auth cookie:', authCookie)
      token = authCookie?.value
    } else {
      console.log('No cookieStore provided, skipping cookie check')
    }

    // Si no hay token en las cookies, intentar obtener del header Authorization
    if (!token) {
      console.log('No token in cookies, checking Authorization header')
      const authHeader = request.headers.get("Authorization")
      console.log('Authorization header:', authHeader)
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      }
    }
    console.log('Final token found:', token ? 'yes' : 'no')

    if (!token) {
      return { success: false, message: "No autorizado", status: 401 }
    }

    // Verificar token JWT
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

/**
 * Verificar si el usuario es administrador
 * @param request - La solicitud HTTP
 * @param cookieStore - Store de cookies pasado desde el contexto de la ruta API
 */
export async function verifyAdmin(request: Request, cookieStore?: ReadonlyRequestCookies) {
  const tokenCheck = await verifyToken(request, cookieStore)

  if (!tokenCheck.success) {
    return tokenCheck
  }

  console.log('Checking admin role:', { userRole: tokenCheck.user.role })
  
  if (!tokenCheck.user || tokenCheck.user.role !== "admin") {
    return { success: false, message: "Acceso denegado", status: 403 }
  }

  return tokenCheck
}

/**
 * Obtener usuario actual
 * @param request - La solicitud HTTP
 * @param cookieStore - Store de cookies pasado desde el contexto de la ruta API
 */
export async function getCurrentUser(request: Request, cookieStore?: ReadonlyRequestCookies) {
  const tokenCheck = await verifyToken(request, cookieStore)

  if (!tokenCheck.success) {
    return { success: false, message: tokenCheck.message, status: tokenCheck.status }
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, departamento, rol, activo')
      .eq('id', tokenCheck.user.id)
      .single()

    if (error || !data) {
      return { success: false, message: "Usuario no encontrado", status: 404 }
    }

    const user = data

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
