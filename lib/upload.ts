// lib/upload.ts

export function getFileUrl(ruta: string): string {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000"
  
    // Si ya empieza con "/uploads", no lo dupliques
    if (ruta.startsWith("/uploads")) {
      return `${baseUrl}${ruta}`
    }
  
    // Si no empieza con "/", agrégala
    const rutaFinal = ruta.startsWith("/") ? ruta : `/${ruta}`
    return `${baseUrl}/uploads${rutaFinal}`
  }
  