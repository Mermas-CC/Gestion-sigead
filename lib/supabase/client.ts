import { createClient } from "@supabase/supabase-js"

// Singleton para evitar múltiples instancias en el cliente
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Crear cliente de Supabase para el navegador
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      storageKey: "supabase-auth",
    },
  })
}

// Obtener cliente de Supabase (singleton)
export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient()
  }
  return supabaseClient
}
