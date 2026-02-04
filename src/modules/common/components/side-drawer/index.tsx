"use client"

import { Dialog, Transition } from "@headlessui/react"
import { cn } from "@lib/util/cn"
import React, { Fragment } from "react"
import { X } from "lucide-react"

type SideDrawerProps = {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: "small" | "medium" | "large"
}

const SideDrawer = ({
    isOpen,
    onClose,
    title,
    children,
    size = "medium",
}: SideDrawerProps) => {
    const sizeClasses = {
        small: "max-w-md",
        medium: "max-w-xl",
        large: "max-w-3xl",
    }

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[150]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex justify-end">
                    <Transition.Child
                        as={Fragment}
                        enter="transform transition ease-out duration-300"
                        enterFrom="translate-x-full"
                        enterTo="translate-x-0"
                        leave="transform transition ease-in duration-200"
                        leaveFrom="translate-x-0"
                        leaveTo="translate-x-full"
                    >
                        <Dialog.Panel
                            className={cn(
                                "relative flex h-full w-full flex-col bg-white shadow-2xl ring-1 ring-black/5",
                                sizeClasses[size]
                            )}
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                                <Dialog.Title className="text-xl font-bold text-slate-900">
                                    {title}
                                </Dialog.Title>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                {children}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

export default SideDrawer
