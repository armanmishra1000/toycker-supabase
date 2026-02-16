import { getAdminCustomer } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeftIcon,
  ShoppingBagIcon,
  StarIcon,
  BanknotesIcon,
  MapIcon,
  CreditCardIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"
import DeleteCustomerButton from "@modules/admin/components/delete-customer-button"
import { ProtectedAction } from "@/lib/permissions/components/protected-action"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@lib/util/cn"
import { formatIST } from "@/lib/util/date"
import CustomerOrderHistory from "@modules/admin/components/customer-order-history"
import CustomerRewardHistory from "@modules/admin/components/customer-reward-history"
import { getRegion } from "@lib/data/regions"
import EditAddressModal from "@modules/admin/components/edit-address-modal"

export default async function AdminCustomerDetails({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = await getAdminCustomer(id)
  const region = await getRegion()

  if (!customer || !region) notFound()

  // Use pre-calculated stats from data layer
  const totalSpent = customer.total_spent || 0
  // @ts-ignore
  const rewardBalance = customer.reward_wallet?.balance || 0
  const clubSavings = customer.total_club_savings || 0
  const joinDate = formatIST(customer.created_at, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Determine membership status
  const isMember = customer.is_club_member
  const membershipVariant = isMember ? "success" : "neutral"

  // Calculate display name with fallbacks
  const displayName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    (customer.addresses?.[0]
      ? [customer.addresses[0].first_name, customer.addresses[0].last_name]
          .filter(Boolean)
          .join(" ")
      : null) ||
    "N/A"

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
            <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
            {/* @ts-ignore */}
            <AdminBadge
              variant={customer.role === "admin" ? "info" : membershipVariant}
            >
              {/* @ts-ignore */}
              {customer.role === "admin"
                ? "Admin"
                : isMember
                ? "Club Member"
                : "Customer"}
            </AdminBadge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Customer ID: #
            {customer.customer_display_id || customer.id.slice(0, 8)} • Joined{" "}
            {joinDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProtectedAction
            permission={PERMISSIONS.CUSTOMERS_DELETE}
            hideWhenDisabled
          >
            <DeleteCustomerButton
              customerId={customer.id}
              customerName={`${customer.first_name || ""} ${
                customer.last_name || ""
              }`}
            />
          </ProtectedAction>
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
          value={customer.order_count.toString()}
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
          <AdminCard
            title="Order History"
            className="p-0 border-none shadow-sm overflow-hidden"
          >
            <CustomerOrderHistory
              userId={customer.id}
              initialOrders={customer.orders}
              totalOrders={customer.order_count}
            />
          </AdminCard>

          {/* Addresses */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
            {/* @ts-ignore */}
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* @ts-ignore */}
                {customer.addresses.map((addr: any) => (
                  <EditAddressModal
                    key={addr.id}
                    address={addr}
                    region={region}
                  />
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
                  <UserIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {displayName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs font-bold">@</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email
                  </p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-sm font-semibold text-blue-600 hover:underline break-all"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs font-bold">#</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {customer.phone || customer.addresses?.[0]?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Club Membership">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <AdminBadge variant={membershipVariant}>
                  {isMember ? "Active" : "Not Valid"}
                </AdminBadge>
              </div>
              {isMember && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.club_member_since
                        ? formatIST(customer.club_member_since)
                        : "Unknown"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </AdminCard>
        </div>
      </div>
      {/* Rewards Ledger */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Reward Transaction History
        </h2>
        <AdminCard
          title=""
          className="p-0 border-none shadow-sm overflow-hidden"
        >
          <CustomerRewardHistory
            userId={customer.id}
            initialTransactions={customer.reward_transactions}
            totalTransactions={customer.reward_transaction_total}
          />
        </AdminCard>
      </div>
      <div className="h-20" /> {/* Spacer */}
    </div>
  )
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: string
}) {
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${bgClass}`}>{icon}</div>
      </div>
    </div>
  )
}

function getStatusVariant(status: string) {
  switch (status) {
    case "paid":
      return "success"
    case "pending":
      return "warning"
    case "failed":
      return "error"
    case "cancelled":
      return "neutral"
    default:
      return "neutral"
  }
}
