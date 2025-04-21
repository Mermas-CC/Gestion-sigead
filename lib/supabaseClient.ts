import { createClient, SupabaseClient, PostgrestResponse, PostgrestError } from '@supabase/supabase-js'

// Types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Initialize the default client with anon key (limited permissions)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Initialize admin client with service role key (full permissions)
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || ''
)

/**
 * Execute a query using Supabase's built-in functions
 * This is a wrapper to maintain compatibility with the existing API
 */
export async function query<T = any>(
  text: string, 
  params?: any[],
  options?: { useServiceRole?: boolean }
): Promise<QueryResult<T>> {
  const start = Date.now()
  const client = options?.useServiceRole ? supabaseAdmin : supabase
  
  try {
    console.log('Executing query:', {
      text,
      params: params ? '[PARAMS PRESENT]' : '[NO PARAMS]'
    })
    
    // Convert SQL query and params to a parameterized RPC call
    const { data, error, count } = await client.rpc('run_sql', {
      query_text: text,
      query_params: params
    })
    
    if (error) throw error
    
    const duration = Date.now() - start
    const result = {
      rows: data || [],
      rowCount: count || 0
    }
    
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

/**
 * Alternative query method using Supabase data methods directly
 * For when you need to use Supabase's built-in methods instead of raw SQL
 */
export const from = <T = any>(table: string) => {
  return {
    select: (columns = '*') => {
      const start = Date.now()
      return {
        execute: async (): Promise<QueryResult<T>> => {
          try {
            console.log(`Executing Supabase select on ${table}:`, { columns })
            
            const { data, error, count } = await supabase
              .from(table)
              .select(columns, { count: 'exact' })
            
            if (error) throw error
            
            const duration = Date.now() - start
            const result = {
              rows: data || [],
              rowCount: count || 0
            }
            
            console.log(`Query on ${table} completed:`, {
              duration,
              rowCount: result.rowCount
            })
            
            return result
          } catch (error) {
            console.error(`Database error on ${table}:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            })
            throw error
          }
        }
      }
    },
    insert: (values: any) => {
      const start = Date.now()
      return {
        execute: async (): Promise<QueryResult<T>> => {
          try {
            console.log(`Executing Supabase insert on ${table}:`, { 
              valueCount: Array.isArray(values) ? values.length : 1 
            })
            
            const { data, error, count } = await supabase
              .from(table)
              .insert(values)
              .select()
            
            if (error) throw error
            
            const duration = Date.now() - start
            const result = {
              rows: data || [],
              rowCount: data?.length || 0
            }
            
            console.log(`Insert on ${table} completed:`, {
              duration,
              rowCount: result.rowCount
            })
            
            return result
          } catch (error) {
            console.error(`Database error on ${table}:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            })
            throw error
          }
        }
      }
    },
    update: (values: any) => {
      const start = Date.now()
      return {
        where: (column: string, operator: string, value: any) => {
          return {
            execute: async (): Promise<QueryResult<T>> => {
              try {
                console.log(`Executing Supabase update on ${table}:`, { column, operator, value })
                
                let query = supabase
                  .from(table)
                  .update(values)
                
                // Apply filter based on operator
                if (operator === '=') {
                  query = query.eq(column, value)
                } else if (operator === '!=') {
                  query = query.neq(column, value)
                } else if (operator === '>') {
                  query = query.gt(column, value)
                } else if (operator === '>=') {
                  query = query.gte(column, value)
                } else if (operator === '<') {
                  query = query.lt(column, value)
                } else if (operator === '<=') {
                  query = query.lte(column, value)
                } else if (operator === 'LIKE') {
                  query = query.like(column, value)
                } else if (operator === 'IN') {
                  query = query.in(column, Array.isArray(value) ? value : [value])
                }
                
                const { data, error } = await query.select()
                
                if (error) throw error
                
                const duration = Date.now() - start
                const result = {
                  rows: data || [],
                  rowCount: data?.length || 0
                }
                
                console.log(`Update on ${table} completed:`, {
                  duration,
                  rowCount: result.rowCount
                })
                
                return result
              } catch (error) {
                console.error(`Database error on ${table}:`, {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined
                })
                throw error
              }
            }
          }
        }
      }
    },
    delete: () => {
      const start = Date.now()
      return {
        where: (column: string, operator: string, value: any) => {
          return {
            execute: async (): Promise<QueryResult<T>> => {
              try {
                console.log(`Executing Supabase delete on ${table}:`, { column, operator, value })
                
                let query = supabase
                  .from(table)
                  .delete()
                
                // Apply filter based on operator
                if (operator === '=') {
                  query = query.eq(column, value)
                } else if (operator === '!=') {
                  query = query.neq(column, value)
                } else if (operator === '>') {
                  query = query.gt(column, value)
                } else if (operator === '>=') {
                  query = query.gte(column, value)
                } else if (operator === '<') {
                  query = query.lt(column, value)
                } else if (operator === '<=') {
                  query = query.lte(column, value)
                } else if (operator === 'LIKE') {
                  query = query.like(column, value)
                } else if (operator === 'IN') {
                  query = query.in(column, Array.isArray(value) ? value : [value])
                }
                
                const { data, error } = await query.select()
                
                if (error) throw error
                
                const duration = Date.now() - start
                const result = {
                  rows: data || [],
                  rowCount: data?.length || 0
                }
                
                console.log(`Delete on ${table} completed:`, {
                  duration,
                  rowCount: result.rowCount
                })
                
                return result
              } catch (error) {
                console.error(`Database error on ${table}:`, {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined
                })
                throw error
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Test Supabase connection
 */
export async function testConnection() {
  try {
    // Simple query to verify connection
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1)
    
    if (error) {
      throw error
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return false
  }
}

