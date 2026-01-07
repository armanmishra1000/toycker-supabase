import { Metadata } from "next"
import AboutPageTemplate from "@modules/about/templates/about-page"

export const metadata: Metadata = {
    title: "About Us | Toycker",
    description: "Learn about Toycker - Your trusted destination for quality toys.",
}

export default function AboutPage() {
    return <AboutPageTemplate />
}
