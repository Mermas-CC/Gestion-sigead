"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, FileText, Download } from "lucide-react"

interface Reclamo {
  id: number
  estado: string
  mensaje: string
  archivo_url: string | null
  created_at: string
  updated_at: string
  solicitud?: {
    numeroExpediente?: string | null
    id?: number
    tipo?: string
    estado?: string
  } | null
}

interface ReclamosListProps {
  status?: string
  showAll?: boolean
}

export function ReclamosList({ status, showAll = false }: ReclamosListProps) {
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null)

  useEffect(() => {
    const fetchReclamos = async () => {
      try {
        const url = status ? `/api/reclamos?estado=${status}` : "/api/reclamos"
        const token =
          typeof document !== "undefined"
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("auth_token="))
                ?.split("=")[1]
            : null

        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!response.ok) {
          throw new Error("Error al cargar los reclamos")
        }

        const data = await response.json()
        setReclamos(data.reclamos || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReclamos()
  }, [status])

  const filteredReclamos = showAll
    ? reclamos
    : reclamos.filter((r) => (status ? r.estado === status : r.estado === "pendiente"))

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No disponible"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resuelto":
        return <Badge className="bg-green-500 text-white">Resuelto</Badge>
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>
      case "en_atencion":
        return <Badge className="bg-yellow-400 text-yellow-900">En atención</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  const handleVisualizar = async (ruta: string) => {
    try {
      const response = await fetch(`/api/download?ruta=${encodeURIComponent(ruta)}`, {
        method: "GET",
        credentials: "include",
        redirect: "follow",
      })
  
      if (!response.ok) throw new Error("Error al obtener la URL")
  
      const finalUrl = response.url
      window.open(finalUrl, "_blank")
    } catch (error) {
      console.error("Error al visualizar el archivo:", error)
    }
  }
  

  if (isLoading) return <div className="flex justify-center p-8">Cargando reclamos...</div>
  if (error) return <div className="flex justify-center p-8 text-red-500">{error}</div>

  return (
    <div className="w-full">
      <Card>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reclamo</TableHead>
                  <TableHead>Solicitud Relacionada</TableHead>
                  <TableHead>Fecha de Reclamo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReclamos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay reclamos para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReclamos.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{`RECL-${r.id}`}</TableCell>
                      <TableCell>{r.solicitud?.numeroExpediente || "No asociada"}</TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(r.estado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedReclamo(r)}
                            aria-label="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {r.archivo_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVisualizar(r.archivo_url!)}
                              aria-label="Descargar adjunto"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedReclamo} onOpenChange={(open) => !open && setSelectedReclamo(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Reclamo</DialogTitle>
            <DialogDescription>
              Reclamo ID: {selectedReclamo ? `RECL-${selectedReclamo.id}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedReclamo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm">Estado</h4>
                <div className="mt-1">{getStatusBadge(selectedReclamo.estado)}</div>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Comentarios</h4>
                <p>{selectedReclamo.mensaje}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Fecha de Reclamo</h4>
                <p>{formatDate(selectedReclamo.created_at)}</p>
              </div>
              {selectedReclamo.archivo_url && (
                <div>
                  <h4 className="font-semibold text-sm">Documento Adjunto</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVisualizar(selectedReclamo.archivo_url!)}
                    className="mt-2"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Descargar documento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
