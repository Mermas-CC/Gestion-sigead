"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, Plus, Upload } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function NuevaSolicitudButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    goceRemuneraciones: "con",
    tipoLicencia: "",
    motivo: "",
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    celular: "",
    correo: "",
    cargo: "",
    institucion: "",
    comentarios: "",
  })
  
  const opcionesLicencia = {
    con: [
      { value: "incapacidad", label: "Licencia por incapacidad temporal" },
      { value: "familiar_grave_accidente", label: "Por familiar grave o terminal o sufra accidente grave" },
      { value: "maternidad", label: "Licencia por maternidad" },
      { value: "aplazamiento_prenatal", label: "Aplazamiento del descanso prenatal" },
      { value: "paternidad", label: "Licencia por paternidad" },
      { value: "adopcion", label: "Licencia por adopción" },
      { value: "siniestros", label: "Licencia por siniestros" },
      { value: "estudios_posgrado", label: "Por estudios de posgrado, especialización o perfeccionamiento" },
      { value: "capacitacion_minedu", label: "Por capacitación planeada por MINEDU o los gobiernos regionales" },
      { value: "representacion_estado", label: "Por asumir representación oficial del estado Peruano" },
      { value: "citacion_expresa", label: "Por citación expresa, judicial, militar o policial" },
      { value: "representacion_sindical", label: "Licencia por representación sindical" },
      { value: "licencia_nacional", label: "Licencia de alcance nacional" },
      { value: "cargo_politico", label: "Por desempeñarse como consejero regional o regidor municipal" },
      { value: "asistencia_medica", label: "Para asistencia médica, terapia de rehabilitación en caso de discapacidad" },
      { value: "examenes_oncologicos", label: "Para realizar exámenes oncológicos preventivos anuales" },
    ],
    sin: [
      { value: "motivos_particulares", label: "Licencia por Motivos Particulares" },
      { value: "capacitacion_no_oficial", label: "Por capacitación no oficializada" },
      { value: "funcion_publica", label: "Por desempeño de funciones públicas por elección o por asumir cargos políticos o de confianza" },
      { value: "enfermedad_familiar", label: "Por enfermedad grave de los padres, cónyuge, conviviente reconocido judicialmente o hijos" },
      { value: "conclusion_anticipada", label: "Conclusión anticipada de la licencia" },
      { value: "permiso_docentes", label: "Permisos para docentes de educación básica regular y técnico productiva" },
      { value: "permiso_enfermedad", label: "Permiso por enfermedad" },
      { value: "permiso_maternidad", label: "Permiso por maternidad" },
      { value: "permiso_lactancia", label: "Permiso por lactancia" },
      { value: "permiso_capacitacion_oficial", label: "Permiso por capacitación oficializada" },
      { value: "permiso_citacion", label: "Por citación expresa judicial, militar o policial" },
      { value: "permiso_onomastico", label: "Permiso por onomástico" },
      { value: "permiso_dia_maestro", label: "Permiso por: día del maestro" },
      { value: "permiso_docencia_universitaria", label: "Permiso para ejercer como docente en universidad" },
      { value: "permiso_representacion_sindical", label: "Permiso por representar sindicalmente" },
    ],
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("El archivo no debe superar los 5MB")
        return
      }
      setArchivo(file)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Validar datos
      if (!formData.tipoLicencia || !formData.motivo || !formData.fechaInicio || !formData.fechaFin) {
        setError("Todos los campos obligatorios deben ser completados")
        setIsSubmitting(false)
        return
      }

      let response, data

      if (archivo) {
        // Enviar todo como FormData si hay archivo
        const formDataToSend = new FormData()
        formDataToSend.append("tipo", formData.tipoLicencia)
        formDataToSend.append("motivo", formData.motivo)
        formDataToSend.append("fechaInicio", formData.fechaInicio.toISOString().split("T")[0])
        formDataToSend.append("fechaFin", formData.fechaFin.toISOString().split("T")[0])
        formDataToSend.append("celular", formData.celular)
        formDataToSend.append("correo", formData.correo)
        formDataToSend.append("cargo", formData.cargo)
        formDataToSend.append("institucion", formData.institucion)
        formDataToSend.append("goceRemuneraciones", (formData.goceRemuneraciones === "con").toString())
        formDataToSend.append("comentarios", formData.comentarios)
        formDataToSend.append("archivo", archivo)

        response = await fetch("/api/solicitudes", {
          method: "POST",
          body: formDataToSend,
        })
      } else {
        // Enviar como JSON si no hay archivo
        response = await fetch("/api/solicitudes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goceRemuneraciones: formData.goceRemuneraciones === "con",
            tipo: formData.tipoLicencia,
            motivo: formData.motivo,
            fechaInicio: formData.fechaInicio.toISOString().split("T")[0],
            fechaFin: formData.fechaFin.toISOString().split("T")[0],
            celular: formData.celular,
            correo: formData.correo,
            cargo: formData.cargo,
            institucion: formData.institucion,
            comentarios: formData.comentarios,
          }),
        })
      }

      data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al crear la solicitud")
      }

      // Resetear el formulario y cerrar el diálogo
      setFormData({
        goceRemuneraciones: "con",
        tipoLicencia: "",
        motivo: "",
        fechaInicio: null,
        fechaFin: null,
        celular: "",
        correo: "",
        cargo: "",
        institucion: "",
        comentarios: "",
      })
      setArchivo(null)
      setOpen(false)

      // Recargar la página para mostrar la nueva solicitud
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Licencia o Permiso</DialogTitle>
            <DialogDescription>Completa el formulario para solicitar una licencia o permiso.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label>Tipo de Licencia</Label>
              <RadioGroup
                value={formData.goceRemuneraciones}
                onValueChange={(value) => setFormData({ ...formData, goceRemuneraciones: value, tipoLicencia: "" })}
                className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="con" id="con-goce" />
                  <Label htmlFor="con-goce" className="font-normal">
                    Con goce de remuneraciones
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sin" id="sin-goce" />
                  <Label htmlFor="sin-goce" className="font-normal">
                    Sin goce de remuneraciones
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipoLicencia">Categoría de Licencia/Permiso</Label>
              <Select
                value={formData.tipoLicencia}
                onValueChange={(value) => setFormData({ ...formData, tipoLicencia: value })}
                required
              >
                <SelectTrigger id="tipoLicencia">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>
                      {formData.goceRemuneraciones === "con"
                        ? "Con goce de remuneraciones"
                        : "Sin goce de remuneraciones"}
                    </SelectLabel>
                    {opcionesLicencia[formData.goceRemuneraciones as "con" | "sin"].map((opcion) => (
                      <SelectItem key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                placeholder="Describe el motivo de tu solicitud"
                className="min-h-[80px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="fechaInicio"
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.fechaInicio && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fechaInicio ? (
                        format(formData.fechaInicio, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.fechaInicio || undefined}
                      onSelect={(date) => setFormData({ ...formData, fechaInicio: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fechaFin">Fecha de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="fechaFin"
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.fechaFin && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fechaFin ? (
                        format(formData.fechaFin, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.fechaFin || undefined}
                      onSelect={(date) => setFormData({ ...formData, fechaFin: date })}
                      initialFocus
                      disabled={(date) => (formData.fechaInicio ? date < formData.fechaInicio : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  placeholder="Ej: 999888777"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="correo">Correo Electrónico</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cargo">Cargo Actual</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ej: Docente, Administrativo"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="institucion">Institución donde labora</Label>
                <Input
                  id="institucion"
                  value={formData.institucion}
                  onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                  placeholder="Nombre de la institución"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="archivo">Archivo Adjunto (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="archivo"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("archivo")?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {archivo ? archivo.name : "Seleccionar archivo"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (máx. 5MB)</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comentarios">Comentarios Adicionales</Label>
              <Textarea
                id="comentarios"
                value={formData.comentarios}
                onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                placeholder="Información adicional relevante para tu solicitud"
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
