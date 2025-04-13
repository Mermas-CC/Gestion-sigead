import { createClient } from "@supabase/supabase-js"

async function seedUsers() {
  // Crear cliente de Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Verificar si ya existen usuarios
    const { data: existingUsers, error: queryError } = await supabase
      .from("usuarios")
      .select("email")
      .in("email", ["admin@ejemplo.com", "usuario@ejemplo.com"])

    if (queryError) {
      throw queryError
    }

    const existingEmails = existingUsers.map((user) => user.email)

    // Insertar usuario administrador si no existe
    if (!existingEmails.includes("admin@ejemplo.com")) {
      const { error: adminError } = await supabase.from("usuarios").insert([
        {
          nombre: "Administrador",
          email: "admin@ejemplo.com",
          password: "admin123", // En producción, usar bcrypt
          departamento: "IT",
          rol: "admin",
          activo: true,
        },
      ])

      if (adminError) {
        throw adminError
      }
      console.log("Usuario administrador creado")
    } else {
      console.log("Usuario administrador ya existe")
    }

    // Insertar usuario normal si no existe
    if (!existingEmails.includes("usuario@ejemplo.com")) {
      const { error: userError } = await supabase.from("usuarios").insert([
        {
          nombre: "Usuario Normal",
          email: "usuario@ejemplo.com",
          password: "usuario123", // En producción, usar bcrypt
          departamento: "Ventas",
          rol: "user",
          activo: true,
        },
      ])

      if (userError) {
        throw userError
      }
      console.log("Usuario normal creado")
    } else {
      console.log("Usuario normal ya existe")
    }

    console.log("Usuarios de prueba creados exitosamente")
  } catch (error) {
    console.error("Error al crear usuarios de prueba:", error)
  }
}

// Ejecutar la función
seedUsers()
