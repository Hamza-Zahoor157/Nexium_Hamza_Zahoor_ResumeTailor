import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId, title, description } = await req.json()
  
  const job = await prisma.job.create({
    data: { 
      userId,
      title,
      description,
      skills: [] 
    }
  })

  return NextResponse.json(job)
}