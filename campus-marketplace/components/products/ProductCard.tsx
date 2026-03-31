// components/products/ProductCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Product } from '@/types'
import type { User } from '@supabase/supabase-js'

interface ProductCardProps {
  product: Product
  currentUser: User | null
  isSellerOnline?: boolean
}

export default function ProductCard({ product, currentUser, isSellerOnline }: ProductCardProps) {
  const isMine = currentUser?.id === product.seller_id
  const placeholderImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop'

  return (
    <Link
      href={`/products/${product.id}`}
      className="card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 bg-slate-100 overflow-hidden flex-shrink-0">
        <Image
          src={product.image_url ?? placeholderImage}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute top-2 left-2">
          <StatusBadge status={product.status} />
        </div>
        {product.categories?.name && (
          <div className="absolute top-2 right-2">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {product.categories.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 truncate text-base group-hover:text-brand-600 transition-colors">
          {product.title}
        </h3>

        {product.description && (
          <p className="text-slate-500 text-sm mt-1 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        <div className="mt-3">
          <span className="text-xl font-bold text-brand-600">
            PKR {Number(product.price).toLocaleString()}
          </span>
        </div>

        {/* Seller info */}
        {product.profiles && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="relative flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
                  {product.profiles.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                {isSellerOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>
              <span className="truncate max-w-[100px]">{product.profiles.username}</span>
            </div>

            {/* Quick action hint */}
            <span className="text-xs text-slate-400 group-hover:text-brand-500 transition-colors">
              {isMine ? 'Your listing' : 'View →'}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}