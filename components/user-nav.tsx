"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

export function UserNav() {
  const router = useRouter()

  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const userImage = "/placeholder.svg?height=32&width=32"

  // Estilos para admin: fondo y borde más notorio
  const isAdmin = user?.role === "admin"
  const avatarClass = isAdmin
    ? "h-8 w-8 ring-2 ring-yellow-400 bg-yellow-100 text-yellow-800"
    : "h-8 w-8"

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className={avatarClass}>
            <AvatarImage src={userImage} alt={user.name} />
            <AvatarFallback>
              {isAdmin ? (
                <span className="font-bold">ADM</span>
              ) : (
                user.name.charAt(0)
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
