
"use client"

import { useState } from "react"
import { TrashIcon } from "@heroicons/react/24/outline"
import { deleteCustomer } from "@/lib/data/admin"
import Modal from "@modules/common/components/modal"
import { Button } from "@modules/common/components/button"
import Spinner from "@modules/common/icons/spinner"

export default function DeleteCustomerButton({ customerId, customerName }: { customerId: string, customerName: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteCustomer(customerId)
            // Redirect happens in server action
        } catch (error) {
            console.error("Failed to delete customer:", error)
            setIsDeleting(false)
            alert("Failed to delete user. Please check if you have the SUPABASE_SERVICE_ROLE_KEY set.")
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Customer"
            >
                <TrashIcon className="w-5 h-5" />
            </button>

            <Modal isOpen={isOpen} close={() => !isDeleting && setIsOpen(false)}>
                <Modal.Title>Delete Customer</Modal.Title>
                <Modal.Body>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Are you sure you want to delete <span className="font-bold text-gray-900">{customerName}</span>?
                            This action cannot be undone and will remove all associated data (orders, addresses, rewards, etc.).
                        </p>

                        <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                            <p className="text-xs text-rose-800 font-medium">Warning: This is a permanent action.</p>
                        </div>
                    </div>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setIsOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                        >
                            {isDeleting ? <Spinner className="w-4 h-4 text-white" /> : "Delete"}
                        </button>
                    </Modal.Footer>
                </Modal.Body>
            </Modal>
        </>
    )
}
