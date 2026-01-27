"use client"

import { useState, useEffect } from "react"
import AdminCard from "../admin-card"
import { SparklesIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline"
import { createClient } from "@/lib/supabase/client"

export default function VisualSearchSettings() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [progress, setProgress] = useState({ total: 0, pending: 0, processed: 0 })
    const [isReindexing, setIsReindexing] = useState(false)
    const [message, setMessage] = useState("")

    const fetchStatus = async () => {
        const supabase = createClient()
        const { count: total } = await supabase.from("products").select("*", { count: "exact", head: true })
        const { count: pending } = await supabase.from("products").select("*", { count: "exact", head: true }).is("image_embedding", null)

        setProgress({
            total: total || 0,
            pending: pending || 0,
            processed: (total || 0) - (pending || 0)
        })
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    const handleReindex = async () => {
        setIsReindexing(true)
        setStatus("loading")
        setMessage("Starting re-indexing...")

        try {
            let hasMore = true
            let totalProcessed = 0

            while (hasMore) {
                const response = await fetch("/api/admin/search/backfill", { method: "POST" })
                const data = await response.json()

                if (!response.ok) throw new Error(data.message || "Re-indexing failed")

                totalProcessed += data.success
                hasMore = data.remaining

                setMessage(`Processed ${totalProcessed} products...`)
                await fetchStatus() // Update UI counts
            }

            setStatus("success")
            setMessage("All products have been successfully indexed.")
        } catch (error) {
            console.error("Re-indexing error:", error)
            setStatus("error")
            setMessage(error instanceof Error ? error.message : "An unexpected error occurred.")
        } finally {
            setIsReindexing(false)
        }
    }

    return (
        <AdminCard>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-indigo-600" />
                        Visual Search Index
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage image embeddings for the high-precision search engine.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Products</p>
                    <p className="text-2xl font-bold text-slate-900">{progress.total}</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">Indexed</p>
                    <p className="text-2xl font-bold text-indigo-700">{progress.processed}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">Pending</p>
                    <p className="text-2xl font-bold text-amber-700">{progress.pending}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={handleReindex}
                    disabled={isReindexing || progress.pending === 0}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    {isReindexing ? (
                        <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            Indexing...
                        </>
                    ) : (
                        <>
                            <ArrowPathIcon className="w-4 h-4" />
                            {progress.pending > 0 ? "Generate Missing Embeddings" : "Re-index All"}
                        </>
                    )}
                </button>

                {status !== "idle" && (
                    <div className={`flex items-center gap-2 text-sm font-medium ${status === "success" ? "text-emerald-600" :
                            status === "error" ? "text-rose-600" :
                                "text-slate-600"
                        }`}>
                        {status === "success" && <CheckCircleIcon className="w-5 h-5" />}
                        {status === "error" && <ExclamationCircleIcon className="w-5 h-5" />}
                        {status === "loading" && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />}
                        {message}
                    </div>
                )}
            </div>

            {progress.pending > 0 && !isReindexing && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                        Some products are missing image embeddings. Visual search accuracy may be reduced until re-indexing is complete.
                    </p>
                </div>
            )}
        </AdminCard>
    )
}
