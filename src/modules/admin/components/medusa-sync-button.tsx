"use client"

import { useState } from "react"
import { ArrowPathIcon } from "@heroicons/react/24/outline"

interface MigrationResult {
    success: boolean
    message?: string
    stats?: {
        collections: number
        categories: number
        products: number
        variants: number
    }
    error?: string
    details?: string
}

export default function MedusaSyncButton() {
    const [isSyncing, setIsSyncing] = useState(false)
    const [result, setResult] = useState<MigrationResult | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [credentials, setCredentials] = useState({
        email: "admin@medusa-test.com",
        password: "supersecret",
    })

    const handleSync = async () => {
        setShowModal(false)
        setIsSyncing(true)
        setResult(null)

        try {
            const response = await fetch("/api/admin/migrate-medusa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medusaUrl: "http://localhost:9000",
                    email: credentials.email,
                    password: credentials.password,
                }),
            })

            const data = await response.json() as MigrationResult

            if (response.ok && data.success) {
                setResult(data)
                // Reload page after successful sync
                setTimeout(() => {
                    window.location.reload()
                }, 3000)
            } else {
                setResult({
                    success: false,
                    error: data.error || "Sync failed",
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
            setIsSyncing(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={isSyncing}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSyncing ? (
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-blue-400 border-t-transparent rounded-full" />
                ) : (
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                )}
                Sync from Medusa
            </button>

            {/* Result notification */}
            {result && (
                <div
                    className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 ${result.success
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
                                {result.success ? "✅ Sync Complete!" : result.error}
                            </p>
                            {result.success && result.stats && (
                                <p className="text-sm text-green-600 mt-1">
                                    {result.stats.collections} collections, {result.stats.categories} categories, {result.stats.products} products, {result.stats.variants} variants
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
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Credentials Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Sync from Medusa
                        </h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-amber-800 font-medium">
                                ⚠️ This will replace all existing data
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                                Products, collections, categories will be deleted and re-imported from Medusa.
                            </p>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Medusa Admin Email
                                </label>
                                <input
                                    type="email"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="admin@medusa-test.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSync}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Start Sync
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
