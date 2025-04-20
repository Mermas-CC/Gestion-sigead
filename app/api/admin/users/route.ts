import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Obtener lista de usuarios
export async function GET() {
  try {
    // Obtener todos los usuarios de la base de datos
    const result = await query("SELECT id, nombre, email, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id FROM usuarios");

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ message: "Error al obtener usuarios" }, { status: 500 });
  }
}

// POST: Crear nuevo usuario (registro público o admin)
export async function POST(request: Request) {
  try {
    // Procesar formulario multipart/form-data
    const formData = await request.formData();

    // Extraer campos del formulario
    const name = formData.get("name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const dni = formData.get("dni")?.toString() || ""; // <-- Añadido
    const department = formData.get("department")?.toString() || null;
    // Si viene desde el panel admin, puede venir el rol y activo, si no, por defecto
    const role = (formData.get("role")?.toString() || "user").toLowerCase();
    const isActive = formData.has("isActive") ? formData.get("isActive") === "true" : true;
    const phone = formData.get("phone")?.toString() || null;
    const position = formData.get("position")?.toString() || null;
    const contractTypeId = formData.get("contractTypeId")?.toString() || "";
    const careerLevelId = formData.get("careerLevelId")?.toString() || "";
    const contractFile = formData.get("contractFile") as File | null;

    // Validar campos obligatorios
    if (!name || !email || !password || !dni || !contractTypeId || !careerLevelId) {
      return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Verificar si el correo electrónico ya está registrado
    const existingUser = await query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existingUser.rowCount > 0) {
      return NextResponse.json({ message: "El correo electrónico ya está registrado" }, { status: 400 });
    }

    // Verificar si el tipo de contrato existe y obtener si permite vacaciones
    const contractTypeCheck = await query(
      "SELECT permite_vacaciones FROM tipos_contrato WHERE id = $1",
      [contractTypeId]
    );
    if (contractTypeCheck.rowCount === 0) {
      return NextResponse.json({ message: "Tipo de contrato inválido" }, { status: 400 });
    }

    const permiteVacaciones = contractTypeCheck.rows[0].permite_vacaciones;

    // Si el tipo de contrato permite vacaciones, asegurarse de que se haya adjuntado el archivo de contrato
    if (permiteVacaciones && !contractFile) {
      return NextResponse.json({ message: "Debe adjuntar el archivo de contrato para este tipo de contrato" }, { status: 400 });
    }

    // Guardar el archivo en public/uploads si se proporciona
    let contractUrl = null;
    if (contractFile) {
      const buffer = Buffer.from(await contractFile.arrayBuffer());
      const filename = `${Date.now()}_${contractFile.name.replace(/\s+/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      // Asegurarse de que el directorio exista
      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      contractUrl = `/uploads/${filename}`;
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = password;

    // Insertar el nuevo usuario en la base de datos
    const result = await query(
      `INSERT INTO usuarios 
         (nombre, email, password, dni, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id)
       VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, nombre, email, dni, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id`,
      [
        name,
        email,
        hashedPassword,
        dni, // <-- Añadido
        department,
        // Si el registro es público, siempre "user"
        role === "admin" ? "admin" : "user",
        isActive,
        phone,
        position,
        contractUrl,
        contractTypeId,
        careerLevelId,
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
