# Home Settings Admin Panel - Implementation Plan

## **Executive Summary**

This plan outlines the implementation of a Home Settings management system in the admin panel. This will allow admins to:
1. **Manage Hero Banners**: Add, edit, delete, and reorder homepage hero banners
2. **Manage Exclusive Collections**: Upload videos or select products for the Exclusive Collections section

All media (banners/videos) will be uploaded to Cloudflare R2 using presigned URLs for security and performance.

---

## **Current State Analysis**

### Hero Banners (Currently Static)
- **Location**: `src/lib/data/home-banners.ts`
- **Type**: Static array of banners (STATIC_BANNERS)
- **Data Structure**: 
  ```typescript
  {
    id: string
    image_url: string
    alt_text: string | null
    sort_order: number | null
    starts_at: string | null
    ends_at: string | null
  }
  ```

### Exclusive Collections (Currently Generated from Products)
- **Location**: `src/lib/data/exclusive-collections.ts`
- **Type**: Dynamically generated from first 6 products with local video files
- **Data Structure**:
  ```typescript
  {
    id: string
    product_id: string
    video_url: string
    poster_url: string | null
    sort_order: number | null
    product: Product | null
  }
  ```

### Existing Infrastructure
- ✅ Cloudflare R2 client configured (`src/lib/r2.ts`)
- ✅ Presigned URL generation for uploads (`src/lib/actions/storage.ts`)
- ✅ Admin authentication with `is_admin()` function
- ✅ Admin sidebar navigation component
- ✅ Row Level Security (RLS) patterns established

---

## **Web Research Summary**

Based on 13+ web searches for best practices:

1. **Supabase Admin CRUD**: Use RLS policies with `is_admin()`, server actions for mutations, validate inputs, log admin actions
2. **Next.js File Upload**: Server Actions with FormData for simplicity, presigned URLs for R2
3. **Cloudflare R2 Pattern**: Generate presigned URLs server-side, client uploads directly to R2
4. **Database Schema**: Normalize tables, use sort_order for ordering, timestamp fields for scheduling
5. **React Server Components**: Use `revalidatePath`/`revalidateTag` after mutations for cache invalidation
6. **Form Validation**: Zod for TypeScript-first schema validation on server
7. **Optimistic UI**: Use `useOptimistic` hook for immediate feedback on mutations
8. **Transactions**: Use Supabase RPC for atomic multi-step operations
9. **Admin Security**: Never expose service_role key, use RLS extensively, server-only code for admin operations

---

## **Database Schema Design**

### **1. Table: `home_banners`**
Stores hero banner configurations for the homepage.

```sql
CREATE TABLE IF NOT EXISTS public.home_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for efficient querying
CREATE INDEX idx_home_banners_active_sort ON public.home_banners(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_home_banners_schedule ON public.home_banners(starts_at, ends_at) WHERE is_active = true;
```

### **2. Table: `home_exclusive_collections`**
Stores exclusive collection entries (videos + products).

```sql
CREATE TABLE IF NOT EXISTS public.home_exclusive_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  video_duration INTEGER, -- in seconds
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(product_id) -- One collection entry per product
);

-- Index for efficient querying
CREATE INDEX idx_exclusive_collections_active_sort ON public.home_exclusive_collections(is_active, sort_order) WHERE is_active = true;
```

### **3. Row Level Security (RLS) Policies**

