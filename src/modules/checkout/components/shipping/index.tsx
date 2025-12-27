"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@modules/common/components/button"
import { Text } from "@modules/common/components/text"
import { cn } from "@lib/util/cn"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { useShippingPrice } from "@modules/common/context/shipping-price-context"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Address, ShippingOption } from "@/lib/supabase/types"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: any
  availableShippingMethods: any[] | null
}

type ShippingOptionWithZone = ShippingOption & {
  service_zone?: {
    fulfillment_set?: {
      type?: string
      location?: { address?: Address }
    }
  }
}

function formatAddress(address?: Address) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const shippingOptions = availableShippingMethods as ShippingOptionWithZone[] | null
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const currencyCode = cart.currency_code || cart.region?.currency_code || "INR"
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentStep = searchParams.get("step")
  const isOpen = currentStep === "delivery"
  const { setSelectedShippingPrice } = useShippingPrice()

  // Scroll to top when delivery step opens
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [isOpen])

  const _shippingMethods = shippingOptions?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = shippingOptions?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled" && r.value?.amount != null)
            .forEach((p) => {
              if (p.value?.id && typeof p.value.amount === "number") {
                pricesMap[p.value.id] = p.value.amount
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery")
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment")
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .then(() => {
        // Set the shipping price in context after successfully setting the method
        const selectedOption = shippingOptions?.find((opt) => opt.id === id)
        if (selectedOption) {
          if (selectedOption.price_type === "flat" && selectedOption.amount) {
            setSelectedShippingPrice(selectedOption.amount)
          } else if (selectedOption.price_type === "calculated") {
            const calculatedPrice = calculatedPricesMap[id]
            if (calculatedPrice != null) {
              setSelectedShippingPrice(calculatedPrice)
            }
          }
        }
      })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Text
          as="h2"
          weight="bold"
          className={cn(
            "flex flex-row text-3xl gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircle className="h-6 w-6 text-green-500" />
          )}
        </Text>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-blue-600 hover:text-blue-700 font-medium"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium text-sm text-gray-900">
                Shipping method
              </span>
              <span className="mb-4 text-gray-500 text-sm">
                How would you like you order delivered
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={(value: string) => {
                      const id = _pickupMethods?.find(
                        (option) => !(option as any).insufficient_inventory
                      )?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className={cn(
                        "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-8 mb-2 hover:shadow-sm",
                        {
                          "border-blue-600":
                            showPickupOptions === PICKUP_OPTION_ON,
                        }
                      )}
                    >
                      <div className="flex items-center gap-x-4">
                        <MedusaRadio
                          checked={showPickupOptions === PICKUP_OPTION_ON}
                        />
                        <span className="text-base">
                          Pick up your order
                        </span>
                      </div>
                      <span className="justify-self-end text-gray-900">
                        -
                      </span>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v: string) => {
                    if (v) {
                      return handleSetShippingMethod(v, "shipping")
                    }
                  }}
                >
                  {_shippingMethods?.map((option) => {
                    const isDisabled =
                      option.price_type === "calculated" &&
                      !isLoadingPrices &&
                      typeof calculatedPricesMap[option.id] !== "number"

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        className={cn(
                          "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-8 mb-2 hover:shadow-sm",
                          {
                            "border-blue-600":
                              option.id === shippingMethodId,
                            "cursor-not-allowed opacity-50":
                              isDisabled,
                          }
                        )}
                      >
                        <div className="flex items-center gap-x-4">
                          <MedusaRadio
                            checked={option.id === shippingMethodId}
                          />
                          <span className="text-base">
                            {option.name}
                          </span>
                        </div>
                        <span className="justify-self-end text-gray-900">
                          {option.price_type === "flat" ? (
                            convertToLocale({
                              amount: option.amount ?? 0,
                              currency_code: currencyCode,
                            })
                          ) : calculatedPricesMap[option.id] != null ? (
                            convertToLocale({
                              amount: calculatedPricesMap[option.id],
                              currency_code: currencyCode,
                            })
                          ) : isLoadingPrices ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "-"
                          )}
                        </span>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col">
                <span className="font-medium text-sm text-gray-900">
                  Store
                </span>
                <span className="mb-4 text-gray-500 text-sm">
                  Choose a store near you
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v: string) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={(option as any).insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={cn(
                            "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-8 mb-2 hover:shadow-sm",
                            {
                              "border-blue-600":
                                option.id === shippingMethodId,
                              "cursor-not-allowed opacity-50":
                                (option as any).insufficient_inventory,
                            }
                          )}
                        >
                          <div className="flex items-start gap-x-4">
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />
                            <div className="flex flex-col">
                              <span className="text-base">
                                {option.name}
                              </span>
                              <span className="text-base text-gray-500">
                                {formatAddress(
                                  option.service_zone?.fulfillment_set?.location
                                    ?.address
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="justify-self-end text-gray-900">
                            {convertToLocale({
                              amount: option.amount ?? 0,
                              currency_code: currencyCode,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="mt"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-sm">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 ? (
              <div className="flex flex-col w-1/3">
                <Text weight="bold" className="text-sm text-gray-900 mb-1">
                  Method
                </Text>
                <Text className="text-sm text-gray-500">
                  {(() => {
                    const shippingMethod = cart.shipping_methods!.at(-1)!

                    // First priority: Try to use the shipping method's total field (includes tax)
                    if ((shippingMethod.total ?? 0) > 0) {
                      return (
                        <>
                          {shippingMethod.name}{" "}
                          {convertToLocale({
                            amount: shippingMethod.total ?? 0,
                            currency_code: currencyCode,
                          })}
                        </>
                      )
                    }

                    // Second priority: Try to use the shipping method's subtotal field (excludes tax)
                    if ((shippingMethod.subtotal ?? 0) > 0) {
                      return (
                        <>
                          {shippingMethod.name}{" "}
                          {convertToLocale({
                            amount: shippingMethod.subtotal ?? 0,
                            currency_code: currencyCode,
                          })}
                        </>
                      )
                    }

                    // Third priority: If cart data is 0, try to get price from available shipping options
                    if (shippingOptions?.length) {
                      const matchedOption = shippingOptions.find(
                        (opt) => opt.id === shippingMethod.shipping_option_id
                      )
                      if (matchedOption && matchedOption.price_type === "flat" && matchedOption.amount) {
                        return (
                          <>
                            {shippingMethod.name}{" "}
                            {convertToLocale({
                              amount: matchedOption.amount,
                              currency_code: currencyCode,
                            })}
                          </>
                        )
                      }
                      // For calculated prices, check the calculatedPricesMap
                      if (matchedOption && matchedOption.price_type === "calculated") {
                        const calculatedAmount = calculatedPricesMap[matchedOption.id]
                        if (calculatedAmount != null) {
                          return (
                            <>
                              {shippingMethod.name}{" "}
                              {convertToLocale({
                                amount: calculatedAmount,
                                currency_code: currencyCode,
                              })}
                            </>
                          )
                        }
                      }
                    }

                    // Default: show 0
                    return (
                      <>
                        {shippingMethod.name}{" "}
                        {convertToLocale({
                          amount: 0,
                          currency_code: currencyCode,
                        })}
                      </>
                    )
                  })()}
                </Text>
              </div>
            ) : cart?.shipping_address ? (
              <div className="flex flex-col gap-y-4">
                <div className="w-48 h-10 bg-gray-200 animate-pulse rounded" />
                <div className="w-64 h-6 bg-gray-200 animate-pulse rounded" />
              </div>
            ) : null}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping