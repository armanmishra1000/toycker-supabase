"use client"

import { useEffect } from "react"

import { addRecentlyViewedId } from "@modules/wishlist/util/recently-viewed"

type RecentlyViewedTrackerProps = {
  productId: string
}

const RecentlyViewedTracker = ({ productId }: RecentlyViewedTrackerProps) => {
  useEffect(() => {
    addRecentlyViewedId(productId)
  }, [productId])

  return null
}

export default RecentlyViewedTracker
