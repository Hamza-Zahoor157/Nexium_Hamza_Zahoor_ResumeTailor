import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// This function will create a Supabase client and validate the user's JWT.
async function getSupabaseUser(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Not authenticated' }
  }
  const jwt = authHeader.split(' ')[1]

  const { data, error } = await supabase.auth.getUser(jwt)

  if (error || !data.user) {
    return { user: null, error: 'Not authenticated' }
  }

  return { user: data.user, error: null }
}

export async function POST(request: NextRequest) {
  const { user, error: userError } = await getSupabaseUser(request);
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { resumeId } = await request.json();
    if (!resumeId) {
      return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
    }

    // 1. Fetch the resume and associated job data
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { job: true },
    });

    if (!resume || !resume.job) {
      return NextResponse.json({ error: 'Resume or associated job not found' }, { status: 404 });
    }

    // Security Check: Ensure the user owns the resume
    const userProfile = await prisma.user.findUnique({ where: { supabaseId: user.id }});
    if (resume.userId !== userProfile?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
        return NextResponse.json({ error: 'N8N webhook URL is not configured' }, { status: 500 });
    }

    // 2. Call the n8n workflow
    const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jobDescription: resume.job.description,
            resumeText: resume.original,
        }),
    });

    if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('n8n workflow error:', errorText);
        return NextResponse.json({ error: 'The AI workflow failed to process the request.' }, { status: 502 });
    }

    const aiResult = await n8nResponse.json();

    // 3. Update the resume with the AI-generated content
    const updatedResume = await prisma.resume.update({
        where: { id: resumeId },
        data: {
            tailored: aiResult.tailoredResume, // Assuming n8n returns this field
            analysis: aiResult.analysis,       // Assuming n8n returns this field
        },
    });

    return NextResponse.json(updatedResume);

  } catch (e) {
    const error = e as Error;
    console.error('AI Tailoring error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
