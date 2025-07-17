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

export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const jobs = await prisma.job.findMany({
      where: { userId: userProfile.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(jobs)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { title, description, company, skills } = await request.json()

    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        company,
        skills,
        userId: userProfile.id,
      },
    })

    return NextResponse.json(newJob, { status: 201 })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { jobId } = await request.json();

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // First, verify the user owns the job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: userProfile.id,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found or you do not have permission to delete it.' }, { status: 404 });
    }

    // If ownership is confirmed, delete the job
    await prisma.job.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Failed to delete job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}