import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db/postgres"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// Endpoint para obtener reclamos
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const estado = url.searchParams.get("estado") || "pendiente" // Estado por defecto: 'pendiente'

    // Verificar si el usuario está autenticado
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    // Consultar reclamos con datos de solicitud
    const result = await query(
      `SELECT 
         r.*, 
         s.numero_expediente AS solicitud_numero_expediente
       FROM reclamos r
       LEFT JOIN solicitudes s ON r.solicitud_id = s.id
       WHERE r.estado = $1
       ORDER BY r.created_at DESC`,
      [estado]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "No se encontraron reclamos" }, { status: 404 })
    }

    return NextResponse.json({
      reclamos: result.rows.map(r => ({
        ...r,
        solicitud: {
          numeroExpediente: r.solicitud_numero_expediente
        }
      }))
    })

  } catch (error: any) {
    console.error("Error al cargar los reclamos:", error);
    return NextResponse.json({ message: "Error en el servidor", error: error.stack }, { status: 500 });
  }
}

// Endpoint para crear un reclamo
export async function POST(request: Request) {
  try {
    const userCheck = await getCurrentUser(request)
    if (!userCheck.success) {
      return NextResponse.json({ message: userCheck.message }, { status: userCheck.status })
    }

    let data: any = {}
    let archivoUrl: string | null = null

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      data = await request.json()
      if (data.archivo_url) {
        archivoUrl = data.archivo_url
      }
    } else {
      const formData = await request.formData()
      data = {
        solicitudId: formData.get('solicitudId'),
        descripcion: (formData.get('descripcion') || '').toString().trim(),
      }

      const archivoData = formData.get('archivo')
      if (archivoData instanceof File && archivoData.size > 0) {
        const buffer = Buffer.from(await archivoData.arrayBuffer())
        const safeName = archivoData.name.replace(/[^a-z0-9.\-_]/gi, "_")
        const filename = `${Date.now()}_${safeName}`
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        await mkdir(uploadDir, { recursive: true })
        const filePath = path.join(uploadDir, filename)
        await writeFile(filePath, buffer)
        archivoUrl = `/uploads/${filename}`
      }
    }

    const camposRequeridos = ['descripcion']
    const camposVacios = camposRequeridos.filter(campo => !data[campo])
    if (camposVacios.length > 0) {
      return NextResponse.json({
        message: `Los siguientes campos son requeridos: ${camposVacios.join(', ')}`,
        camposVacios
      }, { status: 400 })
    }

    if (data.solicitudId) {
      const solicitudQuery = await query(
        `SELECT estado, created_at FROM solicitudes WHERE id = $1`,
        [data.solicitudId]
      )

      if (solicitudQuery.rowCount === 0) {
        return NextResponse.json({ message: "La solicitud no existe." }, { status: 404 })
      }

      const { estado, created_at } = solicitudQuery.rows[0]
      const tresDiasEnMs = 3 * 24 * 60 * 60 * 1000
      const fechaCreacion = new Date(created_at)
      const ahora = new Date()

      const puedeReclamar =
        estado === 'rechazada' ||
        (estado === 'pendiente' && (ahora.getTime() - fechaCreacion.getTime()) >= tresDiasEnMs)

      if (!puedeReclamar) {
        return NextResponse.json({
          message: "Solo puedes presentar un reclamo si la solicitud fue rechazada o ha estado pendiente por más de 3 días.",
        }, { status: 400 })
      }

      const reclamoExistente = await query(
        `SELECT 1 FROM reclamos WHERE solicitud_id = $1 AND usuario_id = $2`,
        [data.solicitudId, userCheck.user.id]
      )

      if (reclamoExistente.rowCount > 0) {
        return NextResponse.json({
          message: "Ya has registrado un reclamo para esta solicitud.",
        }, { status: 400 })
      }
    }

    const result = await query(
      `INSERT INTO reclamos (
        solicitud_id,
        usuario_id,
        mensaje,
        archivo_url,
        estado
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, solicitud_id, mensaje, archivo_url, estado, created_at`,
      [
        data.solicitudId || null,
        userCheck.user.id,
        data.descripcion,
        archivoUrl || null,
        'pendiente'
      ]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Error al registrar el reclamo" }, { status: 500 })
    }

    const reclamoCreado = result.rows[0]

    await query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje)
       VALUES ($1, $2, $3)`,
      [
        userCheck.user.id,
        "Reclamo registrado",
        `Tu reclamo para la solicitud #${data.solicitudId || "sin solicitud"} ha sido registrado y está pendiente de revisión.`
      ]
    )

    return NextResponse.json({
      reclamo: {
        id: reclamoCreado.id,
        solicitudId: reclamoCreado.solicitud_id,
        mensaje: reclamoCreado.mensaje,
        archivoUrl: reclamoCreado.archivo_url,
        estado: reclamoCreado.estado,
        fechaCreacion: reclamoCreado.created_at
      },
      message: "Reclamo registrado exitosamente",
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error al registrar reclamo:", error)
    return NextResponse.json({ message: "Error en el servidor", error: error.message }, { status: 500 })
  }
}
