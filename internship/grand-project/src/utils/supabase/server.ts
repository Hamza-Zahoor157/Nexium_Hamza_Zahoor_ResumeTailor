// /utils/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getSupabaseUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')

  const { data, error } = await supabase.auth.getUser(token)

  if (error) {
    console.error('Error getting user from token:', error)
    return null
  }

  return data.user
}
