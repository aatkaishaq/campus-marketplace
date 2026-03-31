// components/ui/StatusBadge.tsx
import type { ProductStatus } from '@/types'

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  sold: {
    label: 'Sold',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  banned: {
    label: 'Banned',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
}

export default function StatusBadge({ status }: { status: ProductStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {status === 'available' && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
      )}
      {config.label}
    </span>
  )
}
