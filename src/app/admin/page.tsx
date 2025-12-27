import { getAdminStats, getAdminOrders } from "@/lib/data/admin"
import { convertToLocale } from "@lib/util/money"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import { ShoppingBagIcon, UserIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

export default async function AdminDashboard() {
  const stats = await getAdminStats()
  const latestOrders = (await getAdminOrders()).slice(0, 5)

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Overview" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={convertToLocale({ amount: stats.revenue, currency_code: "inr" })} 
          subtitle="All time"
          color="text-emerald-600"
        />
        <StatCard 
          title="Orders" 
          value={stats.orders.toString()} 
          subtitle="Processed"
        />
        <StatCard 
          title="Products" 
          value={stats.products.toString()} 
          subtitle="In catalog"
        />
        <StatCard 
          title="Customers" 
          value={stats.customers.toString()} 
          subtitle="Registered"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AdminCard title="Sales Performance">
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue Growth Chart</p>
               <p className="text-[10px] text-gray-400 mt-1 italic">Visual analytics will populate as order volume increases.</p>
            </div>
          </AdminCard>

          <AdminCard title="Recent Orders" className="p-0">
             <div className="divide-y divide-gray-100">
                {latestOrders.map(order => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                          <ShoppingBagIcon className="h-4 w-4" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">#{order.display_id}</p>
                          <p className="text-xs text-gray-400 font-medium">{order.customer_email}</p>
                       </div>
                    </div>
                    <p className="text-sm font-black text-gray-900">{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</p>
                  </Link>
                ))}
             </div>
             <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <Link href="/admin/orders" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest">View all orders →</Link>
             </div>
          </AdminCard>
        </div>

        <div className="space-y-8">
          <AdminCard title="Live Activity Feed">
             <div className="space-y-6">
                {latestOrders.length > 0 ? latestOrders.map((order, i) => (
                  <div key={order.id} className="relative pl-6 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {i !== latestOrders.length - 1 && <div className="absolute left-[7px] top-[24px] bottom-0 w-0.5 bg-gray-100" />}
                    
                    <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm" />
                    
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">Order #{order.display_id} placed</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.customer_email.split('@')[0]}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center">
                    <ArrowPathIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No recent activity</p>
                  </div>
                )}
             </div>
          </AdminCard>

          <AdminCard title="Catalog Health">
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-500">Out of Stock</span>
                   <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">0</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-500">Active Products</span>
                   <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stats.products}</span>
                </div>
             </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, color = "text-gray-900" }: { title: string, value: string, subtitle: string, color?: string }) {
  return (
    <AdminCard className="hover:border-gray-300 transition-all cursor-default">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
      <p className={`mt-2 text-3xl font-black ${color} tracking-tighter`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500 font-medium">{subtitle}</p>
    </AdminCard>
  )
}