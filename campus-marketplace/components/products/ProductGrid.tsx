// components/products/ProductGrid.tsx
'use client'

import { useState } from 'react'
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts'
import { usePresence } from '@/hooks/usePresence'
import ProductCard from './ProductCard'
import type { Product, Category } from '@/types'
import type { User } from '@supabase/supabase-js'

interface ProductGridProps {
  initialProducts: Product[]
  categories: Category[]
  currentUser: User | null
}

export default function ProductGrid({ initialProducts, categories, currentUser }: ProductGridProps) {
  const { products } = useRealtimeProducts(initialProducts)
  const { isOnline } = usePresence(currentUser?.id)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const filtered = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Count + live indicator */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''} available
        </p>
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live updates on
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-lg font-medium text-slate-600">No listings found</p>
          <p className="text-sm mt-1">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currentUser={currentUser}
              isSellerOnline={isOnline(product.seller_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
