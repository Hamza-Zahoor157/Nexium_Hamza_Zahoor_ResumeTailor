import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Create a single Supabase client for server-side use
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { email } = await request.json()

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: { email },
    create: { supabaseId: user.id, email },
  })

  return NextResponse.json(dbUser)
}