// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import DashboardClient from '@/components/products/DashboardClient'
import type { Product, Category } from '@/types'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: products } = await supabase
    .from('products')
    .select(`*, categories ( name )`)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.username ?? 'Seller'} 👋
          </h1>
          <p className="text-slate-500 mt-1">Manage your listings and track your sales.</p>
        </div>
        <DashboardClient
         initialProducts={(products as Product[]) ?? []}
categories={(categories as Category[]) ?? []}
          user={user}
        />
      </main>
    </div>
  )
}
