import { Metadata } from "next"
import { listHomeBannersAdmin } from "@/lib/actions/home-banners"
import { listExclusiveCollectionsAdmin } from "@/lib/actions/home-exclusive-collections"
import HomeSettingsClient from "./home-settings-client"

export const metadata: Metadata = {
    title: "Home Settings | Admin",
    description: "Manage homepage banners and exclusive collections",
}

export default async function HomeSettingsPage() {
    // Fetch data on server
    const { banners } = await listHomeBannersAdmin()
    const { collections } = await listExclusiveCollectionsAdmin()

    return (
        <HomeSettingsClient
            banners={banners}
            collections={collections}
        />
    )
}
