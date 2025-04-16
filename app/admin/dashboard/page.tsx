import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSolicitudesList } from "@/components/admin-solicitudes-list"   
import AdminReclamosList from "@/components/admin-reclamos-list"
import { UserPlus, Users, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { query, testConnection } from "@/lib/db"

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
    // Probar la conexión primero
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('No se pudo establecer conexión con la base de datos');
    }

    console.log('Conexión exitosa, iniciando consultas...');

    // Consulta única para obtener todas las estadísticas
    console.log('Ejecutando consulta unificada de estadísticas...');
    const statsResult = await query(`
      WITH stats AS (
        SELECT 
          COUNT(*) as total_solicitudes,
          COUNT(CASE WHEN LOWER(estado) = 'pendiente' THEN 1 END) as total_pendientes,
          COUNT(CASE WHEN tipo IN ('capacitacion_oficial', 'salud') THEN 1 END) as total_con_goce,
          COUNT(CASE WHEN tipo IN ('capacitacion_no_oficial', 'personal') THEN 1 END) as total_sin_goce,
          COUNT(CASE WHEN tipo = 'capacitacion_oficial' THEN 1 END) as cap_oficial,
          COUNT(CASE WHEN tipo = 'salud' THEN 1 END) as salud,
          COUNT(CASE WHEN tipo = 'capacitacion_no_oficial' THEN 1 END) as cap_no_oficial,
          COUNT(CASE WHEN tipo = 'personal' THEN 1 END) as personal
        FROM solicitudes
      )
      SELECT * FROM stats;
    `);

    console.log('Resultado completo de estadísticas:', statsResult.rows[0]);

    // Si no hay resultados, devolvemos estadísticas por defecto
    if (!statsResult.rows || statsResult.rows.length === 0) {
      console.warn('No se encontraron resultados en la consulta');
      return getDefaultStats();
    }

    // Extraer los datos de la consulta
    const row = statsResult.rows[0];
    
    // Construir objeto de tipos con goce
    const tiposConGoce: Record<string, number> = {
      'capacitacion_oficial': parseInt(row.cap_oficial) || 0,
      'salud': parseInt(row.salud) || 0
    };

    // Construir objeto de tipos sin goce
    const tiposSinGoce: Record<string, number> = {
      'capacitacion_no_oficial': parseInt(row.cap_no_oficial) || 0,
      'personal': parseInt(row.personal) || 0
    };

    // Crear objeto de respuesta
    const stats = {
      totalSolicitudes: parseInt(row.total_solicitudes) || 0,
      pendientes: parseInt(row.total_pendientes) || 0,
      conGoce: parseInt(row.total_con_goce) || 0,
      sinGoce: parseInt(row.total_sin_goce) || 0,
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        </div>
        <div className="flex gap-4">
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
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="rechazadas">Rechazadas</TabsTrigger>
          <TabsTrigger value="correccion">Requieren corrección</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="reclamos">Reclamos</TabsTrigger>
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
        <TabsContent value="correccion">
          <AdminSolicitudesList status="correccion" />
        </TabsContent>
        <TabsContent value="todas">
          <AdminSolicitudesList />
        </TabsContent>
        <TabsContent value="reclamos">
          <AdminReclamosList />
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
