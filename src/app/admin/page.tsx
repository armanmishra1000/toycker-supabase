import { getAdminStats } from "@/lib/data/admin"
import { convertToLocale } from "@lib/util/money"

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={convertToLocale({ amount: stats.revenue, currency_code: "inr" })} />
        <StatCard title="Orders" value={stats.orders.toString()} />
        <StatCard title="Products" value={stats.products.toString()} />
        <StatCard title="Customers" value={stats.customers.toString()} />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}