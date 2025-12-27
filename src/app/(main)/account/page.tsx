import { Metadata } from "next"
import Overview from "@modules/account/components/overview"
import { listOrders } from "@lib/data/orders"
import { retrieveCustomer } from "@lib/data/customer"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account.",
}

export default async function AccountPage() {
  const customer = await retrieveCustomer()
  const orders = await listOrders()

  if (!customer) {
    notFound()
  }

  return <Overview customer={customer} orders={orders} />
}