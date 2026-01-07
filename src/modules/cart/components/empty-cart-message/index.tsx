import { ShoppingBag } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="py-24 sm:py-32 flex flex-col items-center text-center px-4"
      data-testid="empty-cart-message"
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm transition-transform hover:scale-105 duration-300">
        <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
        Your cart is empty
      </h1>

      <p className="text-slate-500 text-sm sm:text-base max-w-[320px] sm:max-w-md mb-10 leading-relaxed">
        Looks like you haven&apos;t added anything to your cart yet.
        Start exploring our collection of unique toys and finds!
      </p>

      <LocalizedClientLink
        href="/store"
        className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm sm:text-base"
      >
        Start Shopping
      </LocalizedClientLink>

      <div className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-medium">
        <span className="text-slate-400">Popular:</span>
        <LocalizedClientLink href="/collections/remote-controlled-toys" className="text-slate-600 hover:text-slate-900 transition-colors">
          Remote Controlled Toys
        </LocalizedClientLink>
        <LocalizedClientLink href="/collections/swing-car" className="text-slate-600 hover:text-slate-900 transition-colors">
          Swing Car
        </LocalizedClientLink>
        <LocalizedClientLink href="/collections/soft-toys" className="text-slate-600 hover:text-slate-900 transition-colors">
          Soft Toys
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
