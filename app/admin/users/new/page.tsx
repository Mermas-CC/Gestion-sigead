"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "user",
    isActive: true,
    phone: "",
    position: "",
    contractFile: null as File | null,
    contractTypeId: "",
    careerLevelId: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [contractTypes, setContractTypes] = useState<{ id: string; name: string }[]>([])
  const [careerLevels, setCareerLevels] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    // Fetch contract types and career levels
    async function fetchOptions() {
      try {
        const contractRes = await fetch("/api/admin/contract-types")
        const contractData = await contractRes.json()

        const careerRes = await fetch("/api/admin/career-levels")
        const careerData = await careerRes.json()

        setContractTypes(contractData)
        setCareerLevels(careerData)
      } catch (err) {
        console.error("Error fetching contract types and career levels:", err)
      }
    }

    fetchOptions()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    setFormData((prev) => ({
      ...prev,
      contractFile: file,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validar si es necesario el archivo de contrato
    if (formData.contractFile === null && formData.contractTypeId) {
      const selectedContractType = contractTypes.find(
        (contract) => contract.id === formData.contractTypeId
      )

      if (selectedContractType && selectedContractType.name === "Contrato CAS") {
        setError("Debe adjuntar el archivo de contrato para este tipo de contrato")
        setIsLoading(false)
        return
      }
    }

    // Crear un objeto de datos para enviar como JSON
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      department: formData.department || "",
      role: formData.role || "user",
      isActive: formData.isActive ? "true" : "false",
      phone: formData.phone || "",
      position: formData.position || "",
      contractFile: formData.contractFile ? formData.contractFile.name : null, // solo el nombre del archivo
      contractTypeId: formData.contractTypeId,
      careerLevelId: formData.careerLevelId,
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend), // Enviar como JSON
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al crear el usuario")
      }

      router.push("/admin/users")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a usuarios
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Usuario</h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>Completa los campos para crear un nuevo usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Campos de información del usuario */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input name="password" type="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input name="position" value={formData.position} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractFile">Archivo del Contrato (PDF)</Label>
                <Input type="file" name="contractFile" accept="application/pdf" onChange={handleFileChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contractTypeId">Tipo de Contrato</Label>
                <Select
                  value={formData.contractTypeId}
                  onValueChange={(value) => handleSelectChange("contractTypeId", value)}
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
                <Label htmlFor="careerLevelId">Nivel de Carrera</Label>
                <Select
                  value={formData.careerLevelId}
                  onValueChange={(value) => handleSelectChange("careerLevelId", value)}
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
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="isActive">Usuario Activo</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
