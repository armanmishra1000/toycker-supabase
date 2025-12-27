"use client"

import { Cart } from "@/lib/supabase/types"
import CartDropdown from "../cart-dropdown"

export default function CartButton({ 
  cart 
}: { 
  cart?: Cart | null 
}) {
  return <CartDropdown cart={cart} />
}