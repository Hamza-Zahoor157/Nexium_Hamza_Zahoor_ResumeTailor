'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUserEmail(session.user.email || '')
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading dashboard...</div>
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

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-indigo-50 rounded-xl p-6 shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-indigo-700">📄 Resume Tailoring</h2>
            <p className="text-gray-600 mt-2">Get started with tailoring your resume using AI.</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-6 shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-indigo-700">📊 Your Submissions</h2>
            <p className="text-gray-600 mt-2">Track the tailored resumes you've generated.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
