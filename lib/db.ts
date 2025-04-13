import { Pool } from "pg"
import { createPool } from "@vercel/postgres"

// Determinar si estamos en producción (Vercel) o desarrollo
const isProduction = process.env.NODE_ENV === "production"

// Usar @vercel/postgres en producción y pg en desarrollo
let pool: Pool

if (isProduction) {
  pool = createPool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  }) as unknown as Pool
} else {
  // Log connection details for debugging
  console.log('Database environment variables:', {
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_PORT: 5432,
    // NO loguear la contraseña por seguridad
  })
  
  // Verificar que todas las variables necesarias estén definidas
  const requiredEnvVars = ['POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_PASSWORD']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars)
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
  
  pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    port: 5432,
  })
}

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    console.log('Executing query:', {
      text,
      params: params ? '[PARAMS PRESENT]' : '[NO PARAMS]'
    })
    
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    
    console.log('Query completed:', {
      text,
      duration,
      rowCount: result.rowCount
    })
    
    return result
  } catch (error) {
    console.error('Database query error:', {
      text,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

export async function getClient() {
  const client = await pool.connect()
  const query = client.query
  const release = client.release

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error("A client has been checked out for more than 5 seconds!")
    console.error(`The last executed query on this client was: ${client.lastQuery}`)
  }, 5000)

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args: any[]) => {
    client.lastQuery = args
    return query.apply(client, args)
  }

  client.release = () => {
    clearTimeout(timeout)
    client.query = query
    client.release = release
    return release.apply(client)
  }

  return client
}

export async function testConnection() {
  try {
    const result = await query('SELECT NOW()')
    console.log('Database connection test successful:', result.rows[0])
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}
