import { Metadata } from "next"

import ContactPage from "@modules/contact/templates/contact-page"

export const metadata: Metadata = {
  title: "Contact Toycker",
  description:
    "Reach Toycker’s customer support for product questions, order help, or feedback.",
}

type ContactRouteProps = {
  params: Promise<{ countryCode: string }>
}

export default async function ContactRoute({ params }: ContactRouteProps) {
  const { countryCode } = await params

  return <ContactPage countryCode={countryCode} />
}
