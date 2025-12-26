"use client"

import { Spinner, Trash } from "@medusajs/icons"
import { Button, clx } from "@medusajs/ui"
import { ReactNode, useState } from "react"
import { useCartSidebar } from "@modules/layout/context/cart-sidebar-context"

const DeleteButton = ({
  id,
  children,
  className,
}: {
  id: string
  children?: ReactNode
  className?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const { removeLineItem, isRemoving } = useCartSidebar()

  const handleDelete = async (lineItemId: string) => {
    if (isRemoving(lineItemId)) return
    setIsDeleting(true)
    try {
      await removeLineItem(lineItemId)
    } finally {
      setIsDeleting(false)
      setIsConfirming(false)
    }
  }

  const removing = isDeleting || isRemoving(id)
  const label = children ?? "Remove"

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      {!isConfirming ? (
        <button
          className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
          onClick={() => setIsConfirming(true)}
          disabled={removing}
        >
          {removing ? <Spinner className="animate-spin" /> : <Trash />}
          <span>{removing ? "Removing product…" : label}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <Button
            size="small"
            variant="secondary"
            onClick={() => setIsConfirming(false)}
            disabled={removing}
          >
            No
          </Button>
          <Button
            size="small"
            variant="primary"
            onClick={() => handleDelete(id)}
            disabled={removing}
          >
            Yes
          </Button>
          {removing && <Spinner className="h-4 w-4 animate-spin" />}
        </div>
      )}
    </div>
  )
}

export default DeleteButton
