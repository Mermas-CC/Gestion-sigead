import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 text-center md:py-24">

        {/* Logo más grande */}
        <img src="/logo.png" alt="Logo Institucional" className="h-40 w-auto" />

        <p className="max-w-[900px] text-lg text-slate-700 dark:text-slate-300 md:text-xl">
          Gestiona tus solicitudes de licencias y permisos de manera eficiente y organizada.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          {/* Botón de registro */}
          <Button asChild size="lg" variant="outline">
            <Link href="/register">Registrarse</Link>
          </Button>
        </div>
        
      </div>
    </div>
  )
}
