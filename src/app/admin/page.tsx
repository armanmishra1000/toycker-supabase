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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Recent Activity">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
            <p>Your recent sales activity will appear here.</p>
          </div>
        </AdminCard>
        <AdminCard title="Quick Setup">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Catalog synchronized with Supabase</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="h-2 w-2 rounded-full bg-gray-300" />
              <span>Set up shipping rates (Coming soon)</span>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string, value: string, subtitle: string }) {
  return (
    <AdminCard className="hover:ring-1 hover:ring-gray-300 transition-all">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    </AdminCard>
  )
}