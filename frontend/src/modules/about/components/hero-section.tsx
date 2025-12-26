import Image from "next/image"
import Link from "next/link"

import { HeroContent } from "@modules/about/constants"

type HeroSectionProps = {
  content: HeroContent
}

const HeroSection = ({ content }: HeroSectionProps) => {
  const primaryHref = content.primaryCta.href
  const secondaryHref = content.secondaryCta.href

  return (
    <section className="bg-gradient-to-b from-primary/5 via-white to-white" aria-labelledby="about-hero-heading">
      <div className="content-container py-16 lg:py-24 grid gap-10 lg:grid-cols-2 items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
            {content.eyebrow}
          </p>
          <h1 id="about-hero-heading" className="mt-4 text-4xl font-bold text-ui-fg-base lg:text-5xl">
            {content.title}
          </h1>
          <p className="mt-3 text-xl font-semibold text-primary/80">{content.subtitle}</p>
          <p className="mt-6 text-base text-ui-fg-subtle leading-relaxed">
            {content.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-white text-sm font-semibold shadow-lg shadow-primary/20 transition hover:scale-[1.01]"
            >
              {content.primaryCta.label}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-full border border-primary px-6 py-3 text-primary text-sm font-semibold transition hover:bg-primary/10"
            >
              {content.secondaryCta.label}
            </Link>
          </div>
        </div>

        <div className="relative h-80 w-full overflow-hidden rounded-3xl bg-secondary/10 shadow-2xl shadow-secondary/20 lg:h-full">
          <Image
            src={content.image.src}
            alt={content.image.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
