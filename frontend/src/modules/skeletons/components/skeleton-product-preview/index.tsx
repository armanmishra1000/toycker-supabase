import { clx } from "@medusajs/ui"
import { ViewMode } from "@modules/store/components/refinement-list/types"

type SkeletonProductPreviewProps = {
  viewMode?: ViewMode
}

const SkeletonProductPreview = ({ viewMode = "grid-4" }: SkeletonProductPreviewProps) => {
  const isList = viewMode === "list"

  const cardClassName = clx("group relative block overflow-hidden", {
    "flex flex-row gap-6": isList,
  })

  const wrapperClassName = clx(
    "flex flex-col gap-4 animate-pulse",
    {
      "flex w-full flex-row gap-6": isList,
    }
  )

  const imageWrapperClassName = clx(
    "relative w-full overflow-hidden rounded-2xl bg-ui-bg-subtle",
    {
      "w-48 shrink-0 aspect-square": isList,
      "aspect-square": !isList,
    }
  )

  const titleSizeMap: Record<ViewMode, string> = {
    "grid-4": "h-5 w-2/3",
    "grid-5": "h-4 w-3/4",
    list: "h-6 w-3/4",
  }

  const buttonWidthMap: Record<ViewMode, string> = {
    "grid-4": "w-28",
    "grid-5": "w-24",
    list: "w-40",
  }

  return (
    <div className={cardClassName}>
      <div className={wrapperClassName}>
        <div className={imageWrapperClassName}>
          <div className="absolute right-3 top-3 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
            <div className="h-9 w-9 rounded-full bg-white/80 shadow-lg" />
          </div>
          <div className="h-full w-full rounded-2xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className={clx("rounded-full bg-slate-200", titleSizeMap[viewMode] ?? "h-5 w-2/3")} />
            </div>
            {isList && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-3 w-full rounded-full bg-slate-100" />
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4">
            <div className="h-4 w-16 rounded-full bg-slate-200" />
            <div className={clx("h-9 rounded-full bg-slate-900/10", buttonWidthMap[viewMode] ?? "w-28")} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview
