import { getAdminOrder, updateOrderStatus } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline"
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
          <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
            Mark as Paid
          </button>
        </form>
      )}
      {order.status === 'paid' && (
        <form action={updateOrderStatus.bind(null, order.id, 'shipped')}>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
            Fulfill Items
          </button>
        </form>
      )}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Link href="/admin/orders" className="flex items-center hover:text-black transition-colors">
          <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
          Back to Orders
        </Link>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Order #{order.display_id}</h1>
          <AdminBadge variant={order.status === 'paid' ? "success" : order.status === 'shipped' ? "info" : "warning"}>
            {order.status}
          </AdminBadge>
        </div>
        {actions}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AdminCard title="Order Summary" className="p-0">
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="p-6 flex items-center gap-5 group">
                  <div className="h-20 w-20 relative rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 transition-all group-hover:border-gray-300">
                    {item.thumbnail && <Image src={item.thumbnail} alt="" fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">SKU: {item.variant?.sku || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{convertToLocale({ amount: item.unit_price, currency_code: order.currency_code })} × {item.quantity}</p>
                    <p className="text-sm font-black text-gray-900 mt-0.5">{convertToLocale({ amount: item.total, currency_code: order.currency_code })}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Subtotal</span>
                <span className="text-gray-900">{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Standard Shipping</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-lg font-black text-gray-900 pt-4 border-t border-gray-200">
                <span>Total paid by customer</span>
                <span>{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</span>
              </div>
            </div>
          </AdminCard>
          
          <AdminCard title="Payment Timeline">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                   <CheckCircleIcon className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-sm font-bold text-gray-900">Payment captured via PayU</p>
                   <p className="text-xs text-gray-400 font-medium">Transaction ID: {order.payu_txn_id || 'N/A'}</p>
                </div>
             </div>
          </AdminCard>
        </div>

        <div className="space-y-8">
          <AdminCard title="Customer Profile">
             <div className="space-y-5">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 border border-gray-200 uppercase">
                      {order.customer_email.charAt(0)}
                   </div>
                   <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{order.customer_email}</p>
                      <p className="text-xs text-gray-400 font-medium">Customer</p>
                   </div>
                </div>
                <div className="space-y-3 pt-5 border-t border-gray-100">
                   <div className="flex items-center text-sm text-gray-600 gap-3 group">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 group-hover:text-black" />
                      <span className="font-medium truncate">{order.customer_email}</span>
                   </div>
                   <div className="flex items-center text-sm text-gray-600 gap-3 group">
                      <PhoneIcon className="h-4 w-4 text-gray-400 group-hover:text-black" />
                      <span className="font-medium">{order.shipping_address?.phone || 'No phone provided'}</span>
                   </div>
                </div>
             </div>
          </AdminCard>

          <AdminCard title="Shipping Destination">
             <div className="flex gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 font-medium leading-relaxed">
                   <p className="font-black text-gray-900 mb-1 tracking-tight">
                     {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                   </p>
                   <p>{order.shipping_address?.address_1}</p>
                   {order.shipping_address?.address_2 && <p>{order.shipping_address.address_2}</p>}
                   <p className="uppercase">{order.shipping_address?.city} {order.shipping_address?.postal_code}</p>
                   <p className="text-xs font-bold text-gray-400 mt-2">{order.shipping_address?.country_code?.toUpperCase()}</p>
                </div>
             </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

import { CheckCircleIcon } from "@heroicons/react/24/solid"