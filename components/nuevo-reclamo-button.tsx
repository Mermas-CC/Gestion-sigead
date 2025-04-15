"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function NuevoReclamoButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    descripcion: "",
  })

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

    try {
      if (!formData.descripcion) {
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

        if (!fileResponse.ok) {
          throw new Error("Error al subir el archivo adjunto")
        }

        const fileData = await fileResponse.json()
        archivoUrl = fileData.url  // Asignamos la URL del archivo a archivoUrl
      }

      // Crear cuerpo dinámico según si hay archivo_url
      const body: any = {
        descripcion: formData.descripcion,
        estado: "pendiente",
      }

      // Solo incluir archivo_url si el archivo fue cargado
      if (archivoUrl) {
        body.archivo_url = archivoUrl
      }

      console.log("Enviando reclamo:", {
        descripcion: formData.descripcion,
        archivo_url: archivoUrl,
        estado: "pendiente",
      })
      
      // Enviar el reclamo
      const response = await fetch("/api/reclamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar el reclamo")
      }

      // Limpiar formulario y cerrar el modal
      setFormData({ descripcion: "" })
      setArchivo(null)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el reclamo")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Registrar Reclamo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Reclamo</DialogTitle>
            <DialogDescription>Completa el formulario para registrar tu reclamo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción del Reclamo</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe el motivo de tu reclamo"
                className="min-h-[80px]"
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
              <p className="text-xs text-muted-foreground">Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (máx. 5MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Registrar Reclamo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
