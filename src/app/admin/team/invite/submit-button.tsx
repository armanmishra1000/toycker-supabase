"use client"

import { useFormStatus } from "react-dom"

export default function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${pending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
        >
            {pending && (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            )}
            {pending ? "Adding..." : "Add to Team"}
        </button>
    )
}
