// app/api/admin/contract-types/route.ts
import { NextResponse } from 'next/server'

const contractTypes = [
  { id: "1", name: "Contrato CAS" },
  { id: "2", name: "Contrato 276" },
  { id: "3", name: "Contrato Servir" },
  { id: "4", name: "Locación de servicios" },
  { id: "5", name: "Ley 30057" }
]

export async function GET() {
  return NextResponse.json(contractTypes)
}
