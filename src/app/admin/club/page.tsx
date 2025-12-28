import { getClubSettings } from "@lib/data/club"
import ClubSettingsForm from "@modules/admin/components/club-settings-form/index"
import AdminPageHeader from "@modules/admin/components/admin-page-header"

export default async function AdminClubPage() {
    const settings = await getClubSettings()

    return (
        <div className="w-full">
            <AdminPageHeader
                title="Club Membership Settings"
                subtitle="Manage membership criteria and benefits"
            />

            <div className="mt-8 max-w-2xl">
                <ClubSettingsForm settings={settings} />
            </div>
        </div>
    )
}
