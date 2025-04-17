import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Obtener un usuario por ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await query(
      "SELECT id, nombre, email, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id FROM usuarios WHERE id = $1",
      [params.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener usuario" }, { status: 500 });
  }
}

// PATCH: Editar usuario
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData();

    // Extraer campos del formulario
    const name = formData.get("name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const department = formData.get("department")?.toString() || null;
    const role = (formData.get("role")?.toString() || "user").toLowerCase();
    const isActive = formData.has("isActive") ? formData.get("isActive") === "true" : true;
    const phone = formData.get("phone")?.toString() || null;
    const position = formData.get("position")?.toString() || null;
    const contractTypeId = formData.get("contractTypeId")?.toString() || "";
    const careerLevelId = formData.get("careerLevelId")?.toString() || "";
    const contractFile = formData.get("contractFile") as File | null;

    // Validar campos obligatorios
    if (!name || !email || !contractTypeId || !careerLevelId) {
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

    // Si se proporciona password, actualizarla, si no, mantener la anterior
    let updateFields = [
      "nombre = $1",
      "email = $2",
      "departamento = $3",
      "rol = $4",
      "activo = $5",
      "telefono = $6",
      "cargo = $7",
      "tipo_contrato_id = $8",
      "nivel_carrera_id = $9"
    ];
    let values = [
      name,
      email,
      department,
      role === "admin" ? "admin" : "user",
      isActive,
      phone,
      position,
      contractTypeId,
      careerLevelId
    ];
    let idx = 10;

    if (contractUrl) {
      updateFields.push(`contrato_url = $${idx}`);
      values.push(contractUrl);
      idx++;
    }
    if (password) {
      updateFields.push(`password = $${idx}`);
      values.push(password);
      idx++;
    }

    values.push(params.id);

    const result = await query(
      `UPDATE usuarios SET ${updateFields.join(", ")} WHERE id = $${idx} RETURNING id, nombre, email, departamento, rol, activo, telefono, cargo, contrato_url, tipo_contrato_id, nivel_carrera_id`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0], message: "Usuario actualizado exitosamente" });
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar usuario" }, { status: 500 });
  }
}

// DELETE: Eliminar usuario
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await query("DELETE FROM usuarios WHERE id = $1 RETURNING id", [params.id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar usuario" }, { status: 500 });
  }
}
