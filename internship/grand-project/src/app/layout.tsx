'use client'
import { useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      console.log('User session:', session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  )
}
