import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listOrders } from "@lib/data/orders"
import { retrieveCustomer } from "@lib/data/customer"
import OrderOverview from "@modules/account/components/order-overview"

export const metadata: Metadata = {
    title: "Orders",
    description: "View your order history",
}

export default async function Orders() {
    const customer = await retrieveCustomer()
    const orders = await listOrders()

    if (!customer) {
        notFound()
    }

    return (
        <div className="w-full" data-testid="orders-page-wrapper">
            <div className="mb-8 flex flex-col gap-y-4">
                <h1 className="text-2xl-semi">Orders</h1>
                <p className="text-base-regular">
                    View your order history and check the status of your orders.
                </p>
            </div>
            <OrderOverview orders={orders} />
        </div>
    )
}
