import Image from "next/image"

type BenefitCard = {
  id: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
}

const BENEFITS: BenefitCard[] = [
  {
    id: "national-delivery",
    title: "National Delivery",
    description: "We deliver to all states in India within 3-5 days of order",
    imageSrc: "/assets/images/planet_869092.png",
    imageAlt: "Illustration of a planet symbolizing nationwide reach",
  },
  {
    id: "best-quality",
    title: "Best Quality",
    description: "We provide the best quality products in the market at the best price",
    imageSrc: "/assets/images/high-quality_16090192.png",
    imageAlt: "Badge representing premium product quality",
  },
  {
    id: "best-offers",
    title: "Best Offers",
    description: "We provide the best offers on all products compared to others",
    imageSrc: "/assets/images/offer_2941125.png",
    imageAlt: "Price tag showing attractive offers",
  },
  {
    id: "easy-returns",
    title: "Easy Returns",
    description: "We provide easy returns on all products within 7 days",
    imageSrc: "/assets/images/easy-return_14784975.png",
    imageAlt: "Arrow illustrating hassle-free returns",
  },
]

const WhyChooseUs = () => {
  return (
    <section
      className="w-full bg-blue-100"
      aria-labelledby="why-choose-us-heading"
      data-testid="why-choose-us-section"
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:py-20">
        {/* <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1d6bea]">
            Why Choose Us
          </p>
          <h2 id="why-choose-us-heading" className="mt-3 text-3xl font-bold text-[#1b2240] md:text-4xl">
            Trusted by parents across India
          </h2>
          <p className="mt-4 text-base text-[#5f5d5d] md:text-lg">
            Four simple promises that keep every Toycker order smooth, transparent, and worry-free.
          </p>
        </div> */}

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit.id}>
              <article
                className="group h-full transition-transform duration-200 ease-out"
                aria-labelledby={`${benefit.id}-title`}
                tabIndex={0}
              >
                <span className="inline-flex h-18 w-18 items-center justify-center">
                  <Image
                    src={benefit.imageSrc}
                    alt={benefit.imageAlt}
                    width={300}
                    height={300}
                    className="h-16 w-16 object-contain"
                  />
                </span>
                <h3 id={`${benefit.id}-title`} className="mt-6 text-xl font-semibold text-[#1b2240]">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-base text-[#5f5d5d]">{benefit.description}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default WhyChooseUs
