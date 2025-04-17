"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
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
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Obtener tipos de contrato y niveles de carrera
    async function fetchOptions() {
      try {
        const contractRes = await fetch("/api/admin/contract-types")
        const contractData = await contractRes.json()
        const careerRes = await fetch("/api/admin/career-levels")
        const careerData = await careerRes.json()
        setContractTypes(contractData)
        setCareerLevels(careerData)
      } catch (err) {
        // No bloquear el registro si falla
      }
    }
    fetchOptions()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    // Crear FormData para envío con archivo
    const body = new FormData()
    body.append("name", formData.name)
    body.append("email", formData.email)
    body.append("password", formData.password)
    body.append("department", formData.department || "")
    body.append("phone", formData.phone || "")
    body.append("position", formData.position || "")
    body.append("contractTypeId", formData.contractTypeId)
    body.append("careerLevelId", formData.careerLevelId)
    if (formData.contractFile) {
      body.append("contractFile", formData.contractFile)
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        body: body,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login?registered=true")
      }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <img src="/logo.png" alt="Logo Institucional" className="mx-auto h-16" />
          <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
          <CardDescription>Completa los campos para registrarte en el sistema</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {success && (
              <Alert variant="success">
                <AlertDescription>
                  Registro exitoso. Redirigiendo al inicio de sesión...
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
