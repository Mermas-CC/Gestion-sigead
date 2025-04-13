"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  fechaCreacion: string
  leida: boolean
}

export function NotificationsButton() {
  const [notifications, setNotifications] = useState<Notificacion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]
        const response = await fetch("/api/notificaciones", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!response.ok) {
          throw new Error("Error al cargar notificaciones")
        }
        const data = await response.json()
        setNotifications(data.notificaciones || [])
      } catch (error) {
        console.error("Error al cargar notificaciones:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.leida).length

  const markAsRead = async (id: number) => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, leida: true }),
      })

      setNotifications(notifications.map((n) => (n.id === id ? { ...n, leida: true } : n)))
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}),
      })

      setNotifications(notifications.map((n) => ({ ...n, leida: true })))
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" className="h-auto p-0 text-xs text-muted-foreground" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex h-full items-center justify-center p-4">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
              No tienes notificaciones
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 border-b p-4 hover:bg-muted",
                    !notification.leida && "bg-muted/50",
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">{notification.titulo}</h5>
                    <span className="text-xs text-muted-foreground">{formatDate(notification.fechaCreacion)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.mensaje}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
