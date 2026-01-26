"use client"

/**
 * Chatbot Login Form Component
 * Modern Tidio-inspired design with clean inputs and high-trust feel
 */

import { useState, FormEvent } from "react"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"

interface ChatbotLoginFormProps {
    onLogin: (email: string, password: string) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    error?: string
}

export default function ChatbotLoginForm({
    onLogin,
    onCancel,
    isLoading = false,
    error
}: ChatbotLoginFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (email.trim() && password) {
            await onLogin(email.trim(), password)
        }
    }

    return (
        <div className="bg-white rounded-2xl p-6 mx-5 my-4 border border-gray-200 animate-message-pop">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-[15px] font-bold text-slate-800">
                    Sign in to your account
                </h4>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                    <label htmlFor="chatbot-email" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                        Email Address
                    </label>
                    <input
                        id="chatbot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@example.com"
                        disabled={isLoading}
                        className="
              w-full px-4 py-3 text-[14px]
              bg-slate-50 border border-slate-100 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-slate-300
              transition-all duration-200
            "
                        required
                        autoComplete="email"
                    />
                </div>

                {/* Password */}
                <div className="space-y-1.5 relative">
                    <label htmlFor="chatbot-password" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="chatbot-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            disabled={isLoading}
                            className="
                w-full px-4 py-3 pr-11 text-[14px]
                bg-slate-50 border border-slate-100 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400
                disabled:opacity-50 disabled:cursor-not-allowed
                placeholder:text-slate-300
                transition-all duration-200
              "
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-[12px] text-rose-600 bg-rose-50 px-3 py-2.5 rounded-xl border border-rose-100 animate-message-pop">
                        ⚠️ {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-2.5 pt-2">
                    <button
                        type="submit"
                        disabled={isLoading || !email.trim() || !password}
                        className="
              w-full px-4 py-3 text-[14px] font-bold
              rounded-xl text-white
              bg-gradient-to-br from-blue-600 to-blue-500
              hover:from-blue-700 hover:to-blue-600
              disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400
              disabled:cursor-not-allowed
              transition-all duration-300
              flex items-center justify-center gap-2
            "
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="
              w-full px-4 py-3 text-[14px] font-semibold
              text-slate-400 bg-white
              hover:text-slate-600 hover:bg-slate-50
              rounded-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
                    >
                        Cancel
                    </button>
                </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-50 text-center">
                <p className="text-[11px] text-slate-400">
                    Don&apos;t have an account?{" "}
                    <a href="/account" className="text-blue-600 font-bold hover:underline">
                        Create an account
                    </a>
                </p>
            </div>
        </div>
    )
}
