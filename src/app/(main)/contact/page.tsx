import { Metadata } from "next"

import ContactPage from "@modules/contact/templates/contact-page"

export const metadata: Metadata = {
  title: "Contact Toycker",
  description:
    "Reach Toycker’s customer support for product questions, order help, or feedback.",
}

export default function ContactRoute() {
  return <ContactPage countryCode="in" />
}