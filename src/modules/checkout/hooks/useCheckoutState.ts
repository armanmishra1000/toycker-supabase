"use client"

import { useReducer, useCallback, useMemo } from "react"

// Types for addresses matching your Supabase schema
export interface Address {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string | null
  city: string
  province?: string | null
  postal_code: string
  country_code: string
  phone?: string | null
}

// Checkout state interface
export interface CheckoutState {
  email: string | null
  shippingAddress: Address | null
  billingAddress: Address | null
  paymentMethod: string | null
  sameAsBilling: boolean
  saveAddress: boolean
  rewardsToApply: number
  isValid: boolean
}

// Action types using discriminated unions
export type CheckoutAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_SHIPPING_ADDRESS"; payload: Address }
  | { type: "SET_BILLING_ADDRESS"; payload: Address }
  | { type: "SET_PAYMENT_METHOD"; payload: string }
  | { type: "TOGGLE_SAME_AS_BILLING" }
  | { type: "SET_SAVE_ADDRESS"; payload: boolean }
  | { type: "SET_REWARDS_TO_APPLY"; payload: number }
  | { type: "RESET" }

// Initial state
const initialState: CheckoutState = {
  email: null,
  shippingAddress: null,
  billingAddress: null,
  paymentMethod: null,
  sameAsBilling: true,
  saveAddress: true,
  rewardsToApply: 0,
  isValid: false,
}

// Validation helper
function validateAddress(address: Address | null): boolean {
  if (!address) return false
  return !!(
    address.first_name &&
    address.last_name &&
    address.address_1 &&
    address.city &&
    address.postal_code &&
    address.country_code
  )
}

// Reducer function
function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction
): CheckoutState {
  switch (action.type) {
    case "SET_EMAIL": {
      const newState = {
        ...state,
        email: action.payload,
      }
      newState.isValid =
        !!newState.email &&
        validateAddress(newState.shippingAddress) &&
        validateAddress(newState.billingAddress) &&
        !!newState.paymentMethod
      return newState
    }

    case "SET_SHIPPING_ADDRESS": {
      const newState = {
        ...state,
        shippingAddress: action.payload,
        // If same as billing, also update billing
        billingAddress: state.sameAsBilling
          ? action.payload
          : state.billingAddress,
      }
      // Recalculate validity
      newState.isValid =
        !!newState.email &&
        validateAddress(newState.shippingAddress) &&
        validateAddress(newState.billingAddress) &&
        !!newState.paymentMethod
      return newState
    }

    case "SET_BILLING_ADDRESS": {
      const newState = {
        ...state,
        billingAddress: action.payload,
      }
      newState.isValid =
        !!newState.email &&
        validateAddress(newState.shippingAddress) &&
        validateAddress(newState.billingAddress) &&
        !!newState.paymentMethod
      return newState
    }

    case "SET_PAYMENT_METHOD": {
      const newState = {
        ...state,
        paymentMethod: action.payload,
      }
      newState.isValid =
        !!newState.email &&
        validateAddress(newState.shippingAddress) &&
        (state.sameAsBilling
          ? validateAddress(newState.shippingAddress)
          : validateAddress(newState.billingAddress)) &&
        !!newState.paymentMethod
      return newState
    }

    case "TOGGLE_SAME_AS_BILLING": {
      const newSameAsBilling = !state.sameAsBilling
      const newState = {
        ...state,
        sameAsBilling: newSameAsBilling,
        // If toggling to same, copy shipping to billing
        billingAddress: newSameAsBilling
          ? state.shippingAddress
          : state.billingAddress,
      }
      newState.isValid =
        !!newState.email &&
        validateAddress(newState.shippingAddress) &&
        (newSameAsBilling
          ? validateAddress(newState.shippingAddress)
          : validateAddress(newState.billingAddress)) &&
        !!newState.paymentMethod
      return newState
    }

    case "SET_SAVE_ADDRESS": {
      return {
        ...state,
        saveAddress: action.payload,
      }
    }

    case "SET_REWARDS_TO_APPLY": {
      return {
        ...state,
        rewardsToApply: action.payload,
      }
    }

    case "RESET":
      return initialState

    default:
      return state
  }
}

// Custom hook
export function useCheckoutState(initialData?: Partial<CheckoutState>) {
  const [state, dispatch] = useReducer(
    checkoutReducer,
    initialData ? { ...initialState, ...initialData } : initialState
  )

  // Memoized helper functions
  const setEmail = useCallback((email: string) => {
    dispatch({ type: "SET_EMAIL", payload: email })
  }, [])

  const setShippingAddress = useCallback((address: Address) => {
    dispatch({ type: "SET_SHIPPING_ADDRESS", payload: address })
  }, [])

  const setBillingAddress = useCallback((address: Address) => {
    dispatch({ type: "SET_BILLING_ADDRESS", payload: address })
  }, [])

  const setPaymentMethod = useCallback((method: string) => {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method })
  }, [])

  const toggleSameAsBilling = useCallback(() => {
    dispatch({ type: "TOGGLE_SAME_AS_BILLING" })
  }, [])

  const setSaveAddress = useCallback((save: boolean) => {
    dispatch({ type: "SET_SAVE_ADDRESS", payload: save })
  }, [])

  const setRewardsToApply = useCallback((points: number) => {
    dispatch({ type: "SET_REWARDS_TO_APPLY", payload: points })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: "RESET" })
  }, [])

  // Memoized return object
  return useMemo(
    () => ({
      state,
      setEmail,
      setShippingAddress,
      setBillingAddress,
      setPaymentMethod,
      toggleSameAsBilling,
      setSaveAddress,
      setRewardsToApply,
      reset,
    }),
    [
      state,
      setEmail,
      setShippingAddress,
      setBillingAddress,
      setPaymentMethod,
      toggleSameAsBilling,
      setSaveAddress,
      setRewardsToApply,
      reset,
    ]
  )
}
