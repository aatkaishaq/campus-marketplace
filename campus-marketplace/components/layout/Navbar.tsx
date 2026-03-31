// components/layout/Navbar.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="text-xl font-bold text-brand-700">CampusMarket</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-slate-600 hover:text-brand-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-brand-50"
            >
              Browse
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-brand-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-brand-50"
                >
                  My Listings
                </Link>
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm text-slate-600 hidden sm:block">
                    {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="btn-secondary text-sm py-1.5"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <Link href="/auth" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
