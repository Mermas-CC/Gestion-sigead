"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SolicitudJsonPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [jsonData, setJsonData] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchJson = async () => {
      try {
        const response = await fetch(`/json/solicitud_${params.id}.json`)
        if (!response.ok) {
          throw new Error("No se pudo cargar el archivo JSON")
        }
        const data = await response.json()
        setJsonData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el archivo JSON")
      }
    }

    fetchJson()
  }, [params.id])

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  if (!jsonData) {
    return <div className="p-4">Cargando datos...</div>
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>
      <h1 className="text-2xl font-bold mb-4">Datos de la Solicitud</h1>
      <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
        {JSON.stringify(jsonData, null, 2)}
      </pre>
    </div>
  )
}
