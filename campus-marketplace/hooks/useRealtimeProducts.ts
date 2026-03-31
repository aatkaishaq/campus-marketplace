// hooks/useRealtimeProducts.ts
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtimeProducts(initialProducts: Product[]) {
  // Use a ref to track whether we've done the first mount — prevents
  // the initialProducts useEffect from firing on every render
  const initialized = useRef(false)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const supabase = createClient()
  const supabaseRef = useRef(supabase)

  // Re-fetch a single product with its joins after a realtime event
  const fetchOne = useCallback(async (id: string): Promise<Product | null> => {
    const { data } = await supabaseRef.current
      .from('products')
      .select(`*, profiles ( username, avatar_url, is_online ), categories ( name )`)
      .eq('id', id)
      .single()
    return data as Product | null
  }, [])

  const handlePayload = useCallback(
    async (payload: RealtimePostgresChangesPayload<Product>) => {
      if (payload.eventType === 'INSERT') {
        const fresh = await fetchOne((payload.new as Product).id)
        if (fresh && fresh.status === 'available') {
          setProducts((prev) => [fresh, ...prev])
        }
      }

      if (payload.eventType === 'UPDATE') {
        const updated = payload.new as Product
        if (updated.status !== 'available') {
          setProducts((prev) => prev.filter((p) => p.id !== updated.id))
        } else {
          const fresh = await fetchOne(updated.id)
          if (fresh) {
            setProducts((prev) =>
              prev.map((p) => (p.id === fresh.id ? fresh : p))
            )
          }
        }
      }

      if (payload.eventType === 'DELETE') {
        const deleted = payload.old as { id: string }
        setProducts((prev) => prev.filter((p) => p.id !== deleted.id))
      }
    },
    [fetchOne]
  )

  // Only sync initialProducts on first mount — never again
  // This is what was causing the infinite loop: initialProducts is a new
  // array reference on every render, so [initialProducts] dependency
  // triggered setProducts → re-render → new array → setProducts → loop
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      setProducts(initialProducts)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('realtime:products:public')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        handlePayload
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // supabase client is stable, handlePayload is memoized — safe deps
  }, [handlePayload, supabase])

  return { products, setProducts }
}