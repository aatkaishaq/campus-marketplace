// app/page.tsx
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import ProductGrid from '@/components/products/ProductGrid'
import HeroSection from '@/components/layout/HeroSection'
import type { Product, Category } from '@/types'

export const revalidate = 0

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Get current user (may be null — homepage is public)
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch ALL available products from ALL sellers.
  // RLS "Public view available products" policy allows this for everyone —
  // logged in or not. The key is we filter status = 'available' explicitly.
  let query = supabase
    .from('products')
    .select(`
      id,
      seller_id,
      category_id,
      title,
      description,
      price,
      image_url,
      status,
      created_at,
      updated_at,
      profiles ( username, avatar_url, is_online ),
      categories ( name )
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (params.category) {
    query = query.eq('category_id', params.category)
  }
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  const { data: products, error } = await query

  if (error) {
    console.error('Products fetch error:', error.message)
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <HeroSection />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductGrid
          initialProducts={(products as Product[]) ?? []}
          categories={(categories as Category[]) ?? []}
          currentUser={user}
        />
      </main>
    </div>
  )
}
