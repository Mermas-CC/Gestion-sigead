import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 text-center md:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Sistema de Gestión Administrativa (SIGEAD)
        </h1>
        <p className="max-w-[700px] text-lg text-slate-700 dark:text-slate-300 md:text-xl">
          Gestiona tus solicitudes de licencias y permisos de manera eficiente y organizada.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Registrarse</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
