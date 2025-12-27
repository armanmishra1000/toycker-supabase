import { ChevronRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

type OverviewProps = {
  customer: any
  orders: any[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper" className="space-y-6">
      <div className="space-y-1">
        <div className="text-xl-semi" data-testid="welcome-message" data-value={customer?.first_name}>
          Hello {customer?.first_name}
        </div>
        <p className="text-sm text-gray-500">
          Signed in as: {" "}
          <span className="font-semibold text-gray-900" data-testid="customer-email" data-value={customer?.email}>
            {customer?.email}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 small:grid-cols-3 gap-4">
        <StatCard
          title="Profile"
          value={`${getProfileCompletion(customer)}%`}
          helper="Completed"
          dataTestId="customer-profile-completion"
        />
        <StatCard
          title="Addresses"
          value={`${customer?.addresses?.length || 0}`}
          helper="Saved"
          dataTestId="addresses-count"
        />
        <StatCard
          title="Orders"
          value={`${orders?.length || 0}`}
          helper="Total"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent orders</h3>
          <LocalizedClientLink
            href="/account/orders"
            className="text-sm text-gray-500 underline"
          >
            View all
          </LocalizedClientLink>
        </div>
        <ul className="flex flex-col gap-y-3" data-testid="orders-wrapper">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order: any) => {
              return (
                <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                  <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
                    <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex justify-between items-center p-4 rounded-lg">
                      <div className="grid grid-cols-3 grid-rows-2 text-sm gap-x-4 flex-1">
                        <span className="font-semibold">Date placed</span>
                        <span className="font-semibold">Order number</span>
                        <span className="font-semibold">Total amount</span>
                        <span data-testid="order-created-date">
                          {new Date(order.created_at).toDateString()}
                        </span>
                        <span data-testid="order-id" data-value={order.display_id}>
                          #{order.display_id}
                        </span>
                        <span data-testid="order-amount">
                          {convertToLocale({
                            amount: order.total,
                            currency_code: order.currency_code,
                          })}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </LocalizedClientLink>
                </li>
              )
            })
          ) : (
            <div className="text-sm text-gray-500 border border-gray-200 p-4 rounded-lg" data-testid="no-orders-message">
              No recent orders.
            </div>
          )}
        </ul>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: any) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

const StatCard = ({
  title,
  value,
  helper,
  dataTestId,
}: {
  title: string
  value: string
  helper: string
  dataTestId?: string
}) => {
  return (
    <div
      className="border border-gray-200 bg-white rounded-lg p-4 flex flex-col gap-y-2"
      data-testid={dataTestId}
    >
      <span className="text-xs text-gray-500 uppercase tracking-wide">
        {title}
      </span>
      <span className="text-3xl font-bold leading-none">{value}</span>
      <span className="text-xs text-gray-500">{helper}</span>
    </div>
  )
}

export default Overview
