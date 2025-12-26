import { Metadata } from "next"
import { notFound } from "next/navigation"

type PolicySlug = "returns" | "shipping" | "terms" | "privacy"

type PolicySection = {
  heading: string
  body: string[]
}

const POLICY_CONTENT: Record<PolicySlug, { title: string; intro: string; sections: PolicySection[] }> = {
  returns: {
    title: "Return, Refund & Cancellation Policy",
    intro:
      "Effective 11 August 2025 – Our goal is to keep every Toycker unboxing joyful. When that doesn’t happen, this guide explains how cancellations, returns, and refunds work.",
    sections: [
      {
        heading: "Order cancellation",
        body: [
          "Orders can be cancelled only before shipment. Once a parcel is dispatched, Cancellations should be done within 7 days.",
          "Write to customercare@toycker.com or call +91 9925819694 with your order ID for manual support.",
        ],
      },
      {
        heading: "Return & exchange basics",
        body: [
          "Eligible products show their return window on the product page, Exchange or Replacement will be done Within 7 days.",
          "Return will be done within 7 business days.",
          "Items must be unused, unwashed, and sent back with original packaging, tags, and accessories for hygiene and quality reasons.",
          "If Toycker pickup isn’t available in your pin code, self-ship to: Toycker.com Returns Department, Shed No. 7/8, Sardar Campus, Opp. River Kent, Mota Varachha, Surat, Gujarat, 394101.",
        ],
      },
      {
        heading: "Charges & non-eligible items",
        body: [
          "Return/exchange fees depend on reason and product type; customised or final-sale pieces are non-returnable.",
          "Damaged goods caused by misuse, or shipments missing packaging, are rejected.",
        ],
      },
      {
        heading: "Refund timelines",
        body: [
          "Once the returned item passes inspection, If approved ,Refund will be credited within 7 days to the original payment method.",
          "Bank/issuer processing can add extra days before the credit reflects in your account.",
        ],
      },
      {
        heading: "Need help?",
        body: [
          "Reach Toycker Customer Care at customercare@toycker.com or +91 9925819694.",
          "Postal correspondence: Shed No. 7/8, Sardar Campus, Opp. River Kent, Mota Varachha, Surat, Gujarat, 394101.",
        ],
      },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    intro:
      "We currently ship across India from our Surat hub and can review international requests individually. Here’s how Toycker handles delivery timelines and costs.",
    sections: [
      {
        heading: "Methods & timelines",
        body: [
          "Product will be delivered within 7-10 business days.",
          "Orders are processed after confirmation; anything placed after the cutoff moves to the next day.",
        ],
      },
      {
        heading: "Charges & thresholds",
        body: [
          "Shipping fees are calculated during checkout and we announce active free-shipping thresholds there as well.",
          "International deliveries may attract duties, taxes, or brokerage fees which remain the customer’s responsibility.",
        ],
      },
      {
        heading: "Multiple packages & tracking",
        body: [
          "Large orders can ship in separate parcels; backordered items dispatch as soon as they arrive in stock.",
          "We email tracking links the moment a shipment leaves our facility so you can monitor every scan.",
        ],
      },
      {
        heading: "Delays & support",
        body: [
          "Weather, high volume, or logistics disruptions can add time—thank you for your patience if that happens.",
          "For help, contact +91 9925819694 or customercare@toycker.com (Shed No. 7/8, Sardar Campus, Opp. River Kent, Mota Varachha, Surat, Gujarat, 394101).",
        ],
      },
      {
        heading: "Contact information",
        body: [
          "KESHAV ENTERPRISE, Shed No. 7/8, Sardar Campus, Opp. River Kent, Mota Varachha, Surat, Gujarat, 394101",
          "Phone: +91 9925819694 | Email: customercare@toycker.com",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro:
      "Effective 11 August 2025 – Using Toycker.com means you accept the guidelines below. They safeguard your experience and our platform.",
    sections: [
      {
        heading: "Use of the website",
        body: [
          "You must be 18+ or have guardian consent to place orders, and you agree to use the site only for lawful activity.",
          "Unauthorized attempts to disrupt services or access systems may lead to damages and criminal proceedings.",
        ],
      },
      {
        heading: "IP & content accuracy",
        body: [
          "All text, images, graphics, and branding belong to Toycker.com and cannot be reused without written permission.",
          "We strive for accurate product data but reserve the right to correct errors in listings, pricing, or availability without notice.",
        ],
      },
      {
        heading: "Accounts, orders & payments",
        body: [
          "Keep your login credentials confidential; you’re responsible for activity on your account.",
          "Orders are confirmed after full payment via the methods displayed at checkout. Title and risk transfer upon delivery.",
        ],
      },
      {
        heading: "Returns & conduct",
        body: [
          "Returns/cancellations follow the policies available on the website; customized products may be excluded.",
          "You must not post harmful content, attempt unauthorized access, or otherwise disrupt other shoppers.",
        ],
      },
      {
        heading: "Liability, disputes & updates",
        body: [
          "Toycker isn’t liable for indirect or consequential damages; our maximum liability equals the order amount in question.",
          "These Terms follow Indian law with exclusive jurisdiction in Surat, Gujarat. We encourage amicable resolution before legal steps.",
          "We may update Terms periodically; continued use after changes signals acceptance of the latest version.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "Effective 11 August 2025 – This Privacy Policy explains how Keshav Enterprises (Toycker.com) collects, uses, and protects data every time you browse or shop with us.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Personal data such as name, email, phone, shipping/billing addresses, and order history.",
          "Payment references processed via PCI-compliant gateways (Toycker does not store full card numbers).",
          "Browsing/device data, cookies, and communication records that help us improve support.",
        ],
      },
      {
        heading: "How we use data",
        body: [
          "Fulfil orders, process payments, deliver products, and respond to support requests.",
          "Improve the website, personalize offers (with consent), and prevent fraudulent activity.",
          "Comply with legal obligations and maintain necessary audit logs.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Access, correct, delete, or request a copy of the personal information we hold.",
          "Restrict/ object to processing, or withdraw marketing consent at any time.",
          "Contact customercare@toycker.com / +91 9925819694 for privacy requests.",
        ],
      },
      {
        heading: "Security & retention",
        body: [
          "We use SSL encryption, secure servers, and regular vulnerability tests to guard against unauthorized access.",
          "Data is retained only as long as needed for services, disputes, or legal obligations before secure deletion.",
          "International transfers (when applicable) follow relevant legal safeguards.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "KESHAV ENTERPRISE, Shed No. 7/8, Sardar Campus, Opp. River Kent, Mota Varachha, Surat, Gujarat, 394101.",
          "customercare@toycker.com | +91 9925819694",
        ],
      },
    ],
  },
}

type PolicyRouteProps = {
  params: Promise<{ countryCode: string; slug: string }>
}

export const metadata: Metadata = {
  title: "Toycker Policies",
  description: "Read Toycker’s store policies covering returns, refunds, shipping promises, and terms of service.",
}

export default async function PolicyRoute({ params }: PolicyRouteProps) {
  const { slug, countryCode } = await params
  const policy = POLICY_CONTENT[slug as PolicySlug]

  if (!policy) {
    notFound()
  }

  return (
    <section className="content-container py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Policy</p>
      <h1 className="mt-2 text-4xl font-bold text-slate-900">{policy.title}</h1>
      <p className="mt-4 max-w-3xl text-base text-slate-600">
        {policy.intro} These guidelines apply to all orders shipped to <span className="font-semibold">{countryCode.toUpperCase()}</span>.
      </p>

      <div className="mt-10 space-y-8">
        {policy.sections.map((section) => (
          <article key={section.heading} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">{section.heading}</h2>
            <ul className="mt-4 space-y-3 text-slate-600">
              {section.body.map((paragraph) => (
                <li key={paragraph} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <span>{paragraph}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
