import { CheckBadgeIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/solid"
const highlights = [
  {
    id: "quality",
    title: "Curated quality",
    description:
      "Every toy is handpicked for build quality, replay value, and genuine wow-factor—not just shelf appeal.",
    Icon: CheckBadgeIcon,
  },
  {
    id: "safety",
    title: "Safety first",
    description:
      "Clear age guidance, material checks, and partner factories that meet strict global safety standards.",
    Icon: ShieldCheckIcon,
  },
  {
    id: "experience",
    title: "Effortless experience",
    description:
      "Fast search, honest pricing, and helpful support so you spend less time scrolling and more time playing.",
    Icon: SparklesIcon,
  },
]

const HighlightsSection = () => {
  return (
    <section className="bg-ui-bg-subtle" aria-labelledby="about-highlights-heading">
      <div className="content-container py-12 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
            Why families choose us
          </p>
          <h2
            id="about-highlights-heading"
            className="mt-3 text-2xl lg:text-3xl font-bold text-ui-fg-base"
          >
            Thoughtful toys, simple decisions
          </h2>
          <p className="mt-3 text-sm lg:text-base leading-relaxed text-ui-fg-subtle">
            We keep the hard work behind the scenes—research, curation, and testing—so choosing the
            right toy feels easy, fun, and reassuring.
          </p>
        </div>

        <ul className="mt-8 grid gap-6 md:grid-cols-3" aria-label="Key reasons families pick Toycker.com">
          {highlights.map((item) => {
            const { Icon } = item

            return (
              <li
                key={item.id}
                className="relative h-full rounded-2xl border border-ui-border-base bg-white/80 p-5 shadow-md shadow-primary/5 hover:-translate-y-1 hover:shadow-primary/20 transition-transform"
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-ui-fg-base">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ui-fg-subtle">
                  {item.description}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default HighlightsSection
