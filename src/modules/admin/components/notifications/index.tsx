"use client"

import React, { useEffect, useState, useCallback, Fragment } from "react"
import { BellIcon, PackageIcon, UserPlusIcon, StarIcon, BellOffIcon } from "lucide-react"
import { Popover, PopoverButton, PopoverPanel, Transition, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react"
import { cn } from "@lib/util/cn"
import { createClient } from "@/lib/supabase/client"
import { AdminNotification, RealtimePayload } from "@/lib/supabase/types/notifications"
import { getAdminNotifications, markNotificationAsRead, clearAllNotifications } from "@/lib/data/admin"

export function AdminNotificationDropdown() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)

    const unreadNotifications = notifications.filter(n => !n.is_read)
    const last24hNotifications = notifications.filter(n => {
        const date = new Date(n.created_at)
        const now = new Date()
        return (now.getTime() - date.getTime()) < 86400000 // 24 hours in ms
    })

    const fetchNotifications = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const data = await getAdminNotifications()
            setNotifications(data as AdminNotification[])
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()

        const supabase = createClient()
        const channel = supabase
            .channel("admin_notifications_realtime")
            .on(
                "postgres_changes" as any,
                {
                    event: "INSERT",
                    schema: "public",
                    table: "admin_notifications",
                },
                (payload: RealtimePayload<AdminNotification>) => {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 50)) // Increase slice to 50 for better context
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchNotifications])

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            )
        } catch (error) {
            console.error("Failed to mark notification as read:", error)
        }
    }

    const handleClearAll = async () => {
        try {
            await clearAllNotifications()
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (error) {
            console.error("Failed to clear notifications:", error)
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return "Just now"
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        return `${Math.floor(diffInSeconds / 86400)}d ago`
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "order": return <PackageIcon className="h-4 w-4 text-emerald-500" />
            case "user": return <UserPlusIcon className="h-4 w-4 text-blue-500" />
            case "review": return <StarIcon className="h-4 w-4 text-amber-500" />
            default: return <BellIcon className="h-4 w-4 text-gray-500" />
        }
    }

    const NotificationList = ({ list }: { list: AdminNotification[] }) => (
        <div className="max-h-[350px] overflow-y-auto overflow-x-hidden">
            {list.length > 0 ? (
                <div className="divide-y divide-gray-50">
                    {list.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                            className={cn(
                                "group relative px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer text-left",
                                !notification.is_read && "bg-emerald-50/30"
                            )}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                notification.type === 'order' ? 'bg-emerald-50' :
                                    notification.type === 'user' ? 'bg-blue-50' : 'bg-amber-50'
                            )}>
                                {getTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                        "text-sm font-medium text-gray-900 truncate",
                                        !notification.is_read && "font-semibold"
                                    )}>
                                        {notification.title}
                                    </p>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap pt-0.5">
                                        {formatTime(notification.created_at)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                                    {notification.message}
                                </p>
                            </div>
                            {!notification.is_read && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <BellOffIcon className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No notifications found</p>
                </div>
            )}
        </div>
    )

    return (
        <Popover className="relative">
            <PopoverButton className="relative h-10 w-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all focus:outline-none">
                <BellIcon className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                    </span>
                )}
            </PopoverButton>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
            >
                <PopoverPanel className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                            {notifications.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                        {unreadNotifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <TabGroup>
                        <TabList className="flex gap-4 border-b border-gray-100 px-4">
                            <Tab className={({ selected }) => cn(
                                "flex items-center gap-2 py-2 text-xs font-medium transition-all focus:outline-none border-b-2",
                                selected ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}>
                                Unread
                                <span className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px]",
                                    unreadNotifications.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                )}>
                                    {unreadNotifications.length}
                                </span>
                            </Tab>
                            <Tab className={({ selected }) => cn(
                                "flex items-center gap-2 py-2 text-xs font-medium transition-all focus:outline-none border-b-2",
                                selected ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            )}>
                                Last 24 Hours
                                <span className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px]",
                                    last24hNotifications.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                )}>
                                    {last24hNotifications.length}
                                </span>
                            </Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel>
                                <NotificationList list={unreadNotifications} />
                            </TabPanel>
                            <TabPanel>
                                <NotificationList list={last24hNotifications} />
                            </TabPanel>
                        </TabPanels>
                    </TabGroup>

                    <div className="px-4 py-2 border-t border-gray-100 flex justify-center bg-gray-50/50 rounded-b-xl">
                        <button
                            onClick={fetchNotifications}
                            className="text-[11px] font-medium text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                        >
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </PopoverPanel>
            </Transition>
        </Popover>
    )
}
