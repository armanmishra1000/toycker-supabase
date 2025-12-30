import React from "react"
import { CreditCard, Wallet, Package } from "lucide-react"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element; description?: string }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  pp_payu_payu: {
    title: "Online Payment",
    icon: <Wallet className="text-blue-600" />,
    description: "Pay securely using cards, UPI, net banking, or wallets.",
  },
  pp_system_default: {
    title: "Cash on Delivery",
    icon: <Package className="text-green-600" />,
    description: "Pay with cash when your order arrives.",
  },
}

// This only checks if it is native stripe
export const isStripeLike = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe_")
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}

export const isPayU = (providerId?: string) => {
  return providerId?.startsWith("pp_payu")
}

export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]