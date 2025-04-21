import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Obtener lista de usuarios
export async function GET() {
  try {
    // Obtener todos los usuarios de la base de datos con Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id');

    if (error) {
      console.error("Error al obtener usuarios:", error);
      return NextResponse.json({ message: "Error al obtener usuarios" }, { status: 500 });
    }

    return NextResponse.json({ users: data });
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

    // Verificar si el correo electrónico ya está registrado con Supabase
    const { data: existingUser, error: emailCheckError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailCheckError) {
      console.error("Error al verificar email:", emailCheckError);
      return NextResponse.json({ message: "Error al verificar disponibilidad del email" }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ message: "El correo electrónico ya está registrado" }, { status: 400 });
    }

    // Verificar si el tipo de contrato existe y obtener si permite vacaciones con Supabase
    const { data: contractTypeData, error: contractTypeError } = await supabase
      .from('tipos_contrato')
      .select('permite_vacaciones')
      .eq('id', contractTypeId)
      .single();

    if (contractTypeError || !contractTypeData) {
      return NextResponse.json({ message: "Tipo de contrato inválido" }, { status: 400 });
    }

    const permiteVacaciones = contractTypeData.permite_vacaciones;

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
    // Insertar el nuevo usuario en la base de datos con Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert({
        nombre: name,
        email: email,
        password: hashedPassword,
        dni: dni,
        departamento: department,
        rol: role === "admin" ? "admin" : "user",
        activo: isActive,
        telefono: phone,
        cargo: position,
        contrato_url: contractUrl,
        tipo_contrato_id: contractTypeId,
        nivel_carrera_id: careerLevelId
      })
      .select('id, nombre, email, dni, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id')
      .single();

    if (insertError) {
      console.error("Error al crear usuario:", insertError);
      return NextResponse.json({ message: "Error al crear usuario en la base de datos" }, { status: 500 });
    }

    return NextResponse.json({
      user: newUser,
      message: "Usuario creado exitosamente",
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
