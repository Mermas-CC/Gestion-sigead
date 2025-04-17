"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Eye, XCircle } from "lucide-react"

interface Reclamo {
  id: string
  solicitudId: string | null
  mensaje: string
  estado: string
  archivoUrl: string | null
  fechaCreacion: string
  solicitud?: {
    numeroExpediente: string | null
    tipo?: string
    fechaInicio?: string
    fechaFin?: string
  }
}

const formatDate = (date: string) => {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
  return new Date(date).toLocaleDateString(undefined, options)
}

export default function AdminReclamosList() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null)
  const [respuesta, setRespuesta] = useState("")  // Renombrado de comentarios a respuesta
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("") // Agrega un estado para manejar errores

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const res = await fetch("/api/reclamos")
        if (!res.ok) throw new Error("Error al cargar reclamos")
        const data = await res.json()
        setReclamos(data.reclamos || [])
      } catch (error) {
        console.error(error)
        setError("Error al cargar los reclamos. Intente nuevamente.")
      }
    }
    fetchReclamos()
  }, [])

  const updateReclamoEstado = async (estado: "aprobado" | "rechazado") => {
    if (!selectedReclamo) return
    setIsProcessing(true)
    setError("") // Reinicia el estado de error

    try {
      const res = await fetch(`/api/reclamos/${selectedReclamo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, respuesta }),  // Enviar respuesta en lugar de comentarios
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al actualizar reclamo")
      }

      setReclamos((prev) =>
        prev.map((r) =>
          r.id === selectedReclamo.id ? { ...r, estado, respuesta } : r
        )
      )
      setSelectedReclamo(null)
      setRespuesta("") // Reiniciar estado de respuesta
    } catch (error: any) {
      console.error("Error al actualizar reclamo:", error)
      setError(error.message || "Error desconocido") // Actualiza el estado de error
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseDialog = () => {
    setSelectedReclamo(null)
    setRespuesta("") // Reiniciar respuesta al cerrar el diálogo
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprobado":
        return <Badge className="bg-green-500 text-white">Aprobado</Badge>
      case "rechazado":
        return <Badge variant="destructive">Rechazado</Badge>
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md mb-4">
          {error}
        </div>
      )}
      <div className="rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Expediente</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reclamos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay reclamos para mostrar
                </TableCell>
              </TableRow>
            ) : (
              reclamos.map((reclamo) => (
                <TableRow key={reclamo.id}>
                  <TableCell>{reclamo.id}</TableCell>
                  <TableCell>{reclamo.solicitud?.numeroExpediente || "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reclamo.solicitud?.tipo || "Sin tipo"}</p>
                      <p className="text-sm text-muted-foreground">
                        {reclamo.solicitud?.fechaInicio
                          ? `Del ${formatDate(reclamo.solicitud.fechaInicio)} al ${formatDate(reclamo.solicitud.fechaFin)}`
                          : "Sin período"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(reclamo.estado)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedReclamo(reclamo)
                        setRespuesta(reclamo.mensaje || "")  // Usar respuesta aquí
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver detalles</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedReclamo} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Reclamo</DialogTitle>
            <DialogDescription>
              Información completa del reclamo {selectedReclamo?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReclamo && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Mensaje</h4>
                <p className="text-sm">{selectedReclamo.mensaje}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Estado</h4>
                <div className="mt-1">{getStatusBadge(selectedReclamo.estado)}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium">Comentarios</h4>
                <Textarea
                  value={respuesta}  // Usar respuesta en lugar de comentarios
                  onChange={(e) => setRespuesta(e.target.value)}  // Cambiar a respuesta
                  placeholder="Añade comentarios al reclamo"
                  disabled={selectedReclamo.estado !== "pendiente"}
                />
              </div>
            </div>
          )}
          {selectedReclamo?.estado === "pendiente" && (
            <DialogFooter className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => updateReclamoEstado("rechazado")}
                disabled={isProcessing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                onClick={() => updateReclamoEstado("aprobado")}
                disabled={isProcessing}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
