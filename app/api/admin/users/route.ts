import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { verifyAdmin } from "@/lib/auth";

// POST: Crear nuevo usuario
export async function POST(request: Request) {
  try {
    // Verificar que el usuario sea un admin
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status });
    }

    // Obtener los datos del usuario desde el body de la solicitud
    const userData = await request.json();

    // Validar que los campos obligatorios estén presentes
    if (!userData.name || !userData.email || !userData.password || !userData.contractTypeId || !userData.careerLevelId) {
      return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Verificar si el correo electrónico ya está registrado
    const existingUser = await query("SELECT id FROM usuarios WHERE email = $1", [userData.email]);
    if (existingUser.rowCount > 0) {
      return NextResponse.json({ message: "El correo electrónico ya está registrado" }, { status: 400 });
    }

    // Verificar si el tipo de contrato existe y obtener si permite vacaciones
    const contractTypeCheck = await query(
      "SELECT permite_vacaciones FROM tipos_contrato WHERE id = $1",
      [userData.contractTypeId]
    );
    if (contractTypeCheck.rowCount === 0) {
      return NextResponse.json({ message: "Tipo de contrato inválido" }, { status: 400 });
    }

    const permiteVacaciones = contractTypeCheck.rows[0].permite_vacaciones;

    // Si el tipo de contrato permite vacaciones, asegurarse de que se haya adjuntado el archivo de contrato
    if (permiteVacaciones && !userData.contractFile) {
      return NextResponse.json({ message: "Debe adjuntar el archivo de contrato para este tipo de contrato" }, { status: 400 });
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = await userData.password;

    // Insertar el nuevo usuario en la base de datos
    const result = await query(
      `INSERT INTO usuarios 
        (nombre, email, password, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, nombre, email, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id`,
      [
        userData.name,
        userData.email,
        hashedPassword,
        userData.department || null,
        userData.role || "user", // Si no se especifica rol, se asigna "user" por defecto
        userData.isActive !== undefined ? userData.isActive : true,
        userData.phone || null,
        userData.position || null,
        userData.contractFile || null,
        userData.contractTypeId,
        userData.careerLevelId,
      ]
    );

    return NextResponse.json({
      user: result.rows[0],
      message: "Usuario creado exitosamente",
    }, { status: 201 });

  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}

// GET: Obtener la lista de usuarios
export async function GET(request: Request) {
  try {
    // Verificar que el usuario sea un admin
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json({ message: adminCheck.message }, { status: adminCheck.status });
    }

    // Obtener la lista de usuarios desde la base de datos
    const result = await query(
      `SELECT u.id, u.nombre, u.email, u.departamento, u.rol, u.activo, u.telefono, u.cargo, u.contrato_url, 
              tc.nombre AS tipo_contrato, tc.permite_vacaciones, 
              nc.nombre AS nivel_carrera
       FROM usuarios u
       LEFT JOIN tipos_contrato tc ON u.tipo_contrato_id = tc.id
       LEFT JOIN niveles_carrera nc ON u.nivel_carrera_id = nc.id
       ORDER BY u.nombre`
    );

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.nombre,
      email: user.email,
      department: user.departamento,
      role: user.rol,
      status: user.activo ? "active" : "inactive",
      phone: user.telefono,
      position: user.cargo,
      contractFile: user.contrato_url,
      contractType: user.tipo_contrato,
      allowsVacations: user.permite_vacaciones,
      careerLevel: user.nivel_carrera,
    }));

    return NextResponse.json({ users });

  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
