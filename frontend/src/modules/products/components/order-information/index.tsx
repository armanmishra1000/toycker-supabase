import { ShieldCheck, Truck, Wallet } from "lucide-react"

const ORDER_MESSAGES = [
  {
    icon: Truck,
    lead: "Order Now and",
    highlight: "Get it Delivered.",
    helper: "Speedy dispatch within 24 hours on all prepaid orders.",
  },
  {
    icon: Wallet,
    lead: "Cash On Delivery",
    highlight: "is Available",
    helper: "Pay securely at your doorstep across 18,000+ pin codes.",
  },
  {
    icon: ShieldCheck,
    lead: "Easy Returns / Exchanges Policy",
    highlight: "(Wrong/Damaged items Only)",
    helper: "Initiate a request within 7 days for a no-hassle exchange.",
  },
]

const OrderInformation = () => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 mt-4">
      {ORDER_MESSAGES.map(({ icon: Icon, lead, highlight, helper }, index) => (
        <div
          key={lead}
          className={`flex items-start gap-4 py-4 ${
            index === 0 ? "pt-0" : "border-t border-dashed border-slate-200"
          } ${index === ORDER_MESSAGES.length - 1 ? "pb-0" : ""}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
            <Icon className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              {lead} <span className="font-semibold text-slate-900">{highlight}</span>
            </p>
            <p className="text-xs text-slate-500">{helper}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrderInformation
