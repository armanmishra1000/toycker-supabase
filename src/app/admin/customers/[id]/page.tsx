
import { getAdminCustomer } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon, ShoppingBagIcon, CalendarIcon, StarIcon, BanknotesIcon, MapIcon, CreditCardIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"
import DeleteCustomerButton from "@modules/admin/components/delete-customer-button"
import { cn } from "@lib/util/cn"

export default async function AdminCustomerDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getAdminCustomer(id)

  if (!customer) notFound()

  // Calculate stats
  // @ts-ignore - types need to be strict but for prototype ensuring it works
  const totalSpent = customer.orders.reduce((acc: number, order: any) => acc + (order.total_amount || 0), 0)
  // @ts-ignore
  const rewardBalance = customer.reward_wallet?.balance || 0
  const clubSavings = customer.total_club_savings || 0
  const joinDate = new Date(customer.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })

  // Determine membership status
  const isMember = customer.is_club_member
  const membershipVariant = isMember ? "success" : "neutral"

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation */}
      <nav className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <Link href="/admin/customers" className="flex items-center">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back to Customers
        </Link>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{customer.first_name} {customer.last_name}</h1>
            {/* @ts-ignore */}
            <AdminBadge variant={customer.role === 'admin' ? 'info' : membershipVariant}>
              {/* @ts-ignore */}
              {customer.role === 'admin' ? 'Admin' : (isMember ? 'Club Member' : 'Customer')}
            </AdminBadge>
          </div>
          <p className="text-sm text-gray-500 mt-1">Customer ID: #{customer.customer_display_id || customer.id.slice(0, 8)} • Joined {joinDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteCustomerButton customerId={customer.id} customerName={`${customer.first_name || ''} ${customer.last_name || ''}`} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Spent"
          value={convertToLocale({ amount: totalSpent, currency_code: "inr" })}
          icon={<BanknotesIcon className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          title="Total Orders"
          value={customer.orders.length.toString()}
          subtitle="Lifetime orders"
          icon={<ShoppingBagIcon className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Reward Points"
          value={rewardBalance.toString()}
          subtitle="Available balance"
          icon={<StarIcon className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Club Savings"
          value={convertToLocale({ amount: clubSavings, currency_code: "inr" })}
          subtitle="Total saved"
          icon={<CreditCardIcon className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Orders & Addresses) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Orders */}
          <AdminCard title="Order History" className="p-0 border-none shadow-sm overflow-hidden">
            {customer.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {/* @ts-ignore */}
                    {customer.orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors cursor-pointer group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          <Link href={`/admin/orders/${order.id}`}>#{order.display_id}</Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AdminBadge variant={getStatusVariant(order.status)}>{order.status}</AdminBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <ShoppingBagIcon className="w-12 h-12 text-gray-200 mb-3" />
                <p className="font-medium">No orders yet</p>
                <p className="text-sm">This customer hasn&apos;t placed any orders.</p>
              </div>
            )}
          </AdminCard>

          {/* Addresses */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
            {/* @ts-ignore */}
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* @ts-ignore */}
                {customer.addresses.map((addr: any) => (
                  <div key={addr.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Address</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">{addr.first_name} {addr.last_name}</p>
                      <p>{addr.address_1}</p>
                      {addr.address_2 && <p>{addr.address_2}</p>}
                      <p>{addr.city}, {addr.province} {addr.postal_code}</p>
                      <p>{addr.country_code?.toUpperCase()}</p>
                      {addr.phone && <p className="pt-2 text-gray-500 flex items-center gap-2 text-xs"><span className="text-gray-400">Phone:</span> {addr.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500 text-sm">
                No addresses saved.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <AdminCard title="Contact Information">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs font-bold">@</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                  <a href={`mailto:${customer.email}`} className="text-sm font-semibold text-blue-600 hover:underline break-all">{customer.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs font-bold">#</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {customer.phone || customer.addresses?.[0]?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Club Membership">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <AdminBadge variant={membershipVariant}>{isMember ? 'Active' : 'Not Valid'}</AdminBadge>
              </div>
              {isMember && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">{customer.club_member_since ? new Date(customer.club_member_since).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </>
              )}
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Rewards Ledger */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Reward Transaction History</h2>
        <AdminCard className="p-0 border-none shadow-sm overflow-hidden">
          {/* @ts-ignore */}
          {customer.reward_transactions && customer.reward_transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {/* @ts-ignore */}
                  {customer.reward_transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {tx.type === 'earned' ? (
                            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                              <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="p-1 rounded bg-red-50 text-red-600">
                              <ArrowTrendingDownIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className={cn(
                            "text-xs font-bold uppercase",
                            tx.type === 'earned' ? "text-emerald-700" : "text-red-700"
                          )}>
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {tx.orders ? (
                          <Link href={`/admin/orders/${tx.order_id}`} className="text-blue-600 hover:underline">
                            #{tx.orders.display_id}
                          </Link>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                      <td className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm font-bold text-right",
                        tx.amount > 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <StarIcon className="w-12 h-12 text-gray-200 mb-3" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm">This customer hasn&apos;t earned or spent any rewards.</p>
            </div>
          )}
        </AdminCard>
      </div>

      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}

function StatsCard({ title, value, subtitle, icon, color }: { title: string, value: string, subtitle?: string, icon: React.ReactNode, color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    gray: "bg-gray-50 text-gray-600",
  }
  const bgClass = colorClasses[color] || colorClasses.gray

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'paid': return 'success'
    case 'pending': return 'warning'
    case 'failed': return 'error'
    case 'cancelled': return 'neutral'
    default: return 'neutral'
  }
}