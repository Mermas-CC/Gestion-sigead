import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SolicitudesList } from "@/components/solicitudes-list"
import { NuevaSolicitudButton } from "@/components/nueva-solicitud-button"
import Link from "next/link"
import { FileText, Clock, Send, Users } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
        <NuevaSolicitudButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/dashboard/con-goce">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-green-500" />
                Con Goce
              </CardTitle>
              <CardDescription>Licencias con goce de remuneraciones</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Incapacidad temporal, maternidad, estudios, etc.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/sin-goce">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-orange-500" />
                Sin Goce
              </CardTitle>
              <CardDescription>Licencias sin goce de remuneraciones</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Motivos particulares, capacitación no oficial, etc.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/solicitudes">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Send className="mr-2 h-5 w-5 text-blue-500" />
                Solicitudes
              </CardTitle>
              <CardDescription>Envío y seguimiento de solicitudes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Gestiona tus solicitudes enviadas y su estado</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Users className="mr-2 h-5 w-5 text-purple-500" />
                Usuarios
              </CardTitle>
              <CardDescription>Gestión de usuarios del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Administra los usuarios y sus permisos</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="pendientes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="rechazadas">Rechazadas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes">
          <SolicitudesList status="pendiente" />
        </TabsContent>
        <TabsContent value="aprobadas">
          <SolicitudesList status="aprobada" />
        </TabsContent>
        <TabsContent value="rechazadas">
          <SolicitudesList status="rechazada" />
        </TabsContent>
        <TabsContent value="todas">
          <SolicitudesList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
