import { Order } from "@/lib/supabase/types"
import { Text } from "@modules/common/components/text"
import { MapPin, Phone, Truck } from "lucide-react"


type ShippingDetailsProps = {
  order: Order
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <Truck className="w-5 h-5 text-slate-400" />
        <h3 className="text-xl font-bold text-slate-900">Delivery Details</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Address */}
        <div className="flex flex-col gap-y-3" data-testid="shipping-address-summary">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <MapPin className="w-3.5 h-3.5" />
            Shipping Address
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
            <Text className="text-slate-900 font-bold">
              {order.shipping_address?.first_name} {order.shipping_address?.last_name}
            </Text>
            <Text className="text-slate-600 mt-1 leading-relaxed">
              {order.shipping_address?.address_1}
              {order.shipping_address?.address_2 && `, ${order.shipping_address.address_2}`}
              <br />
              {order.shipping_address?.city}, {order.shipping_address?.province}{" "}
              {order.shipping_address?.postal_code}
              <br />
              {order.shipping_address?.country_code?.toUpperCase()}
            </Text>
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-y-3" data-testid="shipping-contact-summary">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <Phone className="w-3.5 h-3.5" />
            Contact Info
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-y-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Phone</p>
              <Text className="text-slate-900 font-bold">
                {order.shipping_address?.phone || "Not provided"}
              </Text>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Email</p>
              <Text className="text-slate-900 font-bold">{order.email}</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingDetails