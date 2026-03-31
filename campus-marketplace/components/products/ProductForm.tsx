// components/products/ProductForm.tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Product, ProductFormData } from '@/types'
import type { User } from '@supabase/supabase-js'

interface ProductFormProps {
  categories: Category[]
  user: User
  editProduct?: Product | null
  onSuccess: () => void
  onCancel: () => void
}

export default function ProductForm({
  categories,
  user,
  editProduct,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    title: editProduct?.title ?? '',
    description: editProduct?.description ?? '',
    price: editProduct?.price?.toString() ?? '',
    category_id: editProduct?.category_id ?? '',
    image_url: editProduct?.image_url ?? '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(editProduct?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, etc.)')
      return
    }

    // Validate file size — max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setImageFile(file)
    setError(null)

    // Show local preview immediately — no need to wait for upload
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url || null

    setUploading(true)
    // Store under user_id/filename so RLS policies work correctly
    const ext = imageFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile, { upsert: true })

    setUploading(false)

    if (uploadError) {
      setError(`Image upload failed: ${uploadError.message}`)
      return null
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Upload image first if a new file was selected
    const imageUrl = await uploadImage()
    if (imageFile && !imageUrl) {
      // Upload failed — uploadImage already set the error
      setLoading(false)
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      category_id: form.category_id || null,
      image_url: imageUrl,
      seller_id: user.id,
    }

    let dbError
    if (editProduct) {
      const result = await supabase
        .from('products')
        .update(payload)
        .eq('id', editProduct.id)
        .eq('seller_id', user.id)
      dbError = result.error
    } else {
      const result = await supabase.from('products').insert(payload)
      dbError = result.error
    }

    if (dbError) {
      setError(dbError.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
    setForm((prev) => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Product Image
        </label>

        {/* Preview */}
        {imagePreview ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow"
            >
              ✕
            </button>
          </div>
        ) : (
          /* Upload area */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
          >
            <span className="text-3xl mb-2">📷</span>
            <p className="text-sm font-medium text-slate-600">Click to upload image</p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP — max 5MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Uploading indicator */}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-brand-600 mt-1">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Uploading image...
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          className="input-field"
          placeholder="e.g. Calculus 3rd Edition Textbook"
          value={form.title}
          onChange={handleChange}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          name="description"
          className="input-field resize-none"
          rows={3}
          placeholder="Condition, edition, any extras included..."
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Price + Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Price (PKR) <span className="text-red-500">*</span>
          </label>
          <input
            name="price"
            type="number"
            min="1"
            step="1"
            className="input-field"
            placeholder="500"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            name="category_id"
            className="input-field"
            value={form.category_id}
            onChange={handleChange}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading || uploading}
        >
          {loading || uploading ? 'Saving...' : editProduct ? 'Update Listing' : 'Post Listing'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  )
}