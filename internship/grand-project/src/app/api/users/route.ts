import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { supabaseId, email } = await req.json()
  
  const user = await prisma.user.create({
    data: { supabaseId, email }
  })

  return NextResponse.json(user)
}