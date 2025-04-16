// components/NuevoReclamoForm.tsx
"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface NuevoReclamoFormProps {
  solicitudId: number
  onSuccess: () => void
}

export function NuevoReclamoForm({ solicitudId, onSuccess }: NuevoReclamoFormProps) {
  const router = useRouter()
  const [descripcion, setDescripcion] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("El archivo no debe superar los 5MB")
        return
      }
      setArchivo(file)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccessMessage("") // Reset success message

    try {
      if (!descripcion) {
        setError("La descripción es obligatoria")
        setIsSubmitting(false)
        return
      }

      let archivoUrl = null

      if (archivo) {
        const formDataFile = new FormData()
        formDataFile.append("file", archivo)
        formDataFile.append("tipo", "reclamo")

        const fileResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataFile,
        })

        if (!fileResponse.ok) throw new Error("Error al subir el archivo")

        const fileData = await fileResponse.json()
        archivoUrl = fileData.url
      }

      const body: any = {
        solicitudId, // Asegurarse de incluir el ID de la solicitud
        descripcion,
        estado: "pendiente",
        ...(archivoUrl && { archivo_url: archivoUrl }),
      }

      const response = await fetch("/api/reclamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al enviar el reclamo")

      setDescripcion("")
      setArchivo(null)
      setSuccessMessage("Reclamo registrado exitosamente.")
      onSuccess() // Notificar al componente padre
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el reclamo")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="descripcion">Descripción del Reclamo</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe el motivo de tu reclamo"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="archivo">Archivo Adjunto (opcional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="archivo"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("archivo")?.click()}
            className="w-full"
          >
            {archivo ? archivo.name : "Seleccionar archivo"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Máx 5MB. Formatos: PDF, DOCX, JPG, PNG</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Registrar Reclamo"}
        </Button>
      </div>
    </form>
  )
}
