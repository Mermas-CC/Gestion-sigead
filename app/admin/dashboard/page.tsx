import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSolicitudesList } from "@/components/admin-solicitudes-list"   
import AdminReclamosList from "@/components/admin-reclamos-list"
import { UserPlus, Users, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { UserNav } from "@/components/user-nav" // <-- Importa el UserNav

// Interfaces para las estadísticas
interface DashboardStats {
  totalSolicitudes: number;
  pendientes: number;
  conGoce: number;
  sinGoce: number;
  tiposConGoce: Record<string, number>;
  tiposSinGoce: Record<string, number>;
}

// Función para obtener las estadísticas del dashboard
async function getDashboardStats(): Promise<DashboardStats> {
  try {
    console.log('Iniciando consultas con Supabase...');

    // Obtener el total de solicitudes
    const { count: totalSolicitudes, error: totalError } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error al obtener total de solicitudes:', totalError);
      throw new Error('Error al obtener estadísticas de solicitudes');
    }

    // Obtener solicitudes pendientes
    const { count: pendientes, error: pendientesError } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente');
    
    if (pendientesError) {
      console.error('Error al obtener solicitudes pendientes:', pendientesError);
      throw new Error('Error al obtener estadísticas de solicitudes pendientes');
    }

    // Obtener solicitudes con goce - capacitación oficial
    const { count: capOficial, error: capOficialError } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'capacitacion_oficial');
    
    if (capOficialError) {
      console.error('Error al obtener solicitudes de capacitación oficial:', capOficialError);
      throw new Error('Error al obtener estadísticas de licencias');
    }

    // Obtener solicitudes con goce - salud
    const { count: salud, error: saludError } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'salud');
    
    if (saludError) {
      console.error('Error al obtener solicitudes de salud:', saludError);
      throw new Error('Error al obtener estadísticas de licencias');
    }

    // Obtener solicitudes sin goce - capacitación no oficial
    const { count: capNoOficial, error: capNoOficialError } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'capacitacion_no_oficial');
    
    if (capNoOficialError) {
      console.error('Error al obtener solicitudes de capacitación no oficial:', capNoOficialError);
      throw new Error('Error al obtener estadísticas de licencias');
    }

    // Obtener solicitudes sin goce - personal
    const { count: personal, error: personalError } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'personal');
    
    if (personalError) {
      console.error('Error al obtener solicitudes personales:', personalError);
      throw new Error('Error al obtener estadísticas de licencias');
    }

    // Calcular totales con goce y sin goce
    const conGoce = (capOficial || 0) + (salud || 0);
    const sinGoce = (capNoOficial || 0) + (personal || 0);

    // Construir objeto de tipos con goce
    const tiposConGoce: Record<string, number> = {
      'capacitacion_oficial': capOficial || 0,
      'salud': salud || 0
    };

    // Construir objeto de tipos sin goce
    const tiposSinGoce: Record<string, number> = {
      'capacitacion_no_oficial': capNoOficial || 0,
      'personal': personal || 0
    };

    // Crear objeto de respuesta
    const stats = {
      totalSolicitudes: totalSolicitudes || 0,
      pendientes: pendientes || 0,
      conGoce,
      sinGoce,
      tiposConGoce,
      tiposSinGoce
    };

    console.log('Estadísticas finales:', stats);
    return stats;
  } catch (error) {
    console.error('Error en getDashboardStats:', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Función para obtener estadísticas por defecto en caso de error
function getDefaultStats(): DashboardStats {
  return {
    totalSolicitudes: 0,
    pendientes: 0,
    conGoce: 0,
    sinGoce: 0,
    tiposConGoce: {
      'capacitacion_oficial': 0,
      'salud': 0
    },
    tiposSinGoce: {
      'capacitacion_no_oficial': 0,
      'personal': 0
    }
  };
}
export default async function AdminDashboardPage() {
  try {
    // Obtener datos de la base de datos
    console.log('Iniciando carga del dashboard...');
    let stats;
    
    try {
      stats = await getDashboardStats();
      console.log('Estadísticas obtenidas:', stats);
    } catch (dbError) {
      console.error('Error al obtener estadísticas, usando valores por defecto:', dbError);
      stats = getDefaultStats();
    }
    return (
    <div className="container py-8">
      {/* Barra superior con UserNav */}
      <div className="flex flex-row items-center justify-between mb-6">
        <div>
          <div className="flex flex-row items-center gap-6 mb-2">
            <img src="/logo.png" alt="Logo Plataforma" className="h-12 w-auto" />
            <img src="/ugel.png" alt="Logo Institución" className="h-12 w-auto" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Botones de acciones */}
          <Button asChild>
            <Link href="/admin/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              Gestionar Usuarios
            </Link>
          </Button>
          {/* Barra de usuario */}
          <UserNav />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSolicitudes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Con Goce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conGoce}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sin Goce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sinGoce}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-green-500" />
              Licencias con Goce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Capacitación Oficial</span>
                <span className="text-2xl font-bold">{stats.tiposConGoce.capacitacion_oficial || 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Salud</span>
                <span className="text-2xl font-bold">{stats.tiposConGoce.salud || 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Total con Goce</span>
                <span className="text-2xl font-bold">{stats.conGoce}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">% del Total</span>
                <span className="text-2xl font-bold">
                  {stats.totalSolicitudes ? Math.round((stats.conGoce / stats.totalSolicitudes) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Licencias sin Goce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Personal</span>
                <span className="text-2xl font-bold">{stats.tiposSinGoce.personal || 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Capacitación No Oficial</span>
                <span className="text-2xl font-bold">{stats.tiposSinGoce.capacitacion_no_oficial || 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Total sin Goce</span>
                <span className="text-2xl font-bold">{stats.sinGoce}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">% del Total</span>
                <span className="text-2xl font-bold">
                  {stats.totalSolicitudes ? Math.round((stats.sinGoce / stats.totalSolicitudes) * 100) : 0}%
                </span>
              </div>
            </div>
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
        <TabsContent value="pendientes">
          <AdminSolicitudesList status="pendiente" />
        </TabsContent>
        <TabsContent value="aprobadas">
          <AdminSolicitudesList status="aprobada" />
        </TabsContent>
        <TabsContent value="rechazadas">
          <AdminSolicitudesList status="rechazada" />
        </TabsContent>
        <TabsContent value="pendientes-reclamos">
          <AdminReclamosList status="pendiente" />
        </TabsContent>
        <TabsContent value="aprobadas-reclamos">
          <AdminReclamosList status="aprobado" />
        </TabsContent>
        <TabsContent value="rechazadas-reclamos">
          <AdminReclamosList status="rechazado" />
        </TabsContent>
      </Tabs>
    </div>
  );
  } catch (error) {
    console.error('Error fatal en el dashboard:', error);
    
    // Mostrar un mensaje de error más detallado al usuario
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Panel de Administración</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error al cargar el dashboard</h2>
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Error al cargar las estadísticas. Por favor, intente más tarde.'}
          </p>
          {process.env.NODE_ENV !== 'production' && error instanceof Error && (
            <pre className="mt-2 text-sm text-red-500 whitespace-pre-wrap overflow-auto max-h-48">
              {error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
