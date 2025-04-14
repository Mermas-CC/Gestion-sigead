"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth"; // Para la autenticación

interface NuevoReclamoButtonProps {
  solicitudId: number;
}

export function NuevoReclamoButton({ solicitudId }: NuevoReclamoButtonProps) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!mensaje.trim()) {
      toast.error("El mensaje es obligatorio");
      return;
    }

    setLoading(true);

    try {
      const user = await getCurrentUser(); // Obtener usuario autenticado
      if (!user) {
        toast.error("No se pudo obtener el usuario.");
        return;
      }

      const formData = new FormData();
      formData.append("solicitud_id", String(solicitudId));
      formData.append("usuario_id", String(user.id));
      formData.append("mensaje", mensaje);
      if (archivo) formData.append("archivo", archivo);

      const res = await fetch("/api/reclamos", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Reclamo enviado correctamente");
        setOpen(false);
        setMensaje("");
        setArchivo(null);
      } else {
        toast.error("Error al enviar el reclamo");
      }
    } catch (err) {
      toast.error("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Presentar Reclamo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Reclamo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Mensaje del reclamo *</Label>
            <Textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describe por qué estás presentando este reclamo"
              required
            />
          </div>

          <div>
            <Label>Archivo adjunto (opcional)</Label>
            <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
          </div>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Enviar reclamo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
