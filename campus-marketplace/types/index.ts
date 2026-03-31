// types/index.ts
// Central type definitions — import from here everywhere

export type ProductStatus = 'available' | 'pending' | 'sold' | 'banned'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  is_online: boolean
  updated_at: string
}

export interface Category {
  id: string
  name: string
}

export interface Product {
  id: string
  seller_id: string
  category_id: string | null
  title: string
  description: string | null
  price: number
  image_url: string | null
  status: ProductStatus
  created_at: string
  updated_at: string
  // joined fields
  profiles?: Pick<Profile, 'username' | 'avatar_url' | 'is_online'>
  categories?: Pick<Category, 'name'> | null
}

export interface ProductFormData {
  title: string
  description: string
  price: string
  category_id: string
  image_url: string
}

// Supabase Realtime event shape
export interface RealtimeProductPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Product
  old: Partial<Product>
}
