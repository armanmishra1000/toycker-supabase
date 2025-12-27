import { getAdminCollections, updateProduct } from "@/lib/data/admin"
import Link from "next/link"
import { retrieveProduct } from "@lib/data/products"
import { notFound } from "next/navigation"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminBadge from "@modules/admin/components/admin-badge"
import { ChevronLeftIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, collections] = await Promise.all([
    retrieveProduct(id),
    getAdminCollections()
  ])

  if (!product) notFound()

  const actions = (
    <div className="flex gap-2">
      <a 
        href={`/products/${product.handle}`} 
        target="_blank" 
        rel="noreferrer"
        className="px-4 py-2 border border-gray-300 text-sm font-bold rounded-lg hover:bg-white transition-all flex items-center gap-2"
      >
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        View in store
      </a>
      <button form="product-form" type="submit" className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
        Save Product
      </button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Link href="/admin/products" className="flex items-center hover:text-black transition-colors">
          <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
          Products
        </Link>
      </nav>

      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{product.name}</h1>
            <AdminBadge variant={product.status === 'active' ? 'success' : 'warning'}>{product.status}</AdminBadge>
         </div>
         {actions}
      </div>

      <form id="product-form" action={updateProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <input type="hidden" name="id" value={product.id} />
        
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Product Details">
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product Title</label>
                <input name="name" type="text" defaultValue={product.name} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea name="description" rows={10} defaultValue={product.description || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0 leading-relaxed transition-all" />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Media Assets">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Primary Image URL</label>
                <input name="image_url" type="url" defaultValue={product.image_url || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:ring-0" />
              </div>
              {product.image_url && (
                <div className="aspect-square w-48 relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner group">
                   <img src={product.image_url} alt="Preview" className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Status & Visibility">
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed">This product is currently <span className="font-bold text-black uppercase">{product.status}</span> on your storefront.</p>
              <select name="status" defaultValue={product.status || "active"} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0 bg-white">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </AdminCard>

          <AdminCard title="Pricing">
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                      <input name="price" type="number" step="0.01" defaultValue={product.price} required className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-black focus:border-black focus:ring-0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Compare at</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                      <input name="compare_at_price" type="number" step="0.01" defaultValue={product.metadata?.compare_at_price as number || ""} className="w-full rounded-lg border border-gray-300 pl-7 pr-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0" />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic">To show a reduced price, move the original price into "Compare at price".</p>
             </div>
          </AdminCard>

          <AdminCard title="Inventory">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quantity</label>
              <input name="stock_count" type="number" defaultValue={product.stock_count} required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold focus:border-black focus:ring-0" />
            </div>
          </AdminCard>

          <AdminCard title="Organization">
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Collection</label>
                <select name="collection_id" defaultValue={product.collection_id || ""} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-black focus:ring-0 bg-white">
                  <option value="">None</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">URL Handle</label>
                <div className="relative">
                   <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-medium">/</span>
                   <input name="handle" type="text" defaultValue={product.handle} required className="w-full rounded-lg border border-gray-300 pl-6 pr-4 py-2.5 text-xs font-bold text-gray-600 focus:border-black focus:ring-0 bg-gray-50/50" />
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      </form>
    </div>
  )
}