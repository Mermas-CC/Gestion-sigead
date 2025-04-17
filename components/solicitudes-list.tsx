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
import { NuevoReclamoForm } from "./NuevoReclamoForm"

interface Solicitud {
  id: number
  numeroExpediente: string
  tipo: string
  goceRemuneraciones: boolean
  motivo: string
  fechaInicio: string
  fechaFin: string
  estado: string
  comentarios: string
  fechaSolicitud: string
  fechaActualizacion: string
  celular: string
  correo: string
  cargo: string
  institucion: string
  rutaAdjunto: string | null
  pdfUrl?: string | null
  usuario?: {
    id: number
    nombre: string
    departamento: string
  }
}

interface SolicitudesListProps {
  status?: string;
  showAll?: boolean;
}

export function SolicitudesList({ status, showAll = false }: SolicitudesListProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [reclamoSolicitudId, setReclamoSolicitudId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const url = status ? `/api/solicitudes?estado=${status}` : "/api/solicitudes";
        const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Error al cargar solicitudes");
        }
        const data = await response.json();
        setSolicitudes(data.solicitudes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar solicitudes");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolicitudes();
  }, [status]);

  const filteredSolicitudes = showAll
    ? solicitudes
    : solicitudes.filter((s) => {
        if (status) {
          return s.estado === status;
        }
        return s.estado === "pendiente" || new Date(s.fechaFin) >= new Date();
      });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprobada":
        return <Badge className="bg-green-500 text-white">Aprobada</Badge>;
      case "rechazada":
        return <Badge variant="destructive">Rechazada</Badge>;
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>;
      case "correccion":
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">Requiere corrección</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLicenciaBadge = (tipo: string, conGoce: boolean) => {
    return conGoce ? (
      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
        Con goce
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
        Sin goce
      </Badge>
    );
  };

  const getTipoLicencia = (tipo: string) => {
    const tiposLicencia: Record<string, string> = {
      incapacidad: "Incapacidad temporal",
      familiar_grave: "Familiar grave/terminal",
      maternidad: "Maternidad/Paternidad",
      prenatal: "Aplazamiento prenatal",
      estudios: "Estudios/Capacitación",
      representacion: "Representación",
      medica: "Asistencia médica",
      particulares: "Motivos particulares",
      capacitacion_no_oficial: "Capacitación no oficial",
      capacitacion_oficial: "Capacitación oficial",
      salud: "Licencia de salud",
      personal: "Licencia personal",
      enfermedad_familiar: "Enfermedad familiar",
      varios: "Permisos varios",
    };
    return tiposLicencia[tipo] || tipo;
  };

  const handleDownload = async (ruta: string) => {
    try {
      const response = await fetch(`/api/download?ruta=${encodeURIComponent(ruta)}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al descargar el archivo');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ruta.split('/').pop() || 'documento';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar:', error);
    }
  };

  const handleReclamoSuccess = (solicitudId: number) => {
    setSolicitudes((prevSolicitudes) =>
      prevSolicitudes.map((s) =>
        s.id === solicitudId ? { ...s, estado: "reclamado" } : s
      )
    )
    setReclamoSolicitudId(null)
  }

  if (isLoading) return <div className="flex justify-center p-8">Cargando solicitudes...</div>;
  if (error) return <div className="flex justify-center p-8 text-red-500">{error}</div>;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-blue-600 text-white">Solicitud</Badge>
        <span className="font-semibold text-lg">Lista de Solicitudes</span>
      </div>
      <Card className="w-full">
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay solicitudes para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSolicitudes.map((s) => {
                    const puedeReclamar =
                      s.estado === "rechazada" ||
                      new Date(s.fechaSolicitud).getTime() + 3 * 24 * 60 * 60 * 1000 < Date.now();

                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.numeroExpediente || `SOL-${s.id}`}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{getTipoLicencia(s.tipo)}</span>
                            {getLicenciaBadge(s.tipo, s.goceRemuneraciones)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(s.fechaSolicitud)}</TableCell>
                        <TableCell>{formatDate(s.fechaInicio)} - {formatDate(s.fechaFin)}</TableCell>
                        <TableCell>{getStatusBadge(s.estado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSolicitud(s)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Button>
                            {s.estado === "aprobada" && (
                              <Button
                                variant="link"
                                size="sm"
                                className="ml-2"
                                onClick={() => window.open(`/pdf/solicitud_${s.id}.pdf`, "_blank")}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Ver Memorando
                              </Button>
                            )}
                            {s.rutaAdjunto && (
                              <Button
                                variant="link"
                                size="sm"
                                className="ml-2"
                                onClick={() => window.open(s.rutaAdjunto, "_blank")}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Ver contrato
                              </Button>
                            )}
                            {puedeReclamar && (
                              <Button variant="destructive" onClick={() => setReclamoSolicitudId(s.id)}>
                                Reclamar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={!!selectedSolicitud} onOpenChange={() => setSelectedSolicitud(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>
              Expediente: {selectedSolicitud?.numeroExpediente || `SOL-${selectedSolicitud?.id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedSolicitud && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">Estado</h4>
                  <div className="mt-1">{getStatusBadge(selectedSolicitud.estado)}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Goce de Remuneraciones</h4>
                  <div className="mt-1">{getLicenciaBadge(selectedSolicitud.tipo, selectedSolicitud.goceRemuneraciones)}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Tipo de Licencia</h4>
                <p>{getTipoLicencia(selectedSolicitud.tipo)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Motivo</h4>
                <p>{selectedSolicitud.motivo}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">Fecha de Solicitud</h4>
                  <p>{formatDate(selectedSolicitud.fechaSolicitud)}</p>
                </div>
                {selectedSolicitud.fechaActualizacion && (
                  <div>
                    <h4 className="font-semibold text-sm">Última Actualización</h4>
                    <p>{formatDate(selectedSolicitud.fechaActualizacion)}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">Fecha de Inicio</h4>
                  <p>{formatDate(selectedSolicitud.fechaInicio)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Fecha de Fin</h4>
                  <p>{formatDate(selectedSolicitud.fechaFin)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">Cargo</h4>
                  <p>{selectedSolicitud.cargo}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Institución</h4>
                  <p>{selectedSolicitud.institucion}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm">Comentarios</h4>
              <p>{selectedSolicitud.comentarios || "Sin comentarios"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Adjunto</h4>
              <p>{selectedSolicitud.rutaAdjunto ? "Archivo adjunto disponible" : "No hay adjunto"}</p>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>

  {/* Modal de Reclamo */}
  <Dialog open={!!reclamoSolicitudId} onOpenChange={() => setReclamoSolicitudId(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nuevo Reclamo</DialogTitle>
      </DialogHeader>
      {reclamoSolicitudId && (
        <NuevoReclamoForm
          solicitudId={reclamoSolicitudId}
          onSuccess={() => handleReclamoSuccess(reclamoSolicitudId)}
        />
      )}
    </DialogContent>
  </Dialog>
</div>
  );
}
