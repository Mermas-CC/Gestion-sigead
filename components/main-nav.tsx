"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  const isAdmin = pathname.startsWith("/admin")
  const links = isAdmin
    ? [
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/users", label: "Usuarios" },
        { href: "/admin/solicitudes", label: "Solicitudes" },
        { href: "/admin/reports", label: "Reportes" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/solicitudes", label: "Mis Solicitudes" },
      ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"} className="text-xl font-bold">
        GestPermisos
      </Link>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href ? "text-primary" : "text-muted-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
