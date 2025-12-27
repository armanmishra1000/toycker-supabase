import { getAdminOrder, updateOrderStatus } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"
import Image from "next/image"

export default async function AdminOrderDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getAdminOrder(id)

  if (!order) notFound()

  const actions = (
    <div className="flex gap-2">
      {order.status === 'pending' && (
        <form action={updateOrderStatus.bind(null, order.id, 'paid')}>
          <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
            Mark as Paid
          </button>
        </form>
      )}
      {order.status === 'paid' && (
        <form action={updateOrderStatus.bind(null, order.id, 'shipped')}>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-sm">
            Mark as Shipped
          </button>
        </form>
      )}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <nav className="flex items-center text-sm font-medium text-gray-500">
        <Link href="/admin/orders" className="flex items-center hover:text-gray-900 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Orders
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">#{order.display_id}</h1>
        <AdminBadge variant={order.status === 'paid' ? "success" : order.status === 'shipped' ? "info" : "warning"}>
          {order.status}
        </AdminBadge>
        <span className="text-gray-500 text-sm font-medium">
          {new Date(order.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Order Items" className="p-0">
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="h-16 w-16 relative rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                    {item.thumbnail && <Image src={item.thumbnail} alt="" fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 font-medium">SKU: {item.variant?.sku || 'N/A'}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-gray-900">{convertToLocale({ amount: item.unit_price, currency_code: order.currency_code })} × {item.quantity}</p>
                    <p className="font-bold text-gray-900">{convertToLocale({ amount: item.total, currency_code: order.currency_code })}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</span>
              </div>
            </div>
          </AdminCard>
          
          <AdminCard title="Payment">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-gray-100 rounded-lg">
                      <span className="text-xs font-bold text-gray-500">PAYU</span>
                   </div>
                   <span className="text-sm text-gray-600">Transaction ID: {order.payu_txn_id || 'N/A'}</span>
                </div>
                <AdminBadge variant={order.status === 'paid' ? 'success' : 'warning'}>
                   {order.status === 'paid' ? 'Authorized' : 'Awaiting Payment'}
                </AdminBadge>
             </div>
          </AdminCard>
        </div>

        {/* Right Column: Customer Info */}
        <div className="space-y-6">
          <AdminCard title="Customer">
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-semibold text-gray-900">{order.customer_email}</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-100">
                   <div className="flex items-center text-sm text-gray-600 gap-2">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{order.customer_email}</span>
                   </div>
                   <div className="flex items-center text-sm text-gray-600 gap-2">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{order.shipping_address?.phone || 'No phone'}</span>
                   </div>
                </div>
             </div>
          </AdminCard>

          <AdminCard title="Shipping Address">
             <div className="text-sm text-gray-600 leading-relaxed">
                <p className="font-semibold text-gray-900 mb-1">
                  {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                </p>
                <p>{order.shipping_address?.address_1}</p>
                {order.shipping_address?.address_2 && <p>{order.shipping_address.address_2}</p>}
                <p>{order.shipping_address?.city}, {order.shipping_address?.postal_code}</p>
                <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
             </div>
          </AdminCard>

          <div className="p-2">
             <AdminPageHeader title="" actions={actions} />
          </div>
        </div>
      </div>
    </div>
  )
}