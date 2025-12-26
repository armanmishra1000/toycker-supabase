import HeroSection from "@modules/about/components/hero-section"
import HighlightsSection from "@modules/about/components/highlights-section"
import StorySections from "@modules/about/components/story-sections"
import { heroContent } from "@modules/about/constants"

const AboutPage = () => {
  return (
    <div className="space-y-4 bg-white">
      <HeroSection content={heroContent} />
      <HighlightsSection />
      <StorySections />
    </div>
  )
}

export default AboutPage
