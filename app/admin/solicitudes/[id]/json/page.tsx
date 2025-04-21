import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import fs from "fs/promises"
import path from "path"
import { notFound } from "next/navigation"

export default async function SolicitudJsonPage(props: any) {
  const { id } = props.params

  const filePath = path.join(process.cwd(), "public", "json", `solicitud_${id}.json`)

  try {
    const fileContent = await fs.readFile(filePath, "utf-8")
    const jsonData = JSON.parse(fileContent)

    return (
      <div className="container py-8">
        <Link href="/admin/solicitudes">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-4">Datos de la Solicitud</h1>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
