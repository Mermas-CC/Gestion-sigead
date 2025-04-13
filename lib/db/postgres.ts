import { Pool, PoolClient } from 'pg'

export let pool: Pool | null = null

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'ruben2',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    })

    // Log connection errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })

    // Test connection
    pool.connect().then((client) => {
      console.log('Successfully connected to PostgreSQL')
      client.release()
    }).catch((err) => {
      console.error('Error connecting to PostgreSQL:', err)
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  let client: PoolClient | null = null
  
  try {
    client = await pool.connect()
    const result = await client.query(text, params)
    return { rows: result.rows, rowCount: result.rowCount }
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  } finally {
    if (client) client.release()
  }
}

// Cleanup function to be called when shutting down
export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
