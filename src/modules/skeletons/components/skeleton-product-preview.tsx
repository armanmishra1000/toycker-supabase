import { cn } from "@lib/util/cn"

const SkeletonProductPreview = () => {
  const block = "animate-pulse bg-slate-200"

  return (
    <div className="group relative flex flex-col h-full">
      {/* Image container */}
      <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <div className={cn(block, "h-full w-full rounded-2xl")} />
      </div>

      {/* Product details */}
      <div className="flex flex-col gap-1 mt-3 flex-1">
        {/* Product title */}
        <div className={cn(block, "h-5 w-4/5 rounded")} />

        {/* Price section */}
        <div className="mt-auto space-y-1.5 pt-2">
          {/* Current price and original price row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Current price */}
            <div className={cn(block, "h-6 w-20 rounded")} />
            {/* Original price */}
            <div className={cn(block, "h-5 w-20 rounded opacity-50")} />
            {/* Discount badge */}
            <div className={cn(block, "h-5 w-16 rounded-full")} />
          </div>

          {/* Club price */}
          <div className={cn(block, "h-5 w-32 rounded")} />
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview