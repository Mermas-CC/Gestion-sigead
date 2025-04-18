// app/api/admin/contract-types/route.ts
import { NextResponse } from 'next/server'

const contractTypes = [
  { id: "1", name: "CAS" },
  { id: "2", name: "276" },
  { id: "3", name: "Servir" },
  { id: "4", name: "Ley 30057" },
  { id: "6", name: "Docente" },
  { id: "7", name: "Directivo" }
]

export async function GET() {
  return NextResponse.json(contractTypes)
}
