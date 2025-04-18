"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Solicitud {
  id: number
  tipo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  created_at: string
  usuario: {
    id: number
    nombre: string
    departamento: string
  }
}

export default function SolicitudesAdminPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const res = await fetch("/api/admin/solicitudes", { credentials: "include" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Error al obtener solicitudes")
        setSolicitudes(data.solicitudes || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSolicitudes()
  }, [])

  const handleUpdateEstado = async (id: number, estado: string) => {
    try {
      const res = await fetch(`/api/admin/solicitudes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
        credentials: "include",
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || "No se pudo actualizar la solicitud")
      }

      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estado } : s))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  const filteredSolicitudes = solicitudes.filter((s) =>
    [s.usuario.nombre, s.tipo, s.estado].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "aprobada":
        return "success"
      case "rechazada":
        return "destructive"
      default:
        return "default"
    }
  }

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Solicitudes</h1>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nombre, tipo o estado"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto bg-list">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Solicitado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSolicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay solicitudes para mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredSolicitudes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.usuario.nombre}</TableCell>
                  <TableCell>{s.usuario.departamento}</TableCell>
                  <TableCell>{s.tipo}</TableCell>
                  <TableCell>{s.descripcion}</TableCell>
                  <TableCell>{format(new Date(s.fecha_inicio), "dd/MM/yyyy", { locale: es })}</TableCell>
                  <TableCell>{format(new Date(s.fecha_fin), "dd/MM/yyyy", { locale: es })}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(s.estado)}>
                      {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                  <TableCell className="text-right">
                    {s.estado === "pendiente" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateEstado(s.id, "aprobada")}
                        >
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateEstado(s.id, "rechazada")}
                        >
                          <XCircle className="h-5 w-5 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
