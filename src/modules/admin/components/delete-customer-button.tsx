"use client"

import { useState } from "react"
import { TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { deleteCustomer } from "@/lib/data/admin"
import Modal from "@modules/common/components/modal"
import { Button } from "@modules/common/components/button"
import { useToast } from "@modules/common/context/toast-context"

export default function DeleteCustomerButton({ customerId, customerName }: { customerId: string, customerName: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const { showToast } = useToast()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteCustomer(customerId)

            if (result && !result.success) {
                console.error("Delete customer failed:", result.error)
                showToast(result.error || "Failed to delete customer", "error")
                setIsDeleting(false)
                return
            }

            // Success
            showToast("Customer deleted successfully", "success")
            setIsOpen(false)
            setIsDeleting(false)
        } catch (error) {
            console.error("Failed to delete customer:", error)
            setIsDeleting(false)
            showToast("An unexpected error occurred", "error")
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                title="Delete Customer"
            >
                <TrashIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>

            <Modal isOpen={isOpen} close={() => !isDeleting && setIsOpen(false)}>
                <Modal.Title>
                    <div className="flex items-center gap-x-2 text-red-600">
                        <ExclamationTriangleIcon className="h-6 w-6" />
                        <span>Delete Customer</span>
                    </div>
                </Modal.Title>
                <div>
                    <div className="space-y-4 py-2">
                        <div className="text-sm text-gray-500 leading-relaxed">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">{customerName}</span>?
                            This action will remove all associated data including:
                            <ul className="list-disc list-inside mt-2 space-y-1 ml-1 text-gray-600">
                                <li>Order history</li>
                                <li>Saved addresses</li>
                                <li>Reward points</li>
                            </ul>
                        </div>

                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-x-3">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-red-700">
                                <span className="font-semibold block mb-1">Warning: Permanent Action</span>
                                This operation cannot be undone. The customer will need to register again to access the store.
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-x-3 w-full justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setIsOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                            disabled={isDeleting}
                        >
                            Delete Customer
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
