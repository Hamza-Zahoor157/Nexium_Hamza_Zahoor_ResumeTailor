import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { prisma } from '@/lib/prisma'
import { getSupabaseUser } from '@/utils/supabase/server' // custom function for server-side auth

export async function POST(req: Request) {
  const body = await req.json()
  const { resume, jobTitle } = body

  const user = await getSupabaseUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `Tailor this resume for job title: ${jobTitle}\n\nResume:\n${resume}`

  const aiResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  })

  const tailored = aiResponse.choices[0]?.message?.content || 'No response'

  // Store in DB
  const saved = await prisma.resume.create({
    data: {
      original: resume,
      tailored,
      user: { connect: { supabaseId: user.id } },
    },
  })

  return NextResponse.json({ tailored, saved })
}
