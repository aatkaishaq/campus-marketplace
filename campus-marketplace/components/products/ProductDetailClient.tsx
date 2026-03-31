// components/products/ProductDetailClient.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Product } from '@/types'
import type { User } from '@supabase/supabase-js'

interface Props {
  product: Product
  currentUser: User | null
}

export default function ProductDetailClient({ product, currentUser }: Props) {
  const [status, setStatus] = useState(product.status)
  const [loading, setLoading] = useState(false)
  const [reserved, setReserved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const isMine = currentUser?.id === product.seller_id
  const isLoggedIn = !!currentUser
  const placeholderImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop'

  const handleBuyRequest = async () => {
  if (!isLoggedIn) {
    router.push('/auth')
    return
  }
  setLoading(true)
  setError(null)

  const { error: fnError } = await supabase.rpc('reserve_product', {
    product_id: product.id,
  })

  if (fnError) {
    setError('Could not reserve this item. It may have just been taken by someone else.')
  } else {
    setStatus('pending')
    setReserved(true)
  }
  setLoading(false)
}

  return (
    <div>
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 mb-6 transition-colors"
      >
        ← Back to listings
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left — Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
          <Image
            src={product.image_url ?? placeholderImage}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
          <div className="absolute top-4 left-4">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Right — Details */}
        <div className="flex flex-col">

          {/* Category */}
          {product.categories?.name && (
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full w-fit mb-3">
              {product.categories.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {product.title}
          </h1>

          {/* Price */}
          <div className="mt-4 mb-4">
            <span className="text-4xl font-bold text-brand-600">
              PKR {Number(product.price).toLocaleString()}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Description
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Seller card */}
          {product.profiles && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 mb-6">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-lg flex-shrink-0">
                {product.profiles.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-xs text-slate-400">Seller</p>
                <p className="font-semibold text-slate-900">{product.profiles.username}</p>
              </div>
              <div className="ml-auto">
                {product.profiles.is_online ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Offline</span>
                )}
              </div>
            </div>
          )}

          {/* Listed date */}
          <p className="text-xs text-slate-400 mb-6">
            Listed on {new Date(product.created_at).toLocaleDateString('en-PK', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>

          {/* Action */}
          <div className="mt-auto">
            {/* My own listing */}
            {isMine && (
              <div className="text-center bg-slate-50 border border-slate-200 rounded-xl py-4 px-6">
                <p className="text-slate-500 text-sm">This is your listing.</p>
                <Link
                  href="/dashboard"
                  className="text-brand-600 text-sm font-medium hover:underline mt-1 inline-block"
                >
                  Manage in Dashboard →
                </Link>
              </div>
            )}

            {/* Not logged in */}
            {!isLoggedIn && status === 'available' && (
              <button
                onClick={() => router.push('/auth')}
                className="btn-secondary w-full py-3 text-base"
              >
                Sign in to Buy
              </button>
            )}

            {/* Logged in buyer — available */}
            {isLoggedIn && !isMine && status === 'available' && !reserved && (
              <div className="space-y-3">
                <button
                  onClick={handleBuyRequest}
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Reserving...
                    </span>
                  ) : '🛒 Request to Buy'}
                </button>
                <p className="text-xs text-slate-400 text-center">
                  This will reserve the item for 24 hours while you arrange with the seller.
                </p>
              </div>
            )}

            {/* Just reserved */}
            {reserved && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold">✅ Item Reserved!</p>
                <p className="text-green-600 text-sm mt-1">
                  Contact <strong>{product.profiles?.username}</strong> to arrange the exchange.
                  Reserved for 24 hours.
                </p>
              </div>
            )}

            {/* Already pending */}
            {!reserved && status === 'pending' && !isMine && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-yellow-700 font-semibold">⏳ Currently Reserved</p>
                <p className="text-yellow-600 text-sm mt-1">
                  This item is reserved by another buyer. It will auto-release in 24 hours if not confirmed.
                </p>
              </div>
            )}

            {/* Sold */}
            {status === 'sold' && (
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-slate-600 font-semibold">This item has been sold.</p>
                <Link href="/" className="text-brand-600 text-sm hover:underline mt-1 inline-block">
                  Browse other listings →
                </Link>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}