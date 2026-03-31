// app/products/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ProductDetailClient from '@/components/products/ProductDetailClient'
import type { Product } from '@/types'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles ( username, avatar_url, is_online ),
      categories ( name )
    `)
    .eq('id', id)
    .single()

  if (error || !product) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetailClient
          product={product as Product}
          currentUser={user}
        />
      </main>
    </div>
  )
}