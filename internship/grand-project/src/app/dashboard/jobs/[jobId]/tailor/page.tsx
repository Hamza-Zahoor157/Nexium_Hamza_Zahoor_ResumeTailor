'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { TailorClientPage } from './client-page'

// Define the type for the Job object
interface Job {
  id: string;
  title: string;
  description: string;
  company: string | null;
}

export default function TailorPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      try {
        const accessToken = session.access_token;
        const response = await fetch('/api/jobs/get-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ jobId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch job details');
        }
        const data = await response.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Job Details...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">Job not found.</div>;
  }

  return <TailorClientPage job={job} />;
}
