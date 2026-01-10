import { listHomeBanners } from "@lib/data/home-banners"
import Hero from "./index"

export default async function HeroServer() {
    const banners = await listHomeBanners()
    return <Hero banners={banners} />
}
