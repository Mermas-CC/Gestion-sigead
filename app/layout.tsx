import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Sistema de Gestión de Permisos",
  description: "Aplicación para gestionar solicitudes de permisos laborales",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <header className="flex items-center justify-start p-4 bg-gray-100 dark:bg-gray-800">
  <img src="/logo.png" alt="Logo Institucional" className="h-10" />
  <span className="text-lg font-bold text-gray-700 dark:text-gray-300 ml-2">Sistema de Gestión de Permisos</span>
</header>

          {children}
        </ThemeProvider>
        <footer className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            © {new Date().getFullYear()} Sistema de Gestión de Permisos. Todos los derechos reservados.
          </span>
        </footer>
      </body>
    </html>
  )
}
