// hooks/usePresence.ts
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  // Stable ref — createClient() must not be called on every render
  const supabase = useRef(createClient()).current

  useEffect(() => {
    const channel = supabase.channel('seller-presence', {
      config: { presence: { key: userId ?? 'anonymous' } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>()
        const ids = new Set(
          Object.values(state)
            .flat()
            .map((p) => p.user_id)
        )
        setOnlineUsers(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && userId) {
          await channel.track({ user_id: userId })
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  // Only re-run if userId changes (e.g. user logs in/out)
  }, [userId, supabase])

  const isOnline = (sellerId: string) => onlineUsers.has(sellerId)

  return { onlineUsers, isOnline }
}