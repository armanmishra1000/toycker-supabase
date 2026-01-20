import { Dialog, Transition } from "@headlessui/react"
import { cn } from "@lib/util/cn"
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
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
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
  closeOnOutsideClick = true,
  closeOnEscape = true,
  'data-testid': dataTestId
}: ModalProps) => {
  const handleClose = () => {
    if (closeOnOutsideClick) {
      close()
    }
  }
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
      <Dialog as="div" className="relative z-[75]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 h-screen w-screen bg-black/20 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 w-screen overflow-y-hidden">
          <div
            className={cn(
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
                className={cn(
                  "flex flex-col justify-start w-full transform text-left align-middle transition-all h-fit",
                  {
                    "p-0": panelPadding === "none",
                    "p-5": panelPadding !== "none" && size !== "large" && size !== "xlarge",
                    "p-8": panelPadding !== "none" && (size === "large" || size === "xlarge"),
                    "max-w-md": size === "small" && !fullScreen,
                    "max-w-xl": size === "medium" && !fullScreen,
                    "max-w-3xl": size === "large" && !fullScreen,
                    "max-w-5xl": size === "xlarge" && !fullScreen,
                    "max-h-[75vh]": size !== "xlarge" && !fullScreen,
                    "max-h-[90vh]": size === "xlarge" && !fullScreen,
                    "w-full h-full max-w-none max-h-none p-0": fullScreen,
                    "bg-transparent shadow-none": search,
                    "bg-white shadow-2xl shadow-gray-200/50 border border-gray-100": !search && !fullScreen,
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
    <Dialog.Title className="flex items-center justify-between pb-2">
      <div className="text-xl font-semibold text-gray-900">{children}</div>
      <button
        onClick={close}
        data-testid="close-modal-button"
        className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <X size={20} />
      </button>
    </Dialog.Title>
  )
}

const Description: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Dialog.Description className="flex text-sm text-gray-500 items-center justify-center pt-2 pb-4 h-full">
      {children}
    </Dialog.Description>
  )
}

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-center">{children}</div>
}

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex items-center justify-end gap-3 pt-4">{children}</div>
}

Modal.Title = Title
Modal.Description = Description
Modal.Body = Body
Modal.Footer = Footer

export default Modal
