import { cn } from "@lib/util/cn"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800", className)}>
      <span className="font-semibold">Attention:</span> For testing purposes only.
    </div>
  )
}

export default PaymentTest