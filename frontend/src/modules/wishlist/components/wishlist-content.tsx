"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { HttpTypes } from "@medusajs/types"

import { useWishlist } from "@modules/products/context/wishlist"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  RECENTLY_VIEWED_KEY,
  getRecentlyViewedIds,
} from "@modules/wishlist/util/recently-viewed"

type WishlistContentProps = {
  countryCode: string
}

const WishlistContent = ({ countryCode }: WishlistContentProps) => {
  const { items, toggleWishlist } = useWishlist()
  const [recentIds, setRecentIds] = useState<string[]>([])

  const wishlistState = useProductsByIds(items, countryCode)
  const recentState = useProductsByIds(recentIds, countryCode)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    setRecentIds(getRecentlyViewedIds())

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === RECENTLY_VIEWED_KEY) {
        setRecentIds(getRecentlyViewedIds())
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const handleClear = useCallback(() => {
    items.forEach((id) => toggleWishlist(id))
  }, [items, toggleWishlist])

  const showRecentlyViewedSection = recentIds.length > 0 || recentState.isLoading

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        {items.length ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                You have <span className="font-semibold text-slate-900">{items.length}</span> saved
                {items.length === 1 ? " item" : " items"}.
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="text-sm font-semibold text-[#E7353A] transition hover:opacity-80"
              >
                Clear wishlist
              </button>
            </div>

            {wishlistState.error && (
              <p className="rounded-lg border border-ui-border-danger bg-ui-bg-base px-4 py-3 text-sm text-ui-fg-danger" role="alert">
                {wishlistState.error}
              </p>
            )}

            {wishlistState.isLoading ? (
              <ProductGridSkeleton />
            ) : wishlistState.products.length ? (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="wishlist-grid">
                {wishlistState.products.map((product) => (
                  <li key={product.id}>
                    <ProductPreview product={product} viewMode="grid-4" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-600">
                We couldn’t load your saved items. Please refresh the page.
              </p>
            )}
          </>
        ) : (
          <EmptyWishlistState countryCode={countryCode} />
        )}
      </section>

      {showRecentlyViewedSection && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Keep exploring</p>
              <h2 className="text-2xl font-semibold text-slate-900">Recently viewed</h2>
            </div>
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
            >
              View store
            </LocalizedClientLink>
          </div>
          {recentState.isLoading ? (
            <ProductGridSkeleton />
          ) : recentState.products.length ? (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="recently-viewed-grid">
              {recentState.products.map((product) => (
                <li key={product.id}>
                  <ProductPreview product={product} viewMode="grid-4" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-600">
              You haven’t viewed any products recently.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
    ))}
  </div>
)

const EmptyWishlistState = ({ countryCode }: { countryCode: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <h2 className="text-2xl font-semibold text-slate-900">Your wishlist is empty</h2>
    <p className="mt-2 text-sm text-slate-600">
      Tap the heart icon on any product to save it here for later.
    </p>
    <LocalizedClientLink
      href="/store"
      className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      Browse products
    </LocalizedClientLink>
  </div>
)

export default WishlistContent

const useProductsByIds = (ids: string[], countryCode: string) => {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  useEffect(() => {
    if (!ids.length) {
      controllerRef.current?.abort()
      controllerRef.current = null
      setProducts([])
      setIsLoading(false)
      setError(null)
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError(null)

    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/storefront/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            countryCode,
            limit: ids.length,
            productsIds: ids,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to load products")
        }

        const payload = (await response.json()) as {
          products: HttpTypes.StoreProduct[]
        }

        setProducts(payload.products)
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return
        }
        setError((fetchError as Error).message)
      } finally {
        if (controllerRef.current === controller) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts().catch((reason) => {
      if ((reason as Error).name !== "AbortError") {
        setError((reason as Error).message)
        setIsLoading(false)
      }
    })
  }, [countryCode, ids])

  const orderedProducts = useMemo(() => {
    if (!products.length) {
      return []
    }
    const orderMap = new Map(ids.map((id, index) => [id, index]))
    return products
      .filter((product) => orderMap.has(product.id))
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
  }, [ids, products])

  return { products: orderedProducts, isLoading, error }
}
