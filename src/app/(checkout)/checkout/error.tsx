"use client"

import { useEffect } from "react"
import { Button } from "@modules/common/components/button"
import { AlertCircle, RefreshCw, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface CheckoutErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CheckoutError({ error, reset }: CheckoutErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Checkout page error:", error)
  }, [error])

  return (
    <div className="content-container px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Something went wrong
        </h1>

        <p className="mb-6 text-slate-600">
          We couldn&apos;t load the checkout page. This might be due to a temporary
          issue with your cart or session.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Link href="/cart">
            <Button
              variant="secondary"
              className="inline-flex items-center justify-center gap-2 w-full"
            >
              <ShoppingCart className="h-4 w-4" />
              Back to Cart
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-slate-400">
            Error reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
