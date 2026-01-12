"use client"

import { RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Text } from "@modules/common/components/text"
import { useShippingPrice } from "@modules/common/context/shipping-price-context"
import { useEffect, useState, useMemo, useCallback } from "react"
import { Address, Cart, ShippingOption } from "@/lib/supabase/types"

import ShippingMethodOption from "./shipping-method-option"
import { cn } from "@lib/util/cn"
import RadioComponent from "@modules/common/components/radio"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: Cart
  availableShippingMethods: ShippingOption[] | null
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
  if (!address) return ""
  const parts = [
    address.address_1,
    address.address_2,
    `${address.postal_code} ${address.city}`,
    address.country_code?.toUpperCase(),
  ]
  return parts.filter(Boolean).join(", ")
}

const Shipping = ({ cart, availableShippingMethods }: ShippingProps) => {
  const shippingOptions =
    availableShippingMethods as ShippingOptionWithZone[] | null
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const { setSelectedShippingPrice } = useShippingPrice()

  const currencyCode = cart.currency_code || cart.region?.currency_code || "INR"

  const { shippingMethods, pickupMethods } = useMemo(() => {
    return {
      shippingMethods: shippingOptions?.filter(
        (sm) => sm.service_zone?.fulfillment_set?.type !== "pickup"
      ),
      pickupMethods: shippingOptions?.filter(
        (sm) => sm.service_zone?.fulfillment_set?.type === "pickup"
      ),
    }
  }, [shippingOptions])

  const hasPickupOptions = !!pickupMethods?.length

  // Effect for calculating prices
  useEffect(() => {
    setIsLoadingPrices(true)

    if (shippingMethods?.length) {
      const promises = shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r): r is PromiseFulfilledResult<{ id: string; price: number }> => r.status === "fulfilled" && r.value?.price != null)
            .forEach((p) => {
              if (p.value.id && typeof p.value.price === "number") {
                pricesMap[p.value.id] = p.value.price
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

    if (pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [shippingMethods, pickupMethods, shippingMethodId, cart.id])

  const handleSetShippingMethod = useCallback(async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)
    setShowPickupOptions(
      variant === "pickup" ? PICKUP_OPTION_ON : PICKUP_OPTION_OFF
    )

    const prevId = shippingMethodId
    setIsLoading(true)
    setShippingMethodId(id)

    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: id })

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
    } catch (err: unknown) {
      setShippingMethodId(prevId)
      const message = err instanceof Error ? err.message : "Failed to set shipping method"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [cart.id, shippingMethodId, shippingOptions, calculatedPricesMap, setSelectedShippingPrice])

  // Auto-select first shipping method if none selected
  useEffect(() => {
    if (!shippingMethodId && shippingMethods?.length && !isLoadingPrices) {
      const firstMethod = shippingMethods[0]
      if (firstMethod) {
        handleSetShippingMethod(firstMethod.id, "shipping")
      }
    }
  }, [shippingMethods, shippingMethodId, isLoadingPrices, handleSetShippingMethod])



  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Text
          as="h2"
          weight="bold"
          className="flex flex-row text-3xl gap-x-2 items-baseline"
        >
          Delivery Method
        </Text>
      </div>

      <div data-testid="delivery-options-container">
        <div className="grid gap-6">
          <div>
            <div className="flex flex-col mb-4">
              <span className="text-gray-500 text-sm">
                How would you like your order delivered?
              </span>
            </div>

            {hasPickupOptions && (
              <RadioGroup
                value={showPickupOptions}
                onChange={() => {
                  const id = pickupMethods?.find(
                    (option) => !option.insufficient_inventory
                  )?.id
                  if (id) handleSetShippingMethod(id, "pickup")
                }}
                className="mb-4"
              >
                <RadioGroup.Option
                  value={PICKUP_OPTION_ON}
                  className={cn(
                    "flex items-center justify-between text-sm cursor-pointer py-4 border rounded-lg px-8 hover:shadow-sm transition-all",
                    {
                      "border-blue-600 ring-1 ring-blue-600":
                        showPickupOptions === PICKUP_OPTION_ON,
                    }
                  )}
                >
                  <div className="flex items-center gap-x-4">
                    <RadioComponent
                      checked={showPickupOptions === PICKUP_OPTION_ON}
                    />
                    <span className="text-base font-medium">Pick up your order</span>
                  </div>
                  <span className="justify-self-end text-gray-900 font-medium">
                    -
                  </span>
                </RadioGroup.Option>
              </RadioGroup>
            )}

            <RadioGroup
              value={shippingMethodId}
              onChange={(v) => v && handleSetShippingMethod(v, "shipping")}
            >
              {shippingMethods?.map((option) => {
                const isCalculated = option.price_type === "calculated"
                const price = isCalculated
                  ? calculatedPricesMap[option.id]
                  : option.amount
                const isDisabled =
                  isCalculated && !isLoadingPrices && price === undefined

                return (
                  <ShippingMethodOption
                    key={option.id}
                    option={option}
                    selectedId={shippingMethodId}
                    currencyCode={currencyCode}
                    price={price}
                    isLoadingPrice={isLoadingPrices && isCalculated}
                    disabled={isDisabled || isLoading}
                  />
                )
              })}
            </RadioGroup>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div>
              <div className="flex flex-col mb-4">
                <span className="font-medium text-sm text-gray-900">
                  Store
                </span>
                <span className="text-gray-500 text-sm">
                  Choose a store near you
                </span>
              </div>
              <RadioGroup
                value={shippingMethodId}
                onChange={(v) => v && handleSetShippingMethod(v, "pickup")}
              >
                {pickupMethods?.map((option) => (
                  <ShippingMethodOption
                    key={option.id}
                    option={option}
                    selectedId={shippingMethodId}
                    currencyCode={currencyCode}
                    price={option.amount}
                    addressDisplay={formatAddress(
                      option.service_zone?.fulfillment_set?.location?.address
                    )}
                    disabled={option.insufficient_inventory || isLoading}
                    isPickup
                  />
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        <ErrorMessage
          error={error}
          data-testid="delivery-option-error-message"
        />
      </div>
    </div>
  )
}

export default Shipping