```sql
-- Enable RLS on both tables
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_exclusive_collections ENABLE ROW LEVEL SECURITY;

-- Public read access for active items only
CREATE POLICY "Public can view active home banners" ON public.home_banners
  FOR SELECT
  TO public
  USING (
    is_active = true AND
    (starts_at IS NULL OR starts_at <= now()) AND
    (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "Public can view active exclusive collections" ON public.home_exclusive_collections
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage home banners" ON public.home_banners
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can manage exclusive collections" ON public.home_exclusive_collections
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

---

## **Implementation Steps**

### **Phase 1: Database Setup**

#### **1.1 Create Migration File**
**File**: `supabase/migrations/20260110_home_settings_tables.sql`

```sql
-- See "Database Schema Design" section above for full SQL
```

**Why**: Versioned database changes, rollback capability, deployment tracking

---

### **Phase 2: Server Actions & Data Layer**

#### **2.1 Update Presigned URL Function**
**File**: `src/lib/actions/storage.ts`

**Changes**:
- Add support for `banners` and `exclusive-videos` folders
- Add file type validation for images and videos
- Add file size validation

```typescript
export async function getPresignedUploadUrl({
  fileType,
  folder = "reviews",
  maxSizeMB = 10,
}: {
  fileType: string
  folder?: "reviews" | "banners" | "exclusive-videos"
  maxSizeMB?: number
}) {
  // Validate file type based on folder
  const allowedTypes: Record<string, string[]> = {
    reviews: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
    banners: ["image/jpeg", "image/png", "image/webp"],
    "exclusive-videos": ["video/mp4", "video/webm"],
  }
  
  if (!allowedTypes[folder].includes(fileType)) {
    return { error: `Invalid file type for ${folder}` }
  }
  
  // Rest of implementation...
}
```

**Why**: Reuse existing upload infrastructure, add validation for security

---

#### **2.2 Create Server Actions for Banners**
**File**: `src/lib/actions/home-banners.ts` (NEW)

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Validation schema
const BannerSchema = z.object({
  title: z.string().min(1).max(255),
  image_url: z.string().url(),
  alt_text: z.string().optional(),
  link_url: z.string().url().optional(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
})

export type BannerFormData = z.infer<typeof BannerSchema>

// List all banners (admin view)
export async function listHomeBannersAdmin() {
  const supabase = await createClient()
  
  const { data, error } = await supa base
    .from("home_banners")
    .select("*")
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching banners:", error)
    return { banners: [], error: error.message }
  }
  
  return { banners: data, error: null }
}

// Create banner
export async function createHomeBanner(formData: BannerFormData) {
  const supabase = await createClient()
  
  // Validate input
  const validatedData = BannerSchema.safeParse(formData)
  if (!validatedData.success) {
    return { error: "Invalid input data", details: validatedData.error.flatten() }
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }
  
  // Insert banner
  const { data, error } = await supabase
    .from("home_banners")
    .insert({
      ...validatedData.data,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()
  
  if (error) {
    console.error("Error creating banner:", error)
    return { error: error.message }
  }
  
  // Revalidate home page cache
  revalidatePath("/")
  revalidatePath("/admin/home-settings")
  
  return { banner: data, error: null }
}

// Update banner
export async function updateHomeBanner(id: string, formData: Partial<BannerFormData>) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }
  
  const { data, error } = await supabase
    .from("home_banners")
    .update({
      ...formData,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating banner:", error)
    return { error: error.message }
  }
  
  revalidatePath("/")
  revalidatePath("/admin/home-settings")
  
  return { banner: data, error: null }
}

// Delete banner
export async function deleteHomeBanner(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("home_banners")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting banner:", error)
    return { error: error.message }
  }
  
  revalidatePath("/")
  revalidatePath("/admin/home-settings")
  
  return { success: true, error: null }
}

// Reorder banners (atomic operation)
export async function reorderHomeBanners(bannerIds: string[]) {
  const supabase = await createClient()
  
  // Use RPC for atomic transaction
  const { error } = await supabase.rpc("reorder_home_banners", {
    banner_ids: bannerIds,
  })
  
  if (error) {
    console.error("Error reordering banners:", error)
    return { error: error.message }
  }
  
  revalidatePath("/")
  revalidatePath("/admin/home-settings")
  
  return { success: true, error: null }
}
```

**Why**: 
- Server-side validation with Zod for type safety
- RLS ensures only admins can execute these
- Cache revalidation keeps data fresh
- Audit trail with created_by/updated_by

---

