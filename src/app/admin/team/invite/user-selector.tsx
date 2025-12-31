"use client"

import { useState, useEffect, useRef } from "react"
import { getRegisteredUsers } from "@/lib/data/admin"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

type User = {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    created_at: string
}

export default function SearchableUserSelect() {
    const [query, setQuery] = useState("")
    const [users, setUsers] = useState<User[]>([])
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true)
                try {
                    const results = await getRegisteredUsers(query)
                    setUsers(results || [])
                    setIsOpen(true)
                } catch (error) {
                    console.error("Error searching users:", error)
                } finally {
                    setLoading(false)
                }
            } else if (query.length === 0) {
                // Load recent users initially
                setLoading(true)
                try {
                    const results = await getRegisteredUsers()
                    setUsers(results || [])
                } catch (error) {
                    console.error("Error loading users:", error)
                } finally {
                    setLoading(false)
                }
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Load initial users
    useEffect(() => {
        getRegisteredUsers().then(results => setUsers(results || []))
    }, [])

    const handleSelect = (user: User) => {
        setSelectedUser(user)
        setQuery("")
        setIsOpen(false)
    }

    const clearSelection = () => {
        setSelectedUser(null)
        setQuery("")
        getRegisteredUsers().then(results => {
            setUsers(results || [])
            setIsOpen(false) // Keep closed after clear
        })
    }

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Hidden input for form submission */}
            <input type="hidden" name="user_id" value={selectedUser?.id || ""} required />

            <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
            </label>

            {selectedUser ? (
                <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {(selectedUser.first_name?.[0] || selectedUser.email[0]).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {selectedUser.first_name ? `${selectedUser.first_name} ${selectedUser.last_name || ''}` : selectedUser.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500">{selectedUser.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Search by name or email..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                </div>
            )}

            {/* Dropdown Results */}
            {isOpen && !selectedUser && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {users.length > 0 ? (
                        users.map((user) => (
                            <div
                                key={user.id}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                onClick={() => handleSelect(user)}
                            >
                                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'No Name'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="cursor-default select-none relative py-3 px-3 text-gray-500 text-center text-xs">
                            {query.length < 2 ? "Type to search users..." : "No users found."}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
