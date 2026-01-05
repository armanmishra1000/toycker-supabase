import React from "react"

/**
 * Generic Loading State
 * Displays a simple, centered spinner as a fallback for all routes in (main)
 * This prevents the Home Page skeleton from flickering on every navigation
 */
export default function Loading() {
    return (
        <div className="w-full min-h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Loading amazing toys...</p>
            </div>
        </div>
    )
}
