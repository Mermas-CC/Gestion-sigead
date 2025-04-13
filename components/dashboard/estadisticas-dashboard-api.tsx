"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

// Tipos de datos
interface EstadisticasGenerales {
  totalSolicitudes: number
  pendientes: number
  aprobadas: number
  rechazadas: number
  conGoce: number
  sinGoce: number
}

interface DatosPorTipo {
  nombre: string
  cantidad: number
}

interface DatosPorMes {
  mes: string
  conGoce: number
  sinGoce: number
}

interface DatosEstadisticas {
  estadisticasGenerales: EstadisticasGenerales
  datosPorTipo: DatosPorTipo[]
  datosPorEstado: DatosPorTipo[]
  datosPorMes: DatosPorMes[]
}

// Colores para los gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function EstadisticasDashboardApi() {
  const [datos, setDatos] = useState<DatosEstadisticas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        setIsLoading(true)

        const response = await fetch("/api/estadisticas")

        if (!response.ok) {
          throw new Error("Error al obtener estadísticas")
        }

        const data = await response.json()
        setDatos(data)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar estadísticas")
        setIsLoading(false)
      }
    }

    fetchEstadisticas()
  }, [])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>No se pudieron cargar las estadísticas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{datos?.estadisticasGenerales.totalSolicitudes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{datos?.estadisticasGenerales.pendientes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Con Goce</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{datos?.estadisticasGenerales.conGoce}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sin Goce</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{datos?.estadisticasGenerales.sinGoce}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="distribucion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribucion">Distribución</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="estados">Estados</TabsTrigger>
        </TabsList>

        <TabsContent value="distribucion">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Licencia</CardTitle>
              <CardDescription>Cantidad de solicitudes por cada tipo de licencia</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={datos?.datosPorTipo}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Solicitudes</CardTitle>
              <CardDescription>Evolución de solicitudes por mes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={datos?.datosPorMes}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conGoce" name="Con Goce" fill="#00C49F" />
                    <Bar dataKey="sinGoce" name="Sin Goce" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estados">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
              <CardDescription>Cantidad de solicitudes por estado</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datos?.datosPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="cantidad"
                      nameKey="nombre"
                    >
                      {datos?.datosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
