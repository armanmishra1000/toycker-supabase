import { retrieveOrder } from "@lib/data/orders"
import { notFound } from "next/navigation"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"

type Props = {
    params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: Props) {
    const { id } = await params
    const order = await retrieveOrder(id)

    if (!order) {
        notFound()
    }

    return <OrderCompletedTemplate order={order} />
}
