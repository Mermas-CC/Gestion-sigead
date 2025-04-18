import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { SolicitudesList } from "@/components/solicitudes-list"
import { NuevaSolicitudButton } from "@/components/nueva-solicitud-button"
import { NuevoReclamoButton } from "@/components/nuevo-reclamo-button"

import BotonSolicitudVacaciones from "@/components/BotonSolicitudVacaciones"
import { ReclamosList } from "@/components/reclamo-list"

import Link from "next/link"
import {
  FileText,
  Clock,
  Send,
  Users,
} from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
        <div className="flex gap-2">
          <NuevaSolicitudButton />
          <NuevoReclamoButton />
          <BotonSolicitudVacaciones />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-green-500" />
                Con Goce
              </CardTitle>
              <CardDescription>Licencias con goce de remuneraciones</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Incapacidad temporal, maternidad, estudios, etc.
              </p>
            </CardContent>
          </Card>

          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-orange-500" />
                Sin Goce
              </CardTitle>
              <CardDescription>Licencias sin goce de remuneraciones</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Motivos particulares, capacitación no oficial, etc.
              </p>
            </CardContent>
          </Card>

          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Send className="mr-2 h-5 w-5 text-blue-500" />
                Solicitudes
              </CardTitle>
              <CardDescription>Envío y seguimiento de solicitudes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestiona tus solicitudes enviadas y su estado
              </p>
            </CardContent>
          </Card>


      </div>

      <Tabs defaultValue="pendientes" className="space-y-6">
      <TabsList>
          {/* Sección de Licencias/Solicitudes */}
          <span className="flex items-center gap-2 mr-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">Licencias</span>
          </span>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="rechazadas">Rechazadas</TabsTrigger>
          {/* Separador visual */}
          <span className="mx-2 border-l h-6 border-gray-300"></span>
          {/* Sección de Reclamos */}
          <span className="flex items-center gap-2 mr-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs font-semibold">Reclamos</span>
          </span>
          <TabsTrigger value="pendientes-reclamos">Pendientes</TabsTrigger>
          <TabsTrigger value="aprobadas-reclamos">Aprobadas</TabsTrigger>
          <TabsTrigger value="rechazadas-reclamos">Rechazadas</TabsTrigger>
        </TabsList>
        {/* Solicitudes */}
        <TabsContent value="pendientes">
          <SolicitudesList status="pendiente" />
        </TabsContent>
        <TabsContent value="aprobadas">
          <SolicitudesList status="aprobada" />
        </TabsContent>
        <TabsContent value="rechazadas">
          <SolicitudesList status="rechazada" />
        </TabsContent>

        {/* Reclamos */}
        <TabsContent value="pendientes-reclamos">
          <ReclamosList status="pendiente" />
        </TabsContent>
        <TabsContent value="aprobadas-reclamos">
          <ReclamosList status="aprobado" />
        </TabsContent>
        <TabsContent value="rechazadas-reclamos">
          <ReclamosList status="rechazado" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
