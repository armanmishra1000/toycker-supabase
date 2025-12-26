import { Dialog, Transition } from "@headlessui/react"
import { clx } from "@medusajs/ui"
import React, { Fragment } from "react"

import { ModalProvider, useModal } from "@lib/context/modal-context"
import X from "@modules/common/icons/x"

type ModalProps = {
  isOpen: boolean
  close: () => void
  size?: "small" | "medium" | "large" | "xlarge"
  search?: boolean
  fullScreen?: boolean
  panelPadding?: "none" | "default"
  rounded?: boolean
  roundedSize?: "none" | "sm" | "md" | "lg" | "xl"
  overflowHidden?: boolean
  panelClassName?: string
  children: React.ReactNode
  'data-testid'?: string
}

const Modal = ({
  isOpen,
  close,
  size = "medium",
  search = false,
  fullScreen = false,
  panelPadding = "default",
  rounded = true,
  roundedSize,
  overflowHidden = false,
  panelClassName,
  children,
  'data-testid': dataTestId
}: ModalProps) => {
  const resolvedRounded: "none" | "sm" | "md" | "lg" | "xl" = (() => {
    if (roundedSize) return roundedSize
    return rounded ? "lg" : "none"
  })()

  const roundedClassMap: Record<typeof resolvedRounded, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  }
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 h-screen w-screen bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 w-screen overflow-y-hidden">
          <div
            className={clx(
              "flex min-h-full h-full justify-center p-0 text-center",
              {
                "items-center": !search || fullScreen,
                "items-start": search && !fullScreen,
                "p-0": fullScreen,
              }
            )}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                data-testid={dataTestId}
                className={clx(
                  "flex flex-col justify-start w-full transform text-left align-middle transition-all h-fit",
                  {
                    "p-0": panelPadding === "none",
                    "p-5": panelPadding !== "none",
                    "max-w-md": size === "small" && !fullScreen,
                    "max-w-xl": size === "medium" && !fullScreen,
                    "max-w-3xl": size === "large" && !fullScreen,
                    "max-w-5xl": size === "xlarge" && !fullScreen,
                    "max-h-[75vh]": size !== "xlarge" && !fullScreen,
                    "max-h-[90vh]": size === "xlarge" && !fullScreen,
                    "w-full h-full max-w-none max-h-none p-0": fullScreen,
                    "bg-transparent shadow-none": search,
                    "bg-white shadow-xl border": !search && !fullScreen,
                    [roundedClassMap[resolvedRounded]]: !search && !fullScreen,
                    "bg-white": fullScreen,
                    "shadow-none border-0 rounded-none": fullScreen,
                    "overflow-hidden": overflowHidden,
                  },
                  panelClassName
                )}
              >
                <ModalProvider close={close}>{children}</ModalProvider>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { close } = useModal()

  return (
    <Dialog.Title className="flex items-center justify-between">
      <div className="text-large-semi">{children}</div>
      <div>
        <button onClick={close} data-testid="close-modal-button">
          <X size={20} />
        </button>
      </div>
    </Dialog.Title>
  )
}

const Description: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Dialog.Description className="flex text-small-regular text-ui-fg-base items-center justify-center pt-2 pb-4 h-full">
      {children}
    </Dialog.Description>
  )
}

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-center">{children}</div>
}

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex items-center justify-end gap-x-4">{children}</div>
}

Modal.Title = Title
Modal.Description = Description
Modal.Body = Body
Modal.Footer = Footer

export default Modal
