"use client"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, ShoppingBagIcon } from "@heroicons/react/24/outline"
import { Button } from "@modules/common/components/button"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import DeleteButton from "@modules/common/components/delete-button"
import { isGiftWrapLine } from "@modules/cart/utils/gift-wrap"
import Image from "next/image"
import { useBodyScrollLock } from "@modules/layout/hooks/useBodyScrollLock"
import { useCartSidebar } from "@modules/layout/context/cart-sidebar-context"
import { getImageUrl } from "@lib/util/get-image-url"
import QuantitySelector from "@modules/common/components/quantity-selector"
import { useCartStore } from "@modules/cart/context/cart-store-context"

type CartSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { cart } = useCartSidebar()
  const { optimisticUpdateQuantity, isUpdating, isRemoving } = useCartStore()
  useBodyScrollLock({ isLocked: isOpen })

  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const subtotal = cart?.subtotal ?? 0
  const hasItems = Boolean(cart && cart.items && cart.items.length)

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-end">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="relative flex h-full w-full max-w-[480px] flex-col bg-white/95 backdrop-blur-md shadow-[0_20px_45px_rgba(15,23,42,0.25)] ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div className="space-y-1">
                  <Dialog.Title className="text-2xl font-semibold text-slate-900">
                    Your bag
                  </Dialog.Title>
                  <p className="text-sm text-slate-500">
                    {totalItems} item{totalItems === 1 ? "" : "s"} ready to ship
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-900/20 hover:text-slate-900"
                  aria-label="Close cart sidebar"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {hasItems ? (
                  <div className="space-y-5">
                    {cart!.items!
                      .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
                      .map((item) => {
                        const giftWrapLine = isGiftWrapLine(item.metadata)

                        const renderThumbnail = () => {
                          if (giftWrapLine) {
                            return (
                              <div className="w-24 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                                <Image
                                  src="/assets/images/gift-wrap.png"
                                  alt="Gift wrap"
                                  width={64}
                                  height={64}
                                  className="h-12 w-12 object-contain"
                                />
                              </div>
                            )
                          }

                          const thumb = (
                            <Thumbnail
                              thumbnail={item.thumbnail}
                              images={item.variant?.product?.images?.map(img => ({ url: getImageUrl(img) || '' }))}
                              size="square"
                              className="rounded-xl"
                            />
                          )

                          if (!item.product_handle) {
                            return <div className="w-24 flex-shrink-0">{thumb}</div>
                          }

                          return (
                            <LocalizedClientLink
                              href={`/products/${item.product_handle}`}
                              className="w-24 flex-shrink-0"
                              onClick={onClose}
                            >
                              {thumb}
                            </LocalizedClientLink>
                          )
                        }

                        const renderTitle = () => {
                          const displayTitle = item.product_title || item.title
                          if (!item.product_handle || giftWrapLine) {
                            return (
                              <p className="text-base font-semibold text-slate-900 line-clamp-2">
                                {giftWrapLine ? "Gift Wrap" : displayTitle}
                              </p>
                            )
                          }

                          return (
                            <LocalizedClientLink
                              href={`/products/${item.product_handle}`}
                              className="text-base font-semibold text-slate-900 line-clamp-2"
                              onClick={onClose}
                            >
                              {displayTitle}
                            </LocalizedClientLink>
                          )
                        }

                        return (
                          <div
                            key={item.id}
                            className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                          >
                            {renderThumbnail()}

                            <div className="flex flex-1 flex-col justify-between">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  {renderTitle()}
                                  {!giftWrapLine && <LineItemOptions variant={item.variant} />}
                                </div>
                                <LineItemPrice item={item} style="tight" currencyCode={cart!.currency_code} />
                              </div>

                              <div className="flex items-end justify-between pt-3">
                                <div className="flex flex-col gap-2">
                                  {!giftWrapLine && (
                                    <QuantitySelector
                                      quantity={item.quantity}
                                      onChange={(newQty) => optimisticUpdateQuantity(item.id, newQty)}
                                      loading={isUpdating(item.id)}
                                      disabled={isRemoving(item.id)}
                                      size="small"
                                      className="w-fit"
                                    />
                                  )}
                                </div>
                                <DeleteButton id={item.id} className="text-xs text-slate-400 hover:text-slate-900" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center text-slate-500">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <ShoppingBagIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Bag is empty</p>
                      <p className="text-sm text-slate-500">Save favorites and check back soon.</p>
                    </div>
                    <LocalizedClientLink
                      href="/store"
                      onClick={onClose}
                      className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      Continue shopping
                    </LocalizedClientLink>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 px-6 py-5 space-y-4">
                {(() => {
                  const currencyCode = cart?.currency_code || cart?.region?.currency_code || "INR"
                  return (
                    <>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span className="text-lg font-semibold text-slate-900" data-testid="cart-sidebar-subtotal">
                          {convertToLocale({
                            amount: subtotal,
                            currency_code: currencyCode,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Shipping</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Calculated at checkout</span>
                      </div>
                      <div className="grid gap-3 pt-1">
                        <LocalizedClientLink href="/checkout?step=address" onClick={onClose} passHref>
                          <Button className="w-full" size="large">
                            Proceed to checkout
                          </Button>
                        </LocalizedClientLink>
                        <LocalizedClientLink href="/cart" onClick={onClose} passHref>
                          <Button className="w-full" size="large" variant="secondary">
                            View full cart
                          </Button>
                        </LocalizedClientLink>
                      </div>
                      <p className="text-xs text-slate-500">
                        Secure checkout • Duties & import taxes included where applicable
                      </p>
                    </>
                  )
                })()}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default CartSidebar
