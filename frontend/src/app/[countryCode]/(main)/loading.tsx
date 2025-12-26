const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-ui-bg-base/70 ${className ?? ""}`} />
)

const HomeLoading = () => {
  return (
    <div className="space-y-6">
      <section className="w-full">
        <div className="w-full md:px-4 md:py-8">
          <div className="relative overflow-hidden rounded-2xl bg-ui-bg-base animate-pulse aspect-[16/9]" />
        </div>
      </section>

      <div className="mx-auto max-w-screen-2xl px-4 space-y-4">
        <div className="h-4 w-40 rounded-full bg-ui-bg-base/70 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <SkeletonBlock key={key} className="h-44" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomeLoading
