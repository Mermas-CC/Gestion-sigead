import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Obtener un usuario por ID
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    // Buscar usuario con Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener usuario" }, { status: 500 });
  }
}

// PATCH: Editar usuario
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const formData = await request.formData();

    // Extraer campos del formulario
    const name = formData.get("name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const dni = formData.get("dni")?.toString() || "";
    const department = formData.get("department")?.toString() || null;
    const role = (formData.get("role")?.toString() || "user").toLowerCase();
    const isActive = formData.has("isActive") ? formData.get("isActive") === "true" : true;
    const phone = formData.get("phone")?.toString() || null;
    const position = formData.get("position")?.toString() || null;
    const contractTypeId = formData.get("contractTypeId")?.toString() || "";
    const careerLevelId = formData.get("careerLevelId")?.toString() || "";
    const contractFile = formData.get("contractFile") as File | null;

    // Validar campos obligatorios
    if (!name || !email || !dni || !contractTypeId || !careerLevelId) {
      return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Guardar el archivo en public/uploads si se proporciona
    let contractUrl = null;
    if (contractFile && contractFile.size > 0) {
      const buffer = Buffer.from(await contractFile.arrayBuffer());
      const filename = `${Date.now()}_${contractFile.name.replace(/\s+/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      contractUrl = `/uploads/${filename}`;
    }

    // Preparar objeto de actualización para Supabase
    const updateData: any = {
      nombre: name,
      email: email,
      dni: dni,
      departamento: department,
      rol: role === "admin" ? "admin" : "user",
      activo: isActive,
      telefono: phone,
      cargo: position,
      tipo_contrato_id: contractTypeId,
      nivel_carrera_id: careerLevelId
    };

    // Añadir campo de URL de contrato si se subió un archivo
    if (contractUrl) {
      updateData.contrato_url = contractUrl;
    }

    // Añadir campo de contraseña si se proporcionó una nueva
    if (password) {
      updateData.password = password;
    }

    // Actualizar usuario con Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select('id, nombre, email, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id')
      .single();

    
    if (error || !data) {
      console.error("Error al actualizar usuario:", error);
      return NextResponse.json({ message: "Usuario no encontrado o error al actualizar" }, { status: 404 });
    }

    return NextResponse.json({ user: data, message: "Usuario actualizado exitosamente" });
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar usuario" }, { status: 500 });
  }
}

// DELETE: Eliminar usuario
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    // Eliminar usuario con Supabase
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error al eliminar usuario:", error);
      return NextResponse.json({ message: "Usuario no encontrado o error al eliminar" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar usuario" }, { status: 500 });
  }
}
