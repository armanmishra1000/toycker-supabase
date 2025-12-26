const StorySections = () => {
  return (
    <section className="bg-ui-bg-base" aria-labelledby="about-story-heading">
      <div className="content-container py-16 lg:py-24 space-y-16">
        {/* Our Story & Philosophy - two column */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full bg-white/60 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/80">
                Our Story
              </p>
            </div>
            <h2
              id="about-story-heading"
              className="mt-4 text-2xl lg:text-3xl font-bold text-ui-fg-base"
            >
              Our Story &amp; Philosophy
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ui-fg-subtle">
              Founded on the principles of creativity, affordability, and uncompromising quality,
              Toycker.com has grown into a trusted name in the toy industry. Our dedicated team
              works tirelessly to source the most exciting and in-demand toys from around the
              world—ensuring our collection stays fresh, relevant, and inspiring for children of all
              ages.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ui-fg-subtle">
              We collaborate with both renowned global toy manufacturers and emerging independent
              designers to offer a selection that is as diverse as it is delightful, catering to a
              wide spectrum of interests, abilities, and developmental stages.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white p-6 pb-7 text-sm leading-relaxed text-ui-fg-subtle shadow-md">
            <div
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
              aria-hidden="true"
            />
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary text-white px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase shadow-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white" />
              FAMILY
            </div>
            <p className="mt-4 text-sm font-semibold text-ui-fg-base">
              What this means for your family
            </p>
            <p className="mt-2 text-sm">
              A catalogue that feels hand-curated instead of overwhelming, with toys that match your
              child&apos;s stage, interests, and play style.
            </p>
          </div>
        </div>

        {/* Three mini sections as cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="group h-full rounded-2xl border border-ui-border-base bg-white p-6 shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="text-base font-semibold text-ui-fg-base">
              An Exceptional Shopping Experience
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-fg-subtle">
              From your very first click to the joyful moment of unboxing, we are committed to making
              your shopping journey effortless and enjoyable. Our user-friendly website features
              detailed product descriptions, high-resolution imagery, and transparent pricing to help
              you find the perfect toy with ease and confidence.
            </p>
          </article>

          <article className="group h-full rounded-2xl border border-ui-border-base bg-white p-6 shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="text-base font-semibold text-ui-fg-base">Always Ahead of the Curve</h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-fg-subtle">
              The world of toys evolves quickly—and so do we. By staying attuned to the latest
              trends, technologies, and educational insights, Toycker.com remains at the forefront of
              innovation, ensuring your family always has access to the newest and most enriching toys
              on the market.
            </p>
          </article>

          <article className="group h-full rounded-2xl border border-ui-border-base bg-white p-6 shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="text-base font-semibold text-ui-fg-base">
              More Than a Store – A Community
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-fg-subtle">
              At our core, we are more than just a retailer. We are a vibrant community of parents,
              guardians, educators, and toy enthusiasts who share a common goal: enriching
              children&apos;s lives through the power of play.
            </p>
          </article>
        </div>

        {/* Closing band */}
        <div className="rounded-3xl bg-primary px-6 py-7 text-sm leading-relaxed text-white lg:px-10">
          <p>
            We invite you to explore our ever-growing collection and experience the difference that
            thoughtful design, quality craftsmanship, and passion for play can bring to your home.
          </p>
          <p className="mt-3 font-semibold">
            Thank you for choosing Toycker.com—let&apos;s create moments of joy, imagination, and
            discovery together.
          </p>
        </div>
      </div>
    </section>
  )
}

export default StorySections
