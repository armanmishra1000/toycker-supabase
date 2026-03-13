import { Order } from "@/lib/supabase/types"

const CANCELLED_ORDER_STATUSES = new Set<Order["status"]>([
  "cancelled",
  "failed",
])

const FAILED_PAYMENT_STATUSES = new Set(["failed", "cancelled"])
const SUCCESS_PAYMENT_STATUSES = new Set(["captured", "paid"])
const PENDING_PAYMENT_STATUSES = new Set(["pending", "awaiting", "unpaid"])

export type CustomerOrderPageState =
  | "confirmed"
  | "payment_pending"
  | "cancelled"

export type CustomerOrderPageTone = "success" | "warning" | "danger"

type CustomerOrderStateInput = Pick<
  Order,
  "status" | "payment_status" | "payment_method" | "metadata"
>

type CustomerOrderMetadataInput = CustomerOrderStateInput &
  Pick<Order, "display_id">

export interface CustomerOrderPageContent {
  state: CustomerOrderPageState
  tone: CustomerOrderPageTone
  title: string
  description: string
  showTracking: boolean
}

const getMetadataPaymentMethod = (
  metadata: Order["metadata"]
): string | null => {
  const value = metadata?.payment_method
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

export const isCashOnDeliveryLikeOrder = (
  order: Pick<Order, "payment_method" | "metadata">
): boolean => {
  const paymentMethod =
    order.payment_method || getMetadataPaymentMethod(order.metadata) || ""
  const normalizedMethod = paymentMethod.toLowerCase()

  return (
    normalizedMethod.includes("cod") ||
    normalizedMethod.includes("cash") ||
    normalizedMethod.includes("pp_system_default") ||
    normalizedMethod === "manual"
  )
}

const getEffectivePaymentStatus = (
  order: CustomerOrderStateInput
): string => {
  const rawPaymentStatus = (order.payment_status || "").toLowerCase()
  if (rawPaymentStatus) {
    return rawPaymentStatus
  }

  if (order.status === "pending") {
    return "pending"
  }

  if (CANCELLED_ORDER_STATUSES.has(order.status)) {
    return "cancelled"
  }

  return ""
}

export const getCustomerOrderPageContent = (
  order: CustomerOrderStateInput
): CustomerOrderPageContent => {
  const paymentStatus = getEffectivePaymentStatus(order)
  const isCashOnDelivery = isCashOnDeliveryLikeOrder(order)

  const isCancelled =
    CANCELLED_ORDER_STATUSES.has(order.status) ||
    FAILED_PAYMENT_STATUSES.has(paymentStatus)

  if (isCancelled) {
    return {
      state: "cancelled",
      tone: "danger",
      title: "Order Cancelled",
      description:
        "This order was not successful. If this was a mistake, you can try placing it again from your cart.",
      showTracking: false,
    }
  }

  if (SUCCESS_PAYMENT_STATUSES.has(paymentStatus)) {
    return {
      state: "confirmed",
      tone: "success",
      title: "Order Confirmed!",
      description:
        "Thank you for shopping with Toycker. We're getting your order ready for delivery.",
      showTracking: true,
    }
  }

  const isPaymentPending =
    !isCashOnDelivery && PENDING_PAYMENT_STATUSES.has(paymentStatus)

  if (isPaymentPending) {
    return {
      state: "payment_pending",
      tone: "warning",
      title: "Payment Pending",
      description:
        "Your order is waiting for payment confirmation. Complete the payment to confirm this order.",
      showTracking: false,
    }
  }

  return {
    state: "confirmed",
    tone: "success",
    title: "Order Confirmed!",
    description:
      "Thank you for shopping with Toycker. We're getting your order ready for delivery.",
    showTracking: true,
  }
}

export const getCustomerOrderPageMetadata = (
  order: CustomerOrderMetadataInput
): { title: string; description: string } => {
  const content = getCustomerOrderPageContent(order)

  if (content.state === "payment_pending") {
    return {
      title: `Payment Pending #${order.display_id} | Toycker`,
      description: "Your order is waiting for payment confirmation.",
    }
  }

  if (content.state === "cancelled") {
    return {
      title: `Order Cancelled #${order.display_id} | Toycker`,
      description: "This order was cancelled or the payment was not completed.",
    }
  }

  return {
    title: `Order Confirmed #${order.display_id} | Toycker`,
    description: "Your order has been confirmed.",
  }
}
