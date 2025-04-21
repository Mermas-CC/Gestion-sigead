"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Fondo de imágenes en 3 columnas */}
      <div
        className="pointer-events-none fixed inset-0 z-0 flex"
        aria-hidden="true"
      >
        <div className="flex-1 h-full">
          <img
            src="/ilo1.jpeg"
            alt=""
            className="object-cover w-full h-full opacity-40"
            draggable={false}
          />
        </div>
        <div className="flex-1 h-full">
          <img
            src="/ilo2.jpeg"
            alt=""
            className="object-cover w-full h-full opacity-40"
            draggable={false}
          />
        </div>
        <div className="flex-1 h-full">
          <img
            src="/ilo3.jpeg"
            alt=""
            className="object-cover w-full h-full opacity-40"
            draggable={false}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container relative z-10 flex flex-col items-center justify-center gap-6 px-4 py-16 text-center md:py-24">
        {/* Logos de la plataforma y la institución */}
        <div className="flex flex-row items-center justify-center gap-8 mb-2">
          <img src="/logo.png" alt="Logo Plataforma" className="h-32 w-auto" />
          <img src="/ugel.png" alt="Logo Institución" className="h-32 w-auto" />
        </div>

        <p className="max-w-[900px] text-lg text-slate-700 dark:text-slate-300 md:text-xl">
          Gestiona tus solicitudes de licencias y permisos de manera eficiente y organizada.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register">Registrarse</Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => window.open('/manual.pdf', '_blank')}
          >
            Ver Manual
          </Button>
        </div>
      </div>
    </div>
  )
}
