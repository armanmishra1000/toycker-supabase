import { getClubSettings } from "@lib/data/club"
import { retrieveCustomer } from "@lib/data/customer"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import AccountClubTemplate from "@modules/account/templates/account-club-template"

export const metadata: Metadata = {
    title: "Club Membership",
    description: "View your Toycker Club membership status and savings.",
}

export default async function AccountClubPage() {
    const customer = await retrieveCustomer()
    const clubSettings = await getClubSettings()

    if (!customer) {
        notFound()
    }

    return (
        <AccountClubTemplate customer={customer} clubSettings={clubSettings} />
    )
}
