import { getAdminOrder, updateOrderStatus } from "@/lib/data/admin"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CalendarIcon, CheckIcon } from "@heroicons/react/24/outline"
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
          <AdminCard title="Items" className="p-0">
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
                <span className="text-gray-900 font-bold">{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Shipping</span>
                <span className="text-emerald-600 font-bold uppercase tracking-tighter">Free Shipping</span>
              </div>
              <div className="flex justify-between text-lg font-black text-gray-900 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</span>
              </div>
            </div>
          </AdminCard>
          
          <AdminCard title="Timeline">
             <div className="space-y-8">
                <TimelineItem 
                  title="Fulfillment" 
                  description={order.status === 'shipped' ? "Items have been shipped to customer." : "Waiting to be fulfilled."} 
                  active={order.status === 'shipped'} 
                />
                <TimelineItem 
                  title="Payment" 
                  description={order.status !== 'pending' ? `Payment of ${convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })} captured via PayU.` : "Awaiting payment capture."} 
                  active={order.status !== 'pending'} 
                />
                <TimelineItem 
                  title="Order Placed" 
                  description={`Customer placed this order on ${new Date(order.created_at).toLocaleDateString()}.`} 
                  active={true} 
                  last
                />
             </div>
          </AdminCard>
        </div>

        <div className="space-y-8">
          <AdminCard title="Customer">
             <div className="space-y-4">
                <Link href={`/admin/customers/${order.user_id}`} className="block">
                   <p className="text-sm font-bold text-gray-900 hover:underline">{order.customer_email}</p>
                   <p className="text-xs text-gray-400 font-medium">Customer since {new Date(order.created_at).getFullYear()}</p>
                </Link>
                <div className="pt-4 border-t border-gray-100 space-y-2">
                   <div className="flex items-center text-sm text-gray-600 gap-3">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{order.customer_email}</span>
                   </div>
                   <div className="flex items-center text-sm text-gray-600 gap-3">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span>{order.shipping_address?.phone || 'No phone'}</span>
                   </div>
                </div>
             </div>
          </AdminCard>

          <AdminCard title="Shipping Address">
             <div className="flex gap-3 text-sm font-medium text-gray-600 leading-relaxed">
                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                   <p className="font-bold text-gray-900 tracking-tight">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
                   <p>{order.shipping_address?.address_1}</p>
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

function TimelineItem({ title, description, active, last }: { title: string, description: string, active: boolean, last?: boolean }) {
  return (
    <div className={`relative pl-8 ${last ? '' : 'pb-8'}`}>
       {!last && <div className={`absolute left-[11px] top-[24px] bottom-0 w-0.5 ${active ? 'bg-indigo-600' : 'bg-gray-100'}`} />}
       <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
          <CheckIcon className="h-3 w-3 stroke-[4]" />
       </div>
       <div>
          <p className={`text-sm font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{title}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">{description}</p>
       </div>
    </div>
  )
}