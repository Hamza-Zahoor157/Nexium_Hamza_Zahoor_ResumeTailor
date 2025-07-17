import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client'; // Using client to verify token
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { jobId } = await request.json();

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Not Authenticated' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const userProfile = await prisma.user.findUnique({
        where: { supabaseId: user.id },
    });

    if (!userProfile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: userProfile.id, // Correctly check against the Prisma user ID
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
