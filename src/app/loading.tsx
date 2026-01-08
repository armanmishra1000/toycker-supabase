import React from "react"

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center gap-4">
                {/* Minimalist brand logo animation or premium spinner */}
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-gray-100 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-500 animate-pulse tracking-wide uppercase">
                    Toycker
                </p>
            </div>
        </div>
    )
}
