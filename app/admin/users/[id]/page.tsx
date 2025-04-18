"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditUserPage({ params }: { params: { id: string } }) {
  // Next.js warning: params may be a Promise en futuras versiones.
  // Usar React.use() para desempaquetar.
  const { id } = React.use(params)
  const router = useRouter()
  const [formData, setFormData] = useState<any>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [contractTypes, setContractTypes] = useState<{ id: string; name: string }[]>([])
  const [careerLevels, setCareerLevels] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, contractRes, careerRes] = await Promise.all([
          fetch(`/api/admin/users/${id}`),
          fetch("/api/admin/contract-types"),
          fetch("/api/admin/career-levels"),
        ])
        if (!userRes.ok) throw new Error("Error al cargar usuario")
        const userData = await userRes.json()
        setFormData(userData.user)
        setContractTypes(await contractRes.json())
        setCareerLevels(await careerRes.json())
      } catch (err) {
        setError("Error al cargar datos")
      }
    }
    fetchData()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    setFormData((prev: any) => ({
      ...prev,
      contractFile: file,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const body = new FormData()
    body.append("name", formData.nombre)
    body.append("email", formData.email)
    if (formData.password) body.append("password", formData.password)
    body.append("department", formData.departamento || "")
    body.append("role", formData.rol || "user")
    body.append("isActive", formData.activo ? "true" : "false")
    body.append("phone", formData.telefono || "")
    body.append("position", formData.cargo || "")
    body.append("contractTypeId", formData.tipo_contrato_id || "")
    body.append("careerLevelId", formData.nivel_carrera_id || "")
    if (formData.contractFile) {
      body.append("contractFile", formData.contractFile)
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        body,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al actualizar usuario")
      router.push("/admin/users")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar usuario")
    } finally {
      setIsLoading(false)
    }
  }

  if (!formData) return <div className="p-8">Cargando...</div>

  return (
    <div className="container py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a usuarios
        </Link>
      </Button>
      <Card className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Editar Usuario</CardTitle>
            <CardDescription>Modifica los datos del usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input name="nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña (dejar en blanco para no cambiar)</Label>
                <Input name="password" type="password" value={formData.password || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input name="telefono" value={formData.telefono || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input name="cargo" value={formData.cargo || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractFile">Archivo del Contrato (PDF)</Label>
                <Input type="file" name="contractFile" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipo_contrato_id">Tipo de Contrato</Label>
                <Select
                  value={formData.tipo_contrato_id || ""}
                  onValueChange={(value) => handleSelectChange("tipo_contrato_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nivel_carrera_id">Nivel de Carrera</Label>
                <Select
                  value={formData.nivel_carrera_id || ""}
                  onValueChange={(value) => handleSelectChange("nivel_carrera_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {careerLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) =>
                    setFormData((prev: any) => ({ ...prev, activo: checked }))
                  }
                />
                <Label htmlFor="activo">Usuario Activo</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
