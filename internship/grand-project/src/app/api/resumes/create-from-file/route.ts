import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import pdf from 'pdf-parse';

import mammoth from 'mammoth';

// Helper function to get Supabase user from JWT
async function getSupabaseUser(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Not authenticated' };
  }
  const jwt = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(jwt);

  if (error || !data.user) {
    return { user: null, error: 'Not authenticated' };
  }

  return { user: data.user, error: null };
}

// Helper functions for text extraction
async function getTextFromPdf(buffer: Buffer): Promise<string> {
  // This options object with a custom pagerender is the correct workaround
  // for a known bug in pdf-parse that causes crashes in Next.js serverless environments.
  // It processes page by page to avoid memory issues and correctly extracts text.
  const options = {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      return textContent.items.map((item: any) => item.str).join(' ');
    },
  };

  const data = await pdf(buffer, options);
  // The text from all pages is concatenated into the `text` property.
  return data.text;
}

async function getTextFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

// The main POST handler
export async function POST(request: NextRequest) {
  // 1. Authenticate the user
  const { user, error: userError } = await getSupabaseUser(request);
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // 2. Get file and jobId from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const jobId = formData.get('jobId') as string | null;

    if (!file || !jobId) {
      return NextResponse.json({ error: 'File and jobId are required' }, { status: 400 });
    }

    // 3. Extract text from the file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      extractedText = await getTextFromPdf(fileBuffer);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
      extractedText = await getTextFromDocx(fileBuffer);
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or DOCX.' }, { status: 400 });
    }

    // 4. Verify user and job ownership
    const userProfile = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!userProfile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const job = await prisma.job.findFirst({
        where: { id: jobId, userId: userProfile.id }
    });

    if (!job) {
        return NextResponse.json({ error: 'Job not found or user does not have permission' }, { status: 404 });
    }

    // 5. Create the resume record in MongoDB
    const newResume = await prisma.resume.create({
      data: {
        jobId: jobId,
        userId: userProfile.id,
        original: extractedText,
        fileUrl: file.name, // Store original file name for reference
      },
    });

    // 6. Return the newly created resume object
    return NextResponse.json(newResume);

  } catch (e) {
    const error = e as Error;
    console.error('Create from file error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
