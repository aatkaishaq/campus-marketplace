// components/products/DashboardClient.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductForm from './ProductForm'
import StatusBadge from '@/components/ui/StatusBadge'
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts'
import type { Product, Category, ProductStatus } from '@/types'
import type { User } from '@supabase/supabase-js'

interface DashboardClientProps {
  initialProducts: Product[]
  categories: Category[]
  user: User
}

const STATS_CONFIG: { label: string; status: ProductStatus | 'all' }[] = [
  { label: 'Total', status: 'all' },
  { label: 'Available', status: 'available' },
  { label: 'Pending', status: 'pending' },
  { label: 'Sold', status: 'sold' },
]

export default function DashboardClient({ initialProducts, categories, user }: DashboardClientProps) {
  // Reuse realtime hook — dashboard also stays live
  const { products } = useRealtimeProducts(
    initialProducts.filter((p) => p.seller_id === user.id)
  )

  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const stats = STATS_CONFIG.map((s) => ({
    ...s,
    count: s.status === 'all' ? products.length : products.filter((p) => p.status === s.status).length,
  }))

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    setDeletingId(id)
    await supabase.from('products').delete().eq('id', id).eq('seller_id', user.id)
    setDeletingId(null)
  }

  const handleStatusChange = async (product: Product, newStatus: ProductStatus) => {
    await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', product.id)
      .eq('seller_id', user.id)
  }

  const openEdit = (product: Product) => {
    setEditProduct(product)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditProduct(null)
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-3xl font-bold text-brand-600">{s.count}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Your Listings</h2>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true) }}
          className="btn-primary text-sm"
        >
          + New Listing
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editProduct ? 'Edit Listing' : 'New Listing'}
            </h3>
            <ProductForm
              categories={categories}
              user={user}
              editProduct={editProduct}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {/* Product table */}
      {products.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium text-slate-600">No listings yet</p>
          <p className="text-sm mt-1">Post your first item to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 truncate max-w-xs">{product.title}</p>
                        {product.categories?.name && (
                          <p className="text-slate-400 text-xs mt-0.5">{product.categories.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-600">
                      PKR {Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                        >
                          Edit
                        </button>
                        {product.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(product, 'sold')}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Mark Sold
                          </button>
                        )}
                        {product.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(product, 'available')}
                            className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
                          >
                            Unlist
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          {deletingId === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
