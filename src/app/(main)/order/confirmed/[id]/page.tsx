import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id)

  if (!order) {
    return notFound()
  }

  return {
    title: `Order Confirmed #${order.display_id} | Toycker`,
    description: "Your purchase was successful",
  }
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id)

  if (!order) {
    return notFound()
  }

  return <OrderCompletedTemplate order={order} />
}