import { listExclusiveCollections } from "@lib/data/exclusive-collections"
import { getClubSettings } from "@lib/data/club"
import ExclusiveCollections from "./index"

export default async function ExclusiveCollectionsServer() {
    const [exclusiveItems, clubSettings] = await Promise.all([
        listExclusiveCollections({ regionId: "reg_india" }),
        getClubSettings(),
    ])

    return (
        <ExclusiveCollections
            items={exclusiveItems}
            clubDiscountPercentage={clubSettings.discount_percentage}
        />
    )
}
