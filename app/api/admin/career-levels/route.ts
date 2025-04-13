// app/api/admin/career-levels/route.ts
import { NextResponse } from 'next/server'

const careerLevels = [
  { id: "1", name: "Auxiliar" },
  { id: "2", name: "Técnico" },
  { id: "3", name: "Profesional" },
  { id: "4", name: "Funcionario" },
  { id: "5", name: "Encargado" },
  { id: "6", name: "Administrativo" }
]

export async function GET() {
  return NextResponse.json(careerLevels)
}
