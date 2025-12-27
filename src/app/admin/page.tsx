import { getAdminStats } from "@/lib/data/admin"
import { convertToLocale } from "@lib/util/money"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={convertToLocale({ amount: stats.revenue, currency_code: "inr" })} 
          subtitle="Lifetime earnings"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.orders.toString()} 
          subtitle="Orders placed"
        />
        <StatCard 
          title="Live Products" 
          value={stats.products.toString()} 
          subtitle="Catalog size"
        />
        <StatCard 
          title="Total Customers" 
          value={stats.customers.toString()} 
          subtitle="Registered users"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard title="Sales Target" className="lg:col-span-1">
          <div className="space-y-4">
             <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">{convertToLocale({ amount: stats.revenue, currency_code: "inr" })}</p>
                <p className="text-sm font-medium text-gray-500 pb-1">of ₹1,00,000</p>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((stats.revenue / 100000) * 100, 100)}%` }}
                />
             </div>
             <p className="text-xs font-medium text-gray-500 italic">Target based on monthly sales goals.</p>
          </div>
        </AdminCard>

        <AdminCard title="Recent Activity" className="lg:col-span-2">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
            <p className="font-medium">No recent orders to show.</p>
            <p className="text-xs mt-1">Activity will appear once customers start shopping.</p>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string, value: string, subtitle: string }) {
  return (
    <AdminCard className="hover:ring-1 hover:ring-gray-300 transition-all cursor-default">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400 font-medium">{subtitle}</p>
    </AdminCard>
  )
}