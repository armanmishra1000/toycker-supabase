import type { Metadata } from "next"

type MembershipRouteProps = {
  params: Promise<{ countryCode: string }>
}

export const metadata: Metadata = {
  title: "Toycker Membership",
  description:
    "Learn about Toycker Membership perks – from faster delivery to member-only drops and extended support.",
}

const MEMBERSHIP_TIERS = [
  {
    id: "spark",
    name: "Spark",
    price: "Free",
    perks: [
      "Save favorites and build wishlists",
      "Early notice on seasonal sales",
      "Access to parenting tips & activity guides",
    ],
  },
  {
    id: "glow",
    name: "Glow",
    price: "₹1,999 / year",
    perks: [
      "Priority customer care",
      "Extended 45-day return window",
      "Member-only bundles with flat 10% off",
    ],
  },
  {
    id: "nova",
    name: "Nova",
    price: "₹4,999 / year",
    perks: [
      "Same-day dispatch on stocked items",
      "Complimentary gift wrapping",
      "Quarterly surprise play kits curated for your child",
    ],
  },
]

export default async function MembershipRoute({ params }: MembershipRouteProps) {
  const { countryCode } = await params

  return (
    <section className="content-container py-16">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-primary uppercase">Membership</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Perks tailored for playful families</h1>
        <p className="mt-4 text-base text-slate-600">
          Toycker Membership keeps every delivery smoother for <span className="font-semibold">{countryCode.toUpperCase()}</span> shoppers:
          early drops, faster support, and curated experiences for each age milestone. Choose a tier that fits your
          family and upgrade anytime.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {MEMBERSHIP_TIERS.map((tier) => (
          <article
            key={tier.id}
            className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{tier.name}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{tier.price}</p>
            </div>
            <ul className="mt-6 space-y-3 text-left text-slate-600">
              {tier.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Join {tier.name}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
