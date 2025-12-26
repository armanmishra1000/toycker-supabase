"use client"

import { HttpTypes } from "@medusajs/types"
import CartDropdown from "../cart-dropdown"

export default function CartButton({ 
  cart 
}: { 
  cart?: HttpTypes.StoreCart | null 
}) {
  return <CartDropdown cart={cart} />
}
