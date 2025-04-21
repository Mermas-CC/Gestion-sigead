'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function BotonSolicitudVacaciones() {
  const [puedeSolicitar, setPuedeSolicitar] = useState<boolean | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState({
    celular: '',
    correo: '',
    cargo: '',
    institucion: '',
    comentario: '',
    fecha_inicio: '',
    fecha_fin: '',
    archivo: null as File | null,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // Obtener el usuario autenticado
        const userResponse = await fetch('/api/auth/me')
        if (!userResponse.ok) throw new Error('Error al obtener el usuario autenticado')
        const userData = await userResponse.json()

        const userId = userData.user?.id
        if (!userId) throw new Error('No se pudo obtener el ID del usuario')

        // Consultar permisos del usuario
        const response = await fetch(`/api/user/permissions?userId=${userId}`)
        if (!response.ok) throw new Error('Error al obtener permisos')
        const data = await response.json()
        setPuedeSolicitar(data.puedeSolicitarVacaciones)
      } catch (error) {
        console.error('Error al obtener los permisos:', error)
        setPuedeSolicitar(false)
      }
    }

    fetchPermissions()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setForm({ ...form, archivo: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Obtener el usuario autenticado
      const userResponse = await fetch('/api/auth/me')
      if (!userResponse.ok) throw new Error('Error al obtener el usuario autenticado')
      const userData = await userResponse.json()

      const userId = userData.user?.id
      if (!userId) throw new Error('No se pudo obtener el ID del usuario')

      const formData = new FormData()
      formData.append('tipo', 'vacaciones') // Valor por defecto
      formData.append('motivo', 'Vacaciones solicitadas') // Valor por defecto
      formData.append('fechaInicio', form.fecha_inicio)
      formData.append('fechaFin', form.fecha_fin)
      formData.append('celular', form.celular)
      formData.append('correo', form.correo)
      formData.append('cargo', form.cargo)
      formData.append('institucion', form.institucion)
      formData.append('goceRemuneraciones', 'true') // Valor por defecto (vacaciones)
      formData.append('comentarios', form.comentario)

      if (form.archivo) {
        formData.append('archivo', form.archivo)
      }

      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        body: formData,
      })

      setLoading(false)

      if (res.ok) {
        const data = await res.json()
        toast.success('Solicitud enviada con éxito')
        setForm({
          celular: '',
          correo: '',
          cargo: '',
          institucion: '',
          comentario: '',
          fecha_inicio: '',
          fecha_fin: '',
          archivo: null,
        })
        setMostrarFormulario(false)
      } else {
        toast.error('Error al enviar solicitud. Intenta nuevamente.')
      }
    } catch (error) {
      setLoading(false)
      toast.error('Error al enviar solicitud. Intenta nuevamente.')
    }
  }

  if (puedeSolicitar === null) return <div>Cargando permisos...</div>
  if (!puedeSolicitar) return <div>No tienes permisos para solicitar vacaciones.</div>

  return (
    <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="primary">
          Solicitar Vacaciones
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <DialogHeader>
            <DialogTitle>Solicitud de Vacaciones</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                name="celular"
                value={form.celular}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                name="cargo"
                value={form.cargo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="institucion">Institución</Label>
              <Input
                id="institucion"
                name="institucion"
                value={form.institucion}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comentario">Comentario</Label>
              <Textarea
                id="comentario"
                name="comentario"
                value={form.comentario}
                onChange={handleChange}
                placeholder="Comentario adicional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
              <Input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                value={form.fecha_inicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fecha_fin">Fecha de Fin</Label>
              <Input
                id="fecha_fin"
                name="fecha_fin"
                type="date"
                value={form.fecha_fin}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="archivo">Archivo (Opcional)</Label>
              <Input
                id="archivo"
                name="archivo"
                type="file"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
