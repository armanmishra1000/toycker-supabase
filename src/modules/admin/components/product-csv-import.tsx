"use client"

import { useState, useRef } from "react"
import { ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline"
import { ImportStats } from "@/lib/types/import"
import { useToast } from "@modules/common/context/toast-context"

interface ImportResult extends Partial<ImportStats> {
    success: boolean
    message?: string
    error?: string
    details?: string
}

export default function ProductCsvImport() {
    const { showToast } = useToast()
    const [isImporting, setIsImporting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setShowConfirmModal(true)
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleConfirmImport = async () => {
        if (!selectedFile) return

        setShowConfirmModal(false)
        setIsImporting(true)

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const response = await fetch("/api/admin/products/import", {
                method: "POST",
                body: formData,
            })

            const data = await response.json() as ImportResult

            if (response.ok && data.success) {
                // Format stats for toast
                const stats = `Created: ${data.productsCreated || 0}, Updated: ${data.productsUpdated || 0}`
                showToast(stats, "success", "Import Successful")

                // Reload to show updates
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                const errorMsg = data.error || "Import failed"
                const details = data.details || (data.errors ? data.errors.slice(0, 2).join(", ") + (data.errors.length > 2 ? "..." : "") : "")
                showToast(details ? `${errorMsg}: ${details}` : errorMsg, "error", "Import Error")
            }
        } catch (error) {
            showToast("Network error occurred during import", "error")
        } finally {
            setIsImporting(false)
            setSelectedFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleCancelImport = () => {
        setShowConfirmModal(false)
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const response = await fetch("/api/admin/products/export")

            if (!response.ok) {
                const error = await response.json()
                showToast(error.error || "Export failed", "error")
                return
            }

            const contentDisposition = response.headers.get("Content-Disposition")
            let filename = "toycker-products.csv"
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/)
                if (match) {
                    filename = match[1]
                }
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            showToast("CSV exported successfully", "success", "Export Complete")
        } catch (error) {
            showToast("Export failed due to network error", "error")
        } finally {
            setIsExporting(false)
        }
    }

    const downloadTemplate = () => {
        const headers = [
            "Handle", "Title", "Description", "Short Description", "Subtitle", "Status",
            "Product Type", "Thumbnail URL", "Image URLs", "Video URL", "Category Handles", "Collection Handles",
            "Currency", "SKU", "Price", "Compare At Price", "Stock", "Barcode",
            "Option 1 Name", "Option 1 Value", "Option 2 Name", "Option 2 Value", "Option 3 Name", "Option 3 Value"
        ]

        const exampleRows = [
            ["simple-toy", "Simple Wooden Toy", "A high-quality wooden toy", "Wooden toy", "", "active", "single", "", "", "", "", "", "INR", "TOY-001", "499", "699", "100", "", "", "", "", "", "", ""],
            ["variant-guitar", "Musical Guitar", "Fun musical guitar for kids", "Kids guitar", "", "active", "variable", "", "", "", "", "", "INR", "GTR-PNK", "999", "1299", "20", "", "Color", "Pink", "", "", "", ""],
            ["variant-guitar", "Musical Guitar", "Fun musical guitar for kids", "Kids guitar", "", "active", "variable", "", "", "", "", "", "INR", "GTR-BLU", "999", "1299", "15", "", "Color", "Blue", "", "", "", ""]
        ]

        const csvString = [headers, ...exampleRows]
            .map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
            .join("\n")

        const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "product_import_template.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
            />

            <div className="flex items-center gap-2">
                <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Download Template"
                >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Template
                </button>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    {isExporting ? (
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    )}
                    Export
                </button>

                <button
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    {isImporting ? (
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    )}
                    Import
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Products</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800 font-medium">
                                ℹ️ Update Mode
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Products with the same <strong>Handle</strong> will be updated.
                                New products will be created. Missing variants in the file will not be deleted automatically.
                            </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Selected file: <span className="font-medium">{selectedFile?.name}</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancelImport}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                            >
                                Start Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
