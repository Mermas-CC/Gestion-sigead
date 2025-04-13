import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const userCheck = await getCurrentUser(request)

    if (!userCheck.success) {
      return NextResponse.json(
        { message: userCheck.message },
        { status: userCheck.status }
      )
    }

    return NextResponse.json({ user: userCheck.user })
  } catch (error) {
    console.error("Error en /api/auth/me:", error)
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    )
  }
}
