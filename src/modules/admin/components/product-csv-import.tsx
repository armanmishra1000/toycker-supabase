"use client"

import { useState, useRef } from "react"
import { ArrowUpTrayIcon, ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface ImportResult {
    success: boolean
    productsImported?: number
    variantsImported?: number
    message?: string
    error?: string
    details?: string
}

export default function ProductCsvImport() {
    const [isImporting, setIsImporting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [result, setResult] = useState<ImportResult | null>(null)
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
        setResult(null)

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const response = await fetch("/api/admin/products/import", {
                method: "POST",
                body: formData,
            })

            const data = await response.json() as ImportResult

            if (response.ok && data.success) {
                setResult(data)
                // Reload the page to show updated products
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                setResult({
                    success: false,
                    error: data.error || "Import failed",
                    details: data.details,
                })
            }
        } catch (error) {
            setResult({
                success: false,
                error: "Network error",
                details: error instanceof Error ? error.message : "Unknown error",
            })
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
                setResult({
                    success: false,
                    error: error.error || "Export failed",
                })
                return
            }

            // Get the filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get("Content-Disposition")
            let filename = "toycker-products-export.csv"
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/)
                if (match) {
                    filename = match[1]
                }
            }

            // Download the file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setResult({
                success: true,
                message: "Export downloaded successfully",
            })
        } catch (error) {
            setResult({
                success: false,
                error: "Export failed",
                details: error instanceof Error ? error.message : "Unknown error",
            })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Import/Export buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isImporting ? (
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    )}
                    Import
                </button>
            </div>

            {/* Result notification */}
            {result && (
                <div
                    className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg ${result.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                >
                    <div className="flex items-start">
                        <div className="flex-1">
                            <p
                                className={`text-sm font-medium ${result.success ? "text-green-800" : "text-red-800"
                                    }`}
                            >
                                {result.success ? result.message : result.error}
                            </p>
                            {result.success && result.productsImported !== undefined && (
                                <p className="text-sm text-green-600 mt-1">
                                    Imported {result.productsImported} products, {result.variantsImported} variants
                                </p>
                            )}
                            {!result.success && result.details && (
                                <p className="text-sm text-red-600 mt-1">{result.details}</p>
                            )}
                        </div>
                        <button
                            onClick={() => setResult(null)}
                            className="ml-4 text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Confirm Import
                        </h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-amber-800 font-medium">
                                ⚠️ Warning: This will replace all existing products
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                                All current products and their variants will be deleted and
                                replaced with data from the CSV file.
                            </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Selected file: <span className="font-medium">{selectedFile?.name}</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancelImport}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Replace All Products
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