#### **2.3 Create Server Actions for Exclusive Collections**
**File**: `src/lib/actions/home-exclusive-collections.ts` (NEW)

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const ExclusiveCollectionSchema = z.object({
  product_id: z.string().uuid(),
  video_url: z.string().url(),
  poster_url: z.string().url().optional(),
  video_duration: z.number().int().positive().optional(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

export type ExclusiveCollectionFormData = z.infer<typeof ExclusiveCollectionSchema>

// List all collections (admin view)
export async function listExclusiveCollectionsAdmin() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("home_exclusive_collections")
    .select(`
      *,
      product:products (
        id,
        title,
        handle,
        thumbnail,
        images,
        prices
      )
    `)
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching exclusive collections:", error)
    return { collections: [], error: error.message }
  }
  
  return { collections: data, error: null }
}

// Similar CRUD functions as banners...
// createExclusiveCollection, updateExclusiveCollection, deleteExclusiveCollection, reorderExclusiveCollections
```

**Why**: Same pattern as banners for consistency

---

#### **2.4 Create PostgreSQL Functions for Atomic Operations**
**File**: `supabase/migrations/20260110_home_settings_functions.sql` (NEW)

```sql
-- Function to reorder home banners atomically
CREATE OR REPLACE FUNCTION public.reorder_home_banners(banner_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update sort_order for each banner
  FOR i IN 1..array_length(banner_ids, 1) LOOP
    UPDATE public.home_banners
    SET sort_order = i - 1,
        updated_at = now()
    WHERE id = banner_ids[i];
  END LOOP;
END;
$$;

-- Function to reorder exclusive collections atomically
CREATE OR REPLACE FUNCTION public.reorder_exclusive_collections(collection_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  FOR i IN 1..array_length(collection_ids, 1) LOOP
    UPDATE public.home_exclusive_collections
    SET sort_order = i - 1,
        updated_at = now()
    WHERE id = collection_ids[i];
  END LOOP;
END;
$$;
```

**Why**: Atomic transactions prevent race conditions, SECURITY DEFINER allows RLS bypass with admin check

---

#### **2.5 Update Public Data Functions**
**File**: `src/lib/data/home-banners.ts` (MODIFY)

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

export type HomeHeroBanner = {
  id: string
  title: string
  image_url: string
  alt_text: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export const listHomeBanners = async (): Promise<HomeHeroBanner[]> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("home_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  
  if (error || !data || data.length === 0) {
    // Fallback to empty array if no banners
    console.warn("No active banners found:", error)
    return []
  }
  
  return data
}
```

**File**: `src/lib/data/exclusive-collections.ts` (MODIFY)

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"

export type ExclusiveCollectionEntry = {
  id: string
  product_id: string
  video_url: string
  poster_url: string | null
  video_duration: number | null
  sort_order: number
  product: Product | null
}

export const listExclusiveCollections = async ({
  regionId,
}: {
  regionId: string
}): Promise<ExclusiveCollectionEntry[]> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("home_exclusive_collections")
    .select(`
      *,
      product:products!inner (
        id,
        title,
        handle,
        thumbnail,
        images,
        prices
      )
    `)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  
  if (error || !data || data.length === 0) {
    console.warn("No active exclusive collections found:", error)
    return []
  }
  
  return data
}
```

**Why**: 
- Remove static data
- Fetch from database
- Maintain same interface for components
- Public RLS policy ensures only active, scheduled items are visible

---

### **Phase 3: Admin UI Components**

#### **3.1 Create Sidebar Navigation Entry**
**File**: `src/modules/admin/components/admin-sidebar-nav/index.tsx` (MODIFY)

```typescript
import { PhotoIcon } from "@heroicons/react/24/outline" // Add this icon

const NAV_ITEMS = [
  { label: "Home", href: "/admin", icon: HomeIcon },
  { label: "Home Settings", href: "/admin/home-settings", icon: PhotoIcon }, // NEW
  { label: "Orders", href: "/admin/orders", icon: ShoppingBagIcon },
  // ... rest of items
]
```

**Why**: Add navigation to new Home Settings page

---

#### **3.2 Create Admin Home Settings Page**
**File**: `src/app/admin/home-settings/page.tsx` (NEW)

```typescript
import { Suspense } from "react"
import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BannersManager from "@/modules/admin/components/home-settings/banners-manager"
import ExclusiveCollectionsManager from "@/modules/admin/components/home-settings/exclusive-collections-manager"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Home Settings | Admin",
  description: "Manage homepage banners and exclusive collections",
}

export default function HomeSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Home Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage hero banners and exclusive collections displayed on the homepage
        </p>
      </div>
      
      <Tabs defaultValue="banners" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="banners">Hero Banners</TabsTrigger>
          <TabsTrigger value="collections">Exclusive Collections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="banners" className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <BannersManager />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="collections" className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ExclusiveCollectionsManager />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Why**: 
- Organized tabs for two different managers
- Suspense boundaries for loading states
- Clear heading and description

---

#### **3.3 Create Banners Manager Component**
**File**: `src/modules/admin/components/home-settings/banners-manager/index.tsx` (NEW)

This component will:
- List all banners in a table with drag-to-reorder
- Show banner preview, title, status, schedule
- Buttons for Add, Edit, Delete
- Modal for Add/Edit form
- File upload with progress indicator
- Optimistic UI updates

```typescript
"use client"

import { useState, useOptimistic } from "react"
import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "@heroicons/react/24/outline"
import BannerCard from "./banner-card"
import BannerFormModal from "./banner-form-modal"
import { listHomeBannersAdmin, reorderHomeBanners } from "@/lib/actions/home-banners"
import type { HomeHeroBanner } from "@/lib/data/home-banners"

export default function BannersManager() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HomeHeroBanner | null>(null)
  
  // Fetch banners server-side
  const initialBanners = await listHomeBannersAdmin() // Ideally use React Query or SWR
  
  const [optimisticBanners, setOptimisticBanners] = useOptimistic(
    initialBanners.banners,
    (state, newBanners: HomeHeroBanner[]) => newBanners
  )
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    
    const oldIndex = optimisticBanners.findIndex((b) => b.id === active.id)
    const newIndex = optimisticBanners.findIndex((b) => b.id === over.id)
    
    const newOrder = arrayMove(optimisticBanners, oldIndex, newIndex)
    
    // Optimistically update UI
    setOptimisticBanners(newOrder)
    
    // Persist to database
    const bannerIds = newOrder.map((b) => b.id)
    const result = await reorderHomeBanners(bannerIds)
    
    if (result.error) {
      // Revert on error
      toast.error("Failed to reorder banners")
      setOptimisticBanners(optimisticBanners)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Hero Banners</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Banner
        </Button>
      </div>
      
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={optimisticBanners.map((b) => b.id)}>
          <div className="grid gap-4">
            {optimisticBanners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={(banner) => {
                  setEditingBanner(banner)
                  setIsModalOpen(true)
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <BannerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBanner(null)
        }}
        banner={editingBanner}
      />
    </div>
  )
}
```

**Why**: 
- Drag-and-drop with @dnd-kit for intuitive reordering
- Optimistic UI for instant feedback
- Modal pattern for Add/Edit forms

---

#### **3.4 Create Banner Form Modal**
**File**: `src/modules/admin/components/home-settings/banners-manager/banner-form-modal.tsx` (NEW)

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import ImageUploader from "@/modules/admin/components/image-uploader"
import { createHomeBanner, updateHomeBanner, type BannerFormData } from "@/lib/actions/home-banners"
import { BannerSchema } from "@/lib/actions/home-banners"
import type { HomeHeroBanner } from "@/lib/data/home-banners"
import { toast } from "sonner"

type Props = {
  isOpen: boolean
  onClose: () => void
  banner?: HomeHeroBanner | null
}

export default function BannerFormModal({ isOpen, onClose, banner }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BannerFormData>({
    resolver: zodResolver(BannerSchema),
    defaultValues: banner || {
      title: "",
      image_url: "",
      alt_text: "",
      link_url: "",
      sort_order: 0,
      is_active: true,
      starts_at: undefined,
      ends_at: undefined,
    },
  })
  
  const onSubmit = async (data: BannerFormData) => {
    setIsSubmitting(true)
    
    try {
      const result = banner
        ? await updateHomeBanner(banner.id, data)
        : await createHomeBanner(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(banner ? "Banner updated" : "Banner created")
        onClose()
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title">Banner Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g., Summer Sale 2026"
              error={errors.title?.message}
            />
          </div>
          
          <div>
            <Label>Banner Image *</Label>
            <ImageUploader
              folder="banners"
              value={watch("image_url")}
              onChange={(url) => setValue("image_url", url)}
              acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
              maxSizeMB={5}
            />
            {errors.image_url && (
              <p className="text-sm text-red-600 mt-1">{errors.image_url.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="alt_text">Alt Text (for SEO)</Label>
            <Input
              id="alt_text"
              {...register("alt_text")}
              placeholder="Describe the banner for screen readers"
            />
          </div>
          
          <div>
            <Label htmlFor="link_url">Link URL (optional)</Label>
            <Input
              id="link_url"
              {...register("link_url")}
              placeholder="https://example.com/sale"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="starts_at">Start Date (optional)</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                {...register("starts_at")}
              />
            </div>
            <div>
              <Label htmlFor="ends_at">End Date (optional)</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                {...register("ends_at")}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : banner ? "Update Banner" : "Create Banner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Why**: 
- React Hook Form + Zod for robust validation
- Reusable ImageUploader component for R2 uploads
- Date/time pickers for scheduling
- Clear error messages

---

#### **3.5 Create Image Uploader Component**
**File**: `src/modules/admin/components/image-uploader/index.tsx` (NEW or ENHANCE EXISTING)

```typescript
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { getPresignedUploadUrl } from "@/lib/actions/storage"
import { getFileUrl } from "@/lib/r2"
import { toast } from "sonner"

type Props = {
  folder: "banners" | "exclusive-videos"
  value?: string
  onChange: (url: string) => void
  acceptedFormats: string[]
  maxSizeMB: number
}

export default function ImageUploader({
  folder,
  value,
  onChange,
  acceptedFormats,
  maxSizeMB,
}: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File must be smaller than ${maxSizeMB}MB`)
        return
      }
      
      setIsUploading(true)
      setUploadProgress(0)
      
      try {
        // Step 1: Get presigned URL
        const { url, key, error } = await getPresignedUploadUrl({
          fileType: file.type,
          folder,
        })
        
        if (error || !url || !key) {
          throw new Error(error || "Failed to get upload URL")
        }
        
        // Step 2: Upload to R2
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(percent)
          }
        })
        
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const publicUrl = getFileUrl(key)
            onChange(publicUrl)
            toast.success("Upload complete!")
            setIsUploading(false)
          } else {
            throw new Error("Upload failed")
          }
        })
        
        xhr.addEventListener("error", () => {
          throw new Error("Network error during upload")
        })
        
        xhr.open("PUT", url)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      } catch (error) {
        console.error("Upload error:", error)
        toast.error("Upload failed. Please try again.")
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [folder, maxSizeMB, onChange]
  )
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxFiles: 1,
    disabled: isUploading,
  })
  
  return (
    <div className="space-y-4">
      {value && !isUploading ? (
        <div className="relative group">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onChange("")}
          >
            <XMarkIcon className="h-4 w-4" />
            Remove
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          {isUploading ? (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag & drop a file here, or click to select"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Max {maxSizeMB}MB • {acceptedFormats.join(", ")}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

**Why**: 
- Drag-and-drop UX with react-dropzone
- Real-time progress indicator with XHR
- Preview uploaded image
- Client-side validation before upload

---

#### **3.6 Create Exclusive Collections Manager (Similar Pattern)**
**File**: `src/modules/admin/components/home-settings/exclusive-collections-manager/index.tsx` (NEW)

Similar to BannersManager but with:
- Video upload support
- Product selector/search component
- Video duration input
- Poster image upload

---

#### **3.7 Create Product Selector Component**
**File**: `src/modules/admin/components/product-selector/index.tsx` (NEW)

```typescript
"use client"

import { useState, useEffect } from "react"
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { listProducts } from "@/lib/data/products"
import type { Product } from "@/lib/supabase/types"

type Props = {
  value?: string // product_id
  onChange: (productId: string, product: Product) => void
}

export default function ProductSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      const { response } = await listProducts()
      setProducts(response.products)
      setLoading(false)
    }
    loadProducts()
  }, [])
  
  const selectedProduct = products.find((p) => p.id === value)
  
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedProduct ? selectedProduct.title : "Select a product"}
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search products..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-6 text-center text-sm">No products found.</div>
            ) : (
              filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onChange(product.id, product)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={`mr-2 h-4 w-4 ${
                      value === product.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {product.title}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

**Why**: 
- Searchable dropdown for product selection
- CMD+K style UI with shadcn/ui Command component
- Shows selected product title

---

### **Phase 4: Testing & Quality Checks**

#### **4.1 Manual Testing Checklist**

**Banners**:
- [ ] Create new banner with image upload
- [ ] Edit existing banner
- [ ] Delete banner
- [ ] Reorder banners via drag-and-drop
- [ ] Toggle banner active/inactive
- [ ] Schedule banner with start/end dates
- [ ] Verify banner appears on homepage when active and scheduled
- [ ] Verify banner doesn't appear when inactive or outside schedule

**Exclusive Collections**:
- [ ] Create new collection with video upload and product selection
- [ ] Edit existing collection
- [ ] Delete collection
- [ ] Reorder collections
- [ ] Verify collections appear on homepage with correct product and video
- [ ] Test video playback on homepage

**Common**:
- [ ] Verify only admins can access /admin/home-settings
- [ ] Verify non-admin users see 403/404
- [ ] Test file upload with various file sizes and types
- [ ] Test file upload failure scenarios (network error, invalid file type)
- [ ] Verify cache revalidation (homepage updates immediately after changes)
- [ ] Test on mobile devices

---

#### **4.2 TypeScript Type Check**
```bash
pnpm run typecheck
```

**Expected**: No TypeScript errors

---

#### **4.3 ESLint Check**
```bash
pnpm run lint
```

**Expected**: No linting errors (or only warnings that are acceptable)

---

#### **4.4 Build Check**
```bash
pnpm run build
```

**Expected**: Successful build with no errors

---

#### **4.5 Database Migration Test**
```bash
# Run migrations on local Supabase
supabase db reset

# Or on production (with caution)
supabase db push
```

**Expected**: All migrations apply successfully without errors

---

## **Implementation Timeline**

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Database Setup (Migrations + RLS) | 2 hours |
| Phase 2 | Server Actions & Data Layer | 4 hours |
| Phase 3 | Admin UI Components | 8 hours |
| Phase 4 | Testing & Quality Checks | 3 hours |
| **Total** | | **17 hours** |

---

## **Deployment Checklist**

Before deploying to production:

1. **Database**:
   - [ ] Run migrations on production Supabase
   - [ ] Verify RLS policies are active
   - [ ] Test database functions with admin user

2. **Environment Variables**:
   - [ ] Ensure CLOUDFLARE_R2_* variables are set in production
   - [ ] Verify NEXT_PUBLIC_R2_PUBLIC_URL is correct

3. **Testing**:
   - [ ] Run full test suite locally
   - [ ] Test on staging environment if available
   - [ ] Verify admin panel access on production

4. **Monitoring**:
   - [ ] Set up error tracking for new server actions
   - [ ] Monitor Cloudflare R2 usage
   - [ ] Check homepage load times after deployment

5. **Rollback Plan**:
   - [ ] Document how to revert migrations if needed
   - [ ] Keep backup of current `home-banners.ts` static data

---

## **Performance Optimizations**

### **1. Image Optimization**
- Use `next/image` for automatic optimization
- Set appropriate `sizes` prop for responsive images
- Consider using WebP format for smaller file sizes

### **2. Cache Strategy**
- Homepage banners/collections cached via React Server Components
- Use `revalidatePath('/')` after mutations for instant updates
- Consider adding `revalidate: 3600` (1 hour) for public pages

### **3. Database Queries**
- Use indexes on `is_active` and `sort_order` columns
- Limit queries to only required fields
- Use `select('*')` sparingly, prefer specific field selection

### **4. R2 Uploads**
- Use presigned URLs to offload upload to client
- Implement client-side compression for large images
- Set appropriate cache headers on R2 objects

---

## **Security Considerations**

1. **Admin-Only Access**: All mutations protected by `is_admin()` function and RLS
2. **File Upload Validation**: Server-side validation of file types and sizes
3. **SQL Injection**: Using Supabase client with parameterized queries
4. **XSS Protection**: React automatically escapes user input
5. **CSRF Protection**: Server Actions use built-in CSRF protection in Next.js
6. **Presigned URL Expiry**: Presigned URLs expire after 1 hour
7. **Audit Trail**: Track `created_by` and `updated_by` for all changes

---

## **Potential Issues & Mitigations**

| Issue | Mitigation |
|-------|------------|
| Large file uploads slow | Add client-side compression, show progress indicator |
| Race conditions in reordering | Use atomic PostgreSQL functions with transactions |
| Stale cache after mutations | Use `revalidatePath` to invalidate cache |
| Broken image links | Validate URLs before saving, add fallback images |
| Admin accidentally deletes all banners | Add confirmation dialog, implement soft delete |
| Cloudflare R2 outage | Implement retry logic, show fallback content |
| Concurrent edits by multiple admins | Add optimistic locking or last-write-wins strategy |

---

## **Future Enhancements** (Not in this implementation)

1. **Analytics**: Track banner click-through rates
2. **A/B Testing**: Test multiple banner variants
3. **Scheduled Publishing**: Queue banners for future publication
4. **Bulk Operations**: Upload multiple banners at once
5. **Templates**: Predefined banner templates for quick creation
6. **Localization**: Different banners for different regions
7. **Approval Workflow**: Multi-step approval for banner changes
8. **Version History**: Track changes and rollback to previous versions

---

## **Files Modified/Created Summary**

### **New Files** (20)
1. `supabase/migrations/20260110_home_settings_tables.sql`
2. `supabase/migrations/20260110_home_settings_functions.sql`
3. `src/lib/actions/home-banners.ts`
4. `src/lib/actions/home-exclusive-collections.ts`
5. `src/app/admin/home-settings/page.tsx`
6. `src/modules/admin/components/home-settings/banners-manager/index.tsx`
7. `src/modules/admin/components/home-settings/banners-manager/banner-card.tsx`
8. `src/modules/admin/components/home-settings/banners-manager/banner-form-modal.tsx`
9. `src/modules/admin/components/home-settings/exclusive-collections-manager/index.tsx`
10. `src/modules/admin/components/home-settings/exclusive-collections-manager/collection-card.tsx`
11. `src/modules/admin/components/home-settings/exclusive-collections-manager/collection-form-modal.tsx`
12. `src/modules/admin/components/image-uploader/index.tsx`
13. `src/modules/admin/components/video-uploader/index.tsx`
14. `src/modules/admin/components/product-selector/index.tsx`

### **Modified Files** (4)
1. `src/lib/actions/storage.ts` - Add banner/video folder support
2. `src/lib/data/home-banners.ts` - Fetch from database
3. `src/lib/data/exclus ive-collections.ts` - Fetch from database
4. `src/modules/admin/components/admin-sidebar-nav/index.tsx` - Add navigation item

---

## **Key TypeScript Patterns Used**

1. **Discriminated Unions** for form states (idle, loading, error, success)
2. **Zod Schemas** for runtime validation with type inference
3. **Server Actions** with typed parameters and return values
4. **Generic Components** with proper type constraints
5. **Proper Error Handling** with Result types `{ data, error }`
6. **No 'any' types** - all types explicitly defined

---

## **Conclusion**

This implementation provides a robust, scalable solution for managing homepage content from the admin panel. It follows Next.js 14 best practices, ensures type safety with TypeScript, and maintains security with RLS policies. The modular architecture allows for easy testing and future enhancements.

All requirements are met:
- ✅ Hero banners manageable from admin panel (add, edit, delete, reorder)
- ✅ Exclusive collections manageable from admin panel (upload video, select products, edit, delete)
- ✅ Cloudflare R2 integration for banner and video uploads
- ✅ Fast performance with optimistic UI updates and cache revalidation
- ✅ No 'any' types in TypeScript
- ✅ Simple, robust, and proven patterns from web research
- ✅ Quality checks included (lint, typecheck, build)

---

**Ready to implement! Let me know when you'd like to proceed with Phase 1.**
