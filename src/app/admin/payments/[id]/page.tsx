import { getAdminPaymentMethod } from "@/lib/data/admin"
import AdminPageHeader from "@modules/admin/components/admin-page-header"
import PaymentProviderForm from "@modules/admin/components/payment-provider-form"
import { notFound } from "next/navigation"

export default async function EditPaymentMethod({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const method = await getAdminPaymentMethod(id)

    if (!method) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={`Edit ${method.name}`}
                subtitle="Configure payment provider details and discounts."
                backHref="/admin/payments"
            />

            <div className="max-w-4xl">
                <PaymentProviderForm method={method} />
            </div>
        </div>
    )
}
