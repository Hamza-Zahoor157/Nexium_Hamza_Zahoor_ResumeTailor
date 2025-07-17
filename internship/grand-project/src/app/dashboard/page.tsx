'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { LogOut, PlusCircle, Briefcase, FileText } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email || '')

      try {
        const accessToken = session.access_token;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        };

        // First, ensure the user exists in our database
        await fetch('/api/users', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            supabaseId: session.user.id,
            email: session.user.email,
          }),
        });

        // Then, fetch the jobs for that user
        const response = await fetch('/api/jobs', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }
        const data = await response.json()
        setJobs(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('You must be logged in to delete a job.')
      return
    }

    try {
      const response = await fetch('/api/jobs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }

      // Refresh the job list
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading dashboard...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-indigo-700">Welcome 👋</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 font-medium hover:underline"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <p className="mt-4 text-gray-700">You're logged in as: <strong>{userEmail}</strong></p>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Your Jobs</h2>
            <Link href="/dashboard/jobs/new">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition">
                <PlusCircle className="w-5 h-5" />
                Add New Job
              </button>
            </Link>
          </div>

          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-indigo-700">{job.title}</h3>
                      {job.company && <p className="text-gray-600 font-medium">{job.company}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href={`/dashboard/jobs/${job.id}/tailor`} className="flex items-center gap-2 text-indigo-600 font-medium hover:underline">
                        <FileText className="w-5 h-5" />
                        Tailor Resume
                      </Link>
                      <button onClick={() => handleDelete(job.id)} className="flex items-center gap-2 text-red-600 font-medium hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs added yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a job you want to apply for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

