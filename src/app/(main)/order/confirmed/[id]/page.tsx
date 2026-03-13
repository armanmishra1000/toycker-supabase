import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveOrder } from "@lib/data/orders"
import { getCustomerOrderPageMetadata } from "@/lib/util/customer-order-state"
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

  return getCustomerOrderPageMetadata(order)
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id)

  if (!order) {
    return notFound()
  }

  return <OrderCompletedTemplate order={order} context="post_checkout" />
}
