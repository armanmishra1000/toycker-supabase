import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper" className="space-y-6">
      <div className="space-y-1">
        <div className="text-xl-semi" data-testid="welcome-message" data-value={customer?.first_name}>
          Hello {customer?.first_name}
        </div>
        <p className="text-small-regular text-ui-fg-subtle">
          Signed in as: {" "}
          <span className="font-semibold" data-testid="customer-email" data-value={customer?.email}>
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
          <h3 className="text-large-semi">Recent orders</h3>
          <LocalizedClientLink
            href="/account/orders"
            className="text-small-regular text-ui-fg-subtle underline"
          >
            View all
          </LocalizedClientLink>
        </div>
        <ul className="flex flex-col gap-y-3" data-testid="orders-wrapper">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => {
              return (
                <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                  <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
                    <Container className="bg-ui-bg-subtle hover:bg-ui-bg-base border border-ui-border transition-colors flex justify-between items-center p-4 rounded-lg">
                      <div className="grid grid-cols-3 grid-rows-2 text-small-regular gap-x-4 flex-1">
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
                      <ChevronDown className="-rotate-90" />
                    </Container>
                  </LocalizedClientLink>
                </li>
              )
            })
          ) : (
            <Container className="text-small-regular text-ui-fg-subtle" data-testid="no-orders-message">
              No recent orders.
            </Container>
          )}
        </ul>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
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
    <Container
      className="border border-ui-border bg-ui-bg-base rounded-lg p-4 flex flex-col gap-y-2"
      data-testid={dataTestId}
    >
      <span className="text-small-regular text-ui-fg-subtle uppercase tracking-wide">
        {title}
      </span>
      <span className="text-3xl-semi leading-none">{value}</span>
      <span className="text-small-regular text-ui-fg-subtle">{helper}</span>
    </Container>
  )
}

export default Overview
