import { getAdminStats } from "@/lib/data/admin"
import { convertToLocale } from "@lib/util/money"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Dashboard Overview" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Revenue" 
          value={convertToLocale({ amount: stats.revenue, currency_code: "inr" })} 
          subtitle="Lifetime earnings"
          color="text-emerald-600"
        />
        <StatCard 
          title="Orders" 
          value={stats.orders.toString()} 
          subtitle="Customer purchases"
        />
        <StatCard 
          title="Catalog" 
          value={stats.products.toString()} 
          subtitle="Live products"
        />
        <StatCard 
          title="Customers" 
          value={stats.customers.toString()} 
          subtitle="User accounts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AdminCard title="Sales Progress" className="lg:col-span-1">
          <div className="space-y-6">
             <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-gray-900">{convertToLocale({ amount: stats.revenue, currency_code: "inr" })}</p>
                <p className="text-xs font-bold text-gray-400 pb-1">TARGET: ₹1,00,000</p>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="bg-black h-3 rounded-full transition-all duration-1000 shadow-sm" 
                  style={{ width: `${Math.min((stats.revenue / 100000) * 100, 100)}%` }}
                />
             </div>
             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <span>0%</span>
                <span>{Math.floor((stats.revenue / 100000) * 100)}% Complete</span>
                <span>100%</span>
             </div>
          </div>
        </AdminCard>

        <AdminCard title="Recent Insights" className="lg:col-span-2">
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-gray-100 mb-4 shadow-sm">
               <ShoppingBagIcon className="h-6 w-6 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-900">Activity stream is quiet</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">New orders and customer signups will appear here automatically.</p>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

import { ShoppingBagIcon } from "@heroicons/react/24/outline"

function StatCard({ title, value, subtitle, color = "text-gray-900" }: { title: string, value: string, subtitle: string, color?: string }) {
  return (
    <AdminCard className="hover:border-gray-300 transition-all cursor-default">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
      <p className={`mt-2 text-3xl font-black ${color} tracking-tighter`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500 font-medium">{subtitle}</p>
    </AdminCard>
  )
}