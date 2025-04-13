import { NextResponse } from "next/server"
import { query } from "@/lib/db/postgres"
import { verifyAdmin } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    console.log('Verifying admin access for user creation')
    const adminCheck = await verifyAdmin(request)
    console.log('Admin check result:', { success: adminCheck.success, message: adminCheck.message })
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status })
    }

    const userData = await request.json()

    if (!userData.name || !userData.email || !userData.password) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Check if email exists
    const existingUser = await query(
      "SELECT id FROM usuarios WHERE email = $1",
      [userData.email]
    )

    if (existingUser.rowCount > 0) {
      return NextResponse.json(
        { message: "El correo electrónico ya está registrado" },
        { status: 400 }
      )
    }

    // Insert new user
    const result = await query(
      `INSERT INTO usuarios (nombre, email, password, departamento, rol, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, email, departamento, rol, activo`,
      [
        userData.name,
        userData.email,
        userData.password,
        userData.department || null,
        userData.role || "user",
        userData.isActive !== undefined ? userData.isActive : true,
      ]
    )

    const newUser = result.rows[0]

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          name: newUser.nombre,
          email: newUser.email,
          department: newUser.departamento,
          role: newUser.rol,
          isActive: newUser.activo,
        },
        message: "Usuario creado exitosamente",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status })
    }

    const result = await query(
      "SELECT id, nombre, email, departamento, rol, activo FROM usuarios ORDER BY nombre"
    )

    const users = result.rows.map((user) => ({
      id: user.id,
      name: user.nombre,
      email: user.email,
      department: user.departamento,
      role: user.rol,
      status: user.activo ? "active" : "inactive",
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    )
  }
}
