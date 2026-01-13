import { getAdminOrder, getActiveShippingPartners, getOrderTimeline, getCustomerDisplayId } from "@/lib/data/admin"
import { formatCustomerDisplayId } from "@/lib/util/customer"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CheckIcon, TruckIcon, CreditCardIcon, GiftIcon } from "@heroicons/react/24/outline"
import AdminCard from "@modules/admin/components/admin-card"
import AdminBadge from "@modules/admin/components/admin-badge"
import { convertToLocale } from "@lib/util/money"
import Image from "next/image"
import FulfillmentModal from "./fulfillment-modal"
import { MarkAsPaidButton } from "./mark-as-paid-button"
import { formatIST } from "@/lib/util/date"

export default async function AdminOrderDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getAdminOrder(id)

  if (!order) notFound()

  // Fetch additional data
  const [shippingPartners, timeline, customerDisplayId] = await Promise.all([
    getActiveShippingPartners(),
    getOrderTimeline(id).catch(() => []),
    order.user_id ? getCustomerDisplayId(order.user_id).catch(() => null) : null
  ])

  const canFulfill = order.fulfillment_status === "not_shipped" || order.fulfillment_status === "not_fulfilled"

  const actions = (
    <div className="flex gap-2">
      {(order.payment_status === 'awaiting' || order.payment_status === 'pending') && (
        <MarkAsPaidButton orderId={order.id} />
      )}
      {canFulfill && (
        <FulfillmentModal orderId={order.id} shippingPartners={shippingPartners} />
      )}
    </div>
  )

  // Determine payment method display with specific sub-method for PayU
  let paymentMethod = order.payment_method || (order.payu_txn_id ? "PayU" : "Cash on Delivery")
  if (order.payu_txn_id && order.metadata?.payu_payload) {
    const payload = order.metadata.payu_payload as any
    const modeMap: Record<string, string> = {
      'CC': 'Credit Card',
      'DC': 'Debit Card',
      'NB': 'Net Banking',
      'UPI': 'UPI',
      'UP': 'UPI',
      'CASH': 'Cash Card',
      'EMI': 'EMI'
    }
    const mode = payload.mode ? (modeMap[payload.mode] || payload.mode) : ""
    const bank = payload.bankcode && payload.bankcode !== 'UPI' ? ` (${payload.bankcode})` : ""
    paymentMethod = `PayU - ${mode}${bank}`.trim()
  }

  const rewardsUsed = Number(order.metadata?.rewards_used || 0)

  return (
    <div className="space-y-6">
      <nav className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
        <Link href="/admin/orders" className="flex items-center hover:text-black transition-colors">
          <ChevronLeftIcon className="h-3 w-3 mr-1" strokeWidth={3} />
          Back to Orders
        </Link>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Order #{order.display_id}</h1>
          <AdminBadge variant={order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered' ? "info" : "warning"}>
            {order.fulfillment_status === 'shipped' ? 'Shipped' : order.fulfillment_status === 'delivered' ? 'Delivered' : 'Unfulfilled'}
          </AdminBadge>
        </div>
        {actions}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Items */}
          <AdminCard title="Items" className="p-0">
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: { id: string; thumbnail?: string; title: string; variant?: { sku?: string }; unit_price: number; quantity: number; total: number }) => (
                <div key={item.id} className="p-6 flex items-center gap-5 group">
                  <div className="h-20 w-20 relative rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 transition-all group-hover:border-gray-300">
                    {item.thumbnail && <Image src={item.thumbnail} alt="" fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">SKU: {item.variant?.sku || 'N/A'}</p>
                    {(item as any).metadata?.gift_wrap && (
                      <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-50 border border-pink-100 w-fit">
                        <GiftIcon className="h-3 w-3 text-pink-500" />
                        <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">Gift Wrapped</span>
                      </div>
                    )}
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
                <span className="text-gray-900 font-bold">{convertToLocale({ amount: order.subtotal || (order.total_amount + rewardsUsed), currency_code: order.currency_code })}</span>
              </div>
              {(order.metadata as any)?.club_savings && Number((order.metadata as any).club_savings) > 0 && (
                <div className="flex justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">Club Savings</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">Member</span>
                  </div>
                  <span className="text-blue-600 font-bold">-{convertToLocale({ amount: Number((order.metadata as any).club_savings), currency_code: order.currency_code })}</span>
                </div>
              )}
              {rewardsUsed > 0 && (
                <div className="flex justify-between text-sm font-medium text-emerald-600">
                  <span>Reward Points</span>
                  <span className="font-bold">-{convertToLocale({ amount: rewardsUsed, currency_code: order.currency_code })}</span>
                </div>
              )}
              {(order.metadata as any)?.promo_discount && Number((order.metadata as any).promo_discount) > 0 && (
                <div className="flex justify-between text-sm font-medium text-orange-600">
                  <span>Promo Discount</span>
                  <span className="font-bold">-{convertToLocale({ amount: Number((order.metadata as any).promo_discount), currency_code: order.currency_code })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Shipping</span>
                <span className="text-emerald-600 font-bold uppercase tracking-tighter">
                  {order.shipping_total === 0 ? "Free Shipping" : convertToLocale({ amount: order.shipping_total || 0, currency_code: order.currency_code })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-500">
                <span>Taxes</span>
                <span className="text-gray-900 font-bold">{convertToLocale({ amount: order.tax_total || 0, currency_code: order.currency_code })}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-gray-900 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>{convertToLocale({ amount: order.total_amount, currency_code: order.currency_code })}</span>
              </div>
            </div>
          </AdminCard>

          {/* Timeline */}
          <AdminCard title="Timeline">
            <div className="space-y-6">
              {timeline.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  title={event.title}
                  description={event.description || ""}
                  timestamp={formatIST(event.created_at)}
                  actor={event.actor}
                  active={true}
                  last={index === timeline.length - 1 && timeline.some(e => e.event_type === 'order_placed')}
                />
              ))}
              {!timeline.some(e => e.event_type === 'order_placed') && (
                <TimelineItem
                  title="Order Placed"
                  description="Customer placed this order."
                  timestamp={formatIST(order.created_at)}
                  actor="customer"
                  active={true}
                  last={true}
                />
              )}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-8">
          {/* Payment Info */}
          <AdminCard title="Payment">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CreditCardIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{paymentMethod}</p>
                  <p className="text-xs text-gray-500">
                    {paymentMethod.includes('Cash on Delivery') || paymentMethod.includes('Manual')
                      ? (order.payment_status === 'paid' || order.payment_status === 'captured' ? 'COD - Collected' : 'COD - Pending')
                      : (order.payment_status === 'paid' || order.payment_status === 'captured' ? 'Paid' : order.payment_status)}
                  </p>
                </div>
              </div>
              {order.payu_txn_id && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Transaction ID</p>
                  <p className="text-sm font-mono text-gray-700 mt-1">{order.payu_txn_id}</p>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Customer */}
          <AdminCard title="Customer">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Link href={`/admin/customers/${order.user_id}`} className="block">
                  <p className="text-sm font-bold text-gray-900 hover:underline">{order.customer_email}</p>
                  <p className="text-xs text-gray-400 font-medium">Customer since {new Date(order.created_at).getFullYear()}</p>
                </Link>
                {customerDisplayId && (
                  <div className="px-2 py-1 bg-indigo-50 rounded text-xs font-bold text-indigo-700">
                    {formatCustomerDisplayId(customerDisplayId)}
                  </div>
                )}
              </div>
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

          {/* Shipping Info */}
          <AdminCard title="Shipping">
            <div className="space-y-4">
              {order.shipping_partner_id && order.tracking_number && (
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <TruckIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Tracking: {order.tracking_number}</p>
                    <p className="text-xs text-gray-500">{order.fulfillment_status}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 text-sm font-medium text-gray-600 leading-relaxed">
                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 tracking-tight">
                    {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                  </p>
                  {order.shipping_address?.company && (
                    <p className="text-gray-500 text-xs font-bold">{order.shipping_address.company}</p>
                  )}
                  <p>{order.shipping_address?.address_1}</p>
                  {order.shipping_address?.address_2 && (
                    <p>{order.shipping_address.address_2}</p>
                  )}
                  <p className="uppercase">
                    {order.shipping_address?.city}
                    {order.shipping_address?.province ? `, ${order.shipping_address.province}` : ""}
                    {` ${order.shipping_address?.postal_code}`}
                  </p>
                  <p className="text-xs font-bold text-gray-400 mt-2">{order.shipping_address?.country_code?.toUpperCase()}</p>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ title, description, timestamp, actor, active, last }: { title: string, description: string, timestamp: string, actor: string, active: boolean, last?: boolean }) {
  return (
    <div className={`relative pl-8 ${last ? '' : 'pb-6'}`}>
      {!last && <div className={`absolute left-[11px] top-[24px] bottom-0 w-0.5 ${active ? 'bg-indigo-600' : 'bg-gray-100'}`} />}
      <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
        <CheckIcon className="h-3 w-3 stroke-[4]" />
      </div>
      <div>
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{title}</p>
          <span className="text-[10px] text-gray-400 font-medium">{timestamp}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {actor === 'system' ? '💻 System' : actor === 'customer' ? '👤 Customer' : `🛡️ Admin: ${actor}`}
          </span>
        </div>
      </div>
    </div>
  )
}