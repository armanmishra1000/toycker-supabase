import { Metadata } from "next"

import AboutPage from "@modules/about/templates/about-page"

export const metadata: Metadata = {
  title: "About Toycker",
  description: "Discover Toycker’s mission, safety standards, sustainability promises, and the team crafting joyful play.",
}

export default function AboutRoute() {
  return <AboutPage />
}
