import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

// These will be populated by the user in .env.local later
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
