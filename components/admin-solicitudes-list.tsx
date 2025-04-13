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
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Eye, Search, XCircle } from "lucide-react"

interface Usuario {
  id: number
  nombre: string
  departamento: string
}

interface Solicitud {
  id: string
  usuario: Usuario
  tipo: string
  fechaInicio: string
  fechaFin: string
  estado: string
  comentarios: string
  fechaSolicitud: string
}

interface AdminSolicitudesListProps {
  status?: string
}

export function AdminSolicitudesList({ status }: AdminSolicitudesListProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [comentarios, setComentarios] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const res = await fetch("/api/admin/solicitudes")
        if (!res.ok) {
          const errorData = await res.json()
          console.error("Error al obtener solicitudes:", errorData.message || "Respuesta no OK")
          return
        }

        const data = await res.json()
        if (Array.isArray(data.solicitudes)) {
          setSolicitudes(data.solicitudes)
        } else {
          console.error("Los datos recibidos no son un array", data.solicitudes)
        }
      } catch (error) {
        console.error("Error al cargar solicitudes:", error)
      }
    }

    fetchSolicitudes()
  }, [])

  const filteredSolicitudes = solicitudes
    .filter((s) => (status && status !== "" ? s.estado === status : true))
    .filter((s) => {
      const search = searchTerm.toLowerCase()
      return (
        s.id.toString().toLowerCase().includes(search) ||
        s.usuario?.nombre?.toLowerCase().includes(search) ||
        s.usuario?.departamento?.toLowerCase().includes(search) ||
        s.tipo?.toLowerCase().includes(search)
      )
    })

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Fecha no disponible"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"

    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprobada":
        return <Badge className="bg-green-500 text-white">Aprobada</Badge>
      case "rechazada":
        return <Badge variant="destructive">Rechazada</Badge>
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const updateSolicitudEstado = async (estado: "aprobada" | "rechazada") => {
    if (!selectedSolicitud) return
    setIsProcessing(true)

    try {
      const res = await fetch(`/api/admin/solicitudes/${selectedSolicitud.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ estado, comentarios })
      })

      if (!res.ok) throw new Error("Error actualizando solicitud")

      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === selectedSolicitud.id
            ? { ...s, estado, comentarios }
            : s
        )
      )

      setSelectedSolicitud(null)
      setComentarios("")
    } catch (error) {
      console.error("Error al actualizar solicitud:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseDialog = () => {
    setSelectedSolicitud(null)
    setComentarios("")
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar solicitudes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expediente</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSolicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay solicitudes para mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredSolicitudes.map((solicitud) => (
                <TableRow key={solicitud.id}>
                  <TableCell className="font-medium">{solicitud.id}</TableCell>
                  <TableCell>{solicitud.usuario?.nombre || "Sin nombre"}</TableCell>
                  <TableCell>{solicitud.usuario?.departamento || "Sin departamento"}</TableCell>
                  <TableCell>{solicitud.tipo}</TableCell>
                  <TableCell>
                    {formatDate(solicitud.fechaInicio)} - {formatDate(solicitud.fechaFin)}
                  </TableCell>
                  <TableCell>{getStatusBadge(solicitud.estado)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedSolicitud(solicitud)
                        setComentarios(solicitud.comentarios || "")
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

      <Dialog open={!!selectedSolicitud} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>Información completa de la solicitud {selectedSolicitud?.id}</DialogDescription>
          </DialogHeader>
          {selectedSolicitud && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Expediente</h4>
                  <p className="text-sm">{selectedSolicitud.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Estado</h4>
                  <div className="mt-1">{getStatusBadge(selectedSolicitud.estado)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Usuario</h4>
                  <p className="text-sm">{selectedSolicitud.usuario?.nombre || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Departamento</h4>
                  <p className="text-sm">{selectedSolicitud.usuario?.departamento || "N/A"}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium">Tipo de Solicitud</h4>
                <p className="text-sm">{selectedSolicitud.tipo}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Fecha de Inicio</h4>
                  <p className="text-sm">{formatDate(selectedSolicitud.fechaInicio)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Fecha de Fin</h4>
                  <p className="text-sm">{formatDate(selectedSolicitud.fechaFin)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium">Fecha de Solicitud</h4>
                <p className="text-sm">{formatDate(selectedSolicitud.fechaSolicitud)}</p>
              </div>
              <div>
                <Label htmlFor="comentarios">Comentarios</Label>
                <Textarea
                  id="comentarios"
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Añade comentarios a esta solicitud"
                  disabled={selectedSolicitud.estado !== "pendiente"}
                />
              </div>
            </div>
          )}
          {selectedSolicitud?.estado === "pendiente" && (
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => updateSolicitudEstado("rechazada")}
                disabled={isProcessing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                onClick={() => updateSolicitudEstado("aprobada")}
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
