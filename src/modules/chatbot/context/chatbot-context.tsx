"use client"

/**
 * Chatbot Context
 * Manages chatbot state with API integration for order tracking and login
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, useMemo } from 'react'
import { ChatbotState, ChatbotActionType, ChatMessage, QuickReply } from '../types'
import {
    MAIN_MENU_REPLIES,
    FLOW_MESSAGES,
    generateMessageId,
    CLUB_REPLIES,
    REWARDS_REPLIES,
    ORDER_TRACK_REPLIES,
    DELIVERY_REPLIES,
    CONTACT_REPLIES,
    PAYMENT_REPLIES,
    BACK_TO_MENU
} from '../chatbot-flows'
import {
    getChatbotUserInfo,
    getChatbotUserOrders,
    lookupOrderByDisplayId,
    getChatbotClubInfo,
    chatbotLogin,
    ChatbotUserInfo
} from '../actions'

// Local storage key for persisting messages
const STORAGE_KEY = 'toycker_chatbot_messages'

// Initial state
const initialState: ChatbotState = {
    isOpen: false,
    messages: [],
    currentFlow: 'welcome',
    isTyping: false,
    userInput: '',
    pendingAction: null
}

// Reducer
function chatbotReducer(state: ChatbotState, action: ChatbotActionType): ChatbotState {
    switch (action.type) {
        case 'TOGGLE_OPEN':
            return { ...state, isOpen: !state.isOpen }
        case 'OPEN':
            return { ...state, isOpen: true }
        case 'CLOSE':
            return { ...state, isOpen: false }
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] }
        case 'SET_TYPING':
            return { ...state, isTyping: action.payload }
        case 'SET_FLOW':
            return { ...state, currentFlow: action.payload }
        case 'SET_USER_INPUT':
            return { ...state, userInput: action.payload }
        case 'SET_PENDING_ACTION':
            return { ...state, pendingAction: action.payload }
        case 'CLEAR_MESSAGES':
            return { ...state, messages: [] }
        case 'LOAD_MESSAGES':
            return { ...state, messages: action.payload }
        case 'ADD_BOT_RESPONSE':
            return { ...state, messages: [...state.messages, action.payload], isTyping: false }
        default:
            return state
    }
}

// Create bot message helper
function createBotMessage(
    content: string,
    quickReplies?: QuickReply[],
    type: ChatMessage['type'] = 'text'
): ChatMessage {
    return {
        id: generateMessageId(),
        sender: 'bot',
        type: quickReplies ? 'quick_replies' : type,
        content,
        quickReplies,
        timestamp: new Date()
    }
}

// Create user message helper
function createUserMessage(content: string): ChatMessage {
    return {
        id: generateMessageId(),
        sender: 'user',
        type: 'text',
        content,
        timestamp: new Date()
    }
}

// Context type
interface ChatbotContextType {
    state: ChatbotState
    userInfo: ChatbotUserInfo | null
    showLoginForm: boolean
    loginError: string | null
    isLoggingIn: boolean
    pendingOrderLookup: number | null
    open: () => void
    close: () => void
    toggle: () => void
    sendMessage: (content: string) => void
    handleQuickReply: (reply: QuickReply) => void
    resetChat: () => void
    handleLogin: (email: string, password: string) => Promise<void>
    cancelLogin: () => void
    refreshUserInfo: () => Promise<void>
}

// Create context
const ChatbotContext = createContext<ChatbotContextType | null>(null)

// Provider component
export function ChatbotProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(chatbotReducer, initialState)
    const [userInfo, setUserInfo] = useState<ChatbotUserInfo | null>(null)
    const [showLoginForm, setShowLoginForm] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [pendingOrderLookup, setPendingOrderLookup] = useState<number | null>(null)

    // Fetch user info on mount and when needed
    const refreshUserInfo = useCallback(async () => {
        try {
            const info = await getChatbotUserInfo()
            setUserInfo(info)
        } catch (error) {
            console.error('Error fetching user info:', error)
            setUserInfo({ isLoggedIn: false })
        }
    }, [])

    useEffect(() => {
        refreshUserInfo()
    }, [refreshUserInfo])

    // Load messages from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as ChatMessage[]
                const messages = parsed.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
                dispatch({ type: 'LOAD_MESSAGES', payload: messages })
            }
        } catch {
            // Ignore parse errors
        }
    }, [])

    // Save messages to localStorage when they change
    useEffect(() => {
        if (state.messages.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages))
            } catch {
                // Ignore storage errors
            }
        }
    }, [state.messages])

    // Add bot message with typing effect
    const addBotMessage = useCallback((content: string, quickReplies?: QuickReply[]) => {
        dispatch({ type: 'SET_TYPING', payload: true })

        // more natural delay: base 600ms + 20ms per character
        // capped at 2.5 seconds to avoid frustration
        const charCount = content.length
        const typingDelay = Math.min(600 + (charCount * 20), 2500)

        // add some variance (0-400ms)
        const finalDelay = typingDelay + Math.random() * 400

        setTimeout(() => {
            dispatch({
                type: 'ADD_BOT_RESPONSE',
                payload: createBotMessage(content, quickReplies)
            })
        }, finalDelay)
    }, [])

    // Handle order lookup
    const handleOrderLookup = useCallback(async (displayId: number) => {
        dispatch({ type: 'SET_TYPING', payload: true })

        try {
            const result = await lookupOrderByDisplayId(displayId)

            dispatch({ type: 'SET_TYPING', payload: false })

            if (result.found && result.order) {
                // Add message with type 'order_status' and the actual order data
                dispatch({
                    type: 'ADD_MESSAGE',
                    payload: {
                        id: generateMessageId(),
                        sender: 'bot',
                        type: 'order_status',
                        content: `📦 **Order #${displayId} Found!**\n\nHere are your order details:`,
                        orderData: result.order,
                        quickReplies: [BACK_TO_MENU],
                        timestamp: new Date()
                    }
                })
            } else {
                // Order not found - check if user needs to login
                if (!userInfo?.isLoggedIn) {
                    setPendingOrderLookup(displayId)
                    setShowLoginForm(true)
                    addBotMessage(
                        `🔐 **Login Required**\n\nTo view Order #${displayId}, please log in to your account:`,
                        []
                    )
                } else {
                    addBotMessage(
                        result.error || `Order #${displayId} not found.`,
                        [
                            { id: 'try_again', label: '🔍 Try another order', value: 'track_order' },
                            BACK_TO_MENU
                        ]
                    )
                }
            }
        } catch (error) {
            console.error('Error looking up order:', error)
            dispatch({ type: 'SET_TYPING', payload: false })
            addBotMessage(
                "Sorry, I couldn't look up that order. Please try again later.",
                [BACK_TO_MENU]
            )
        }
    }, [addBotMessage, userInfo?.isLoggedIn])

    // Handle login
    const handleLogin = useCallback(async (email: string, password: string) => {
        setIsLoggingIn(true)
        setLoginError(null)

        try {
            const result = await chatbotLogin(email, password)

            if (result.success && result.user) {
                setShowLoginForm(false)
                await refreshUserInfo()

                const firstName = result.user.firstName || 'there'
                addBotMessage(
                    `🎉 **Welcome back, ${firstName}!**\n\nYou're now logged in.`,
                    []
                )

                // If there was a pending order lookup, try it again
                if (pendingOrderLookup) {
                    const orderNum = pendingOrderLookup
                    setPendingOrderLookup(null)
                    setTimeout(() => handleOrderLookup(orderNum), 500)
                } else {
                    setTimeout(() => {
                        addBotMessage(
                            "What would you like to do?",
                            MAIN_MENU_REPLIES
                        )
                    }, 800)
                }
            } else {
                setLoginError(result.error || 'Login failed. Please try again.')
            }
        } catch (error) {
            console.error('Login error:', error)
            setLoginError('An error occurred. Please try again.')
        } finally {
            setIsLoggingIn(false)
        }
    }, [addBotMessage, pendingOrderLookup, handleOrderLookup, refreshUserInfo])

    // Cancel login
    const cancelLogin = useCallback(() => {
        setShowLoginForm(false)
        setLoginError(null)
        setPendingOrderLookup(null)
        addBotMessage(
            "No problem! What else can I help you with?",
            MAIN_MENU_REPLIES
        )
    }, [addBotMessage])

    // Handle flow navigation with API integration
    const navigateToFlow = useCallback(async (flowId: string) => {
        dispatch({ type: 'SET_FLOW', payload: flowId })

        switch (flowId) {
            case 'main_menu':
            case 'welcome':
                if (userInfo?.isLoggedIn && userInfo.firstName) {
                    addBotMessage(
                        `Hi ${userInfo.firstName}! 👋 I'm Toycker Assistant.\n\nHow can I help you today?`,
                        MAIN_MENU_REPLIES
                    )
                } else {
                    addBotMessage(FLOW_MESSAGES.welcome, MAIN_MENU_REPLIES)
                }
                break

            case 'club_info':
                // Fetch real club settings
                dispatch({ type: 'SET_TYPING', payload: true })
                try {
                    const clubInfo = await getChatbotClubInfo()
                    dispatch({ type: 'SET_TYPING', payload: false })

                    if (clubInfo.isMember) {
                        const savings = clubInfo.totalSavings || 0
                        const formattedSavings = savings > 0
                            ? `Your total Club savings so far: **₹${savings.toLocaleString()}** 🎉`
                            : "Start shopping to accumulate savings!"

                        addBotMessage(
                            `⭐ **You're a Club Member!**\n\nYour benefits:\n✅ **${clubInfo.discountPercentage}% OFF** on all products\n✅ **${clubInfo.rewardsPercentage}% Reward Points** on purchases\n\n${formattedSavings}`,
                            CLUB_REPLIES
                        )
                    } else {
                        addBotMessage(
                            `⭐ **Toycker Club Membership**\n\nJoin our exclusive club and enjoy amazing benefits!\n\n✅ **${clubInfo.discountPercentage}% OFF** on all products, every time\n✅ **${clubInfo.rewardsPercentage}% Reward Points** on every purchase\n✅ Exclusive member-only offers\n\n**How to Join:**\nSpend **₹${clubInfo.minPurchaseAmount.toLocaleString()}+** in a single order - you'll automatically become a member! 🎉`,
                            CLUB_REPLIES
                        )
                    }
                } catch (error) {
                    console.error('Error fetching club info:', error)
                    dispatch({ type: 'SET_TYPING', payload: false })
                    addBotMessage(FLOW_MESSAGES.club_intro, CLUB_REPLIES)
                }
                break

            case 'club_discount_calc':
                addBotMessage(FLOW_MESSAGES.club_discount_calc, [BACK_TO_MENU])
                break

            case 'club_how_join':
                addBotMessage(FLOW_MESSAGES.club_how_join, [BACK_TO_MENU])
                break

            case 'club_savings':
                if (userInfo?.isLoggedIn) {
                    try {
                        const clubInfo = await getChatbotClubInfo()
                        if (clubInfo.isMember) {
                            const savings = clubInfo.totalSavings || 0
                            addBotMessage(
                                `💰 **Your Total Club Savings**\n\nYou've saved **₹${savings.toLocaleString()}** as a Club Member! 🎉\n\nKeep shopping to save even more with your ${clubInfo.discountPercentage}% member discount.`,
                                [BACK_TO_MENU]
                            )
                        } else {
                            addBotMessage(
                                "You're not a Club Member yet! Place an order and become a member to start saving.",
                                [
                                    { id: 'join', label: '🎯 How to join?', value: 'club_how_join' },
                                    BACK_TO_MENU
                                ]
                            )
                        }
                    } catch {
                        addBotMessage("Sorry, I couldn't fetch your savings. Please try again.", [BACK_TO_MENU])
                    }
                } else {
                    setShowLoginForm(true)
                    addBotMessage(
                        "🔐 **Login Required**\n\nPlease log in to see your Club savings:",
                        []
                    )
                }
                break

            case 'payment_info':
                addBotMessage(FLOW_MESSAGES.payment_intro, PAYMENT_REPLIES)
                break

            case 'payment_online':
                addBotMessage(FLOW_MESSAGES.payment_online, [
                    { id: 'security', label: '🔒 Is it Secure?', value: 'payment_security' },
                    { id: 'discounts', label: '🎉 Payment Discounts', value: 'payment_discounts' },
                    BACK_TO_MENU
                ])
                break

            case 'payment_security':
                addBotMessage(FLOW_MESSAGES.payment_security, [BACK_TO_MENU])
                break

            case 'payment_discounts':
                // Fetch real discount info
                dispatch({ type: 'SET_TYPING', payload: true })
                try {
                    const clubInfo = await getChatbotClubInfo()
                    dispatch({ type: 'SET_TYPING', payload: false })

                    if (clubInfo.isMember) {
                        const savings = clubInfo.totalSavings || 0
                        addBotMessage(
                            `🎉 **Your Payment Discounts**\n\n✅ **You're a Club Member!**\n\n**Your benefits on every order:**\n• **${clubInfo.discountPercentage}% OFF** automatically applied\n• **${clubInfo.rewardsPercentage}% Reward Points** earned\n\n**Your total savings so far:** ₹${savings.toLocaleString()}\n\n**How discounts are applied:**\n1️⃣ Club discount applied first\n2️⃣ Then any promo codes\n3️⃣ Finally, reward points (if used)\n\nAll discounts work for both online payment and COD! 💸`,
                            [BACK_TO_MENU]
                        )
                    } else {
                        addBotMessage(
                            `🎉 **Payment Discounts & Offers**\n\n**Club Member Discount:**\n• Get **${clubInfo.discountPercentage}% OFF** on all products!\n• Applies to both online payment & COD\n\n**How discounts are applied:**\n1️⃣ Club discount applied first (if member)\n2️⃣ Then any promo codes you enter\n3️⃣ Finally, reward points (if used)\n\n**Example:**\nOriginal price: ₹1,000\nClub discount (${clubInfo.discountPercentage}%): -₹${(1000 * clubInfo.discountPercentage / 100).toFixed(0)}\nYou pay: ₹${(1000 * (100 - clubInfo.discountPercentage) / 100).toFixed(0)}\n\n💡 **Tip:** Become a Club Member to save on every order!\nSpend ₹${clubInfo.minPurchaseAmount.toLocaleString()}+ to join.`,
                            [
                                { id: 'join', label: '⭐ Join Club', value: 'club_info' },
                                BACK_TO_MENU
                            ]
                        )
                    }
                } catch {
                    addBotMessage(FLOW_MESSAGES.payment_discounts, [BACK_TO_MENU])
                }
                break

            case 'cod_info':
                addBotMessage(FLOW_MESSAGES.cod_intro, [
                    { id: 'payment_online', label: '💳 Online Payment', value: 'payment_online' },
                    { id: 'security', label: '🔒 Is it Secure?', value: 'payment_security' },
                    BACK_TO_MENU
                ])
                break

            case 'rewards':
                if (userInfo?.isLoggedIn) {
                    if (userInfo.isClubMember) {
                        addBotMessage(
                            `🎁 **Your Reward Points**\n\n💎 **Balance: ${userInfo.rewardBalance?.toLocaleString() || 0} points**\n*(1 point = ₹1 discount)*\n\nUse your points at checkout to reduce your order total!`,
                            REWARDS_REPLIES
                        )
                    } else {
                        addBotMessage(
                            "🎁 **Reward Points**\n\nYou need to be a Club Member to earn reward points. Join the club to start earning!",
                            [
                                { id: 'join', label: '⭐ Join Club', value: 'club_info' },
                                BACK_TO_MENU
                            ]
                        )
                    }
                } else {
                    addBotMessage(FLOW_MESSAGES.rewards_intro, REWARDS_REPLIES)
                }
                break

            case 'rewards_balance':
                if (userInfo?.isLoggedIn && userInfo.isClubMember) {
                    addBotMessage(
                        `💎 **Your Balance: ${userInfo.rewardBalance?.toLocaleString() || 0} points**\n\nYou can use these points at checkout!\n\n*1 point = ₹1 discount*`,
                        [BACK_TO_MENU]
                    )
                } else if (!userInfo?.isLoggedIn) {
                    setShowLoginForm(true)
                    addBotMessage("🔐 **Login Required**\n\nPlease log in to check your reward balance:", [])
                } else {
                    addBotMessage(
                        "You need to be a Club Member to have reward points. Join the club first!",
                        [
                            { id: 'join', label: '⭐ Join Club', value: 'club_info' },
                            BACK_TO_MENU
                        ]
                    )
                }
                break

            case 'rewards_how_use':
                addBotMessage(FLOW_MESSAGES.rewards_how_use, [BACK_TO_MENU])
                break

            case 'rewards_how_earn':
                addBotMessage(FLOW_MESSAGES.rewards_how_earn, [BACK_TO_MENU])
                break

            case 'track_order':
                if (userInfo?.isLoggedIn) {
                    // Fetch user's recent orders
                    dispatch({ type: 'SET_TYPING', payload: true })
                    try {
                        const ordersData = await getChatbotUserOrders()
                        dispatch({ type: 'SET_TYPING', payload: false })

                        if (ordersData.orders.length > 0) {
                            const orderButtons: QuickReply[] = ordersData.orders.slice(0, 4).map(order => ({
                                id: `order_${order.displayId}`,
                                label: `#${order.displayId} - ${order.status.replace(/_/g, ' ')}`,
                                value: `lookup_order_${order.displayId}`
                            }))
                            orderButtons.push(BACK_TO_MENU)

                            addBotMessage(
                                "📦 **Your Recent Orders**\n\nSelect an order to see details:",
                                orderButtons
                            )
                        } else {
                            addBotMessage(
                                "📦 You don't have any orders yet.\n\nStart shopping to place your first order!",
                                [BACK_TO_MENU]
                            )
                        }
                    } catch {
                        dispatch({ type: 'SET_TYPING', payload: false })
                        addBotMessage(FLOW_MESSAGES.track_intro, ORDER_TRACK_REPLIES)
                    }
                } else {
                    addBotMessage(
                        "📦 **Track Your Order**\n\nTo track your orders, please log in first:",
                        [
                            { id: 'login', label: '🔐 Login', value: 'show_login' },
                            BACK_TO_MENU
                        ]
                    )
                }
                break

            case 'my_orders':
                if (userInfo?.isLoggedIn) {
                    navigateToFlow('track_order')
                } else {
                    setShowLoginForm(true)
                    addBotMessage("🔐 **Login Required**\n\nPlease log in to see your orders:", [])
                }
                break

            case 'enter_order_id':
                addBotMessage(
                    "🔍 **Enter Order Number**\n\nType your order number (e.g., **4** or **#4**) and I'll look it up for you:",
                    [BACK_TO_MENU]
                )
                break

            case 'show_login':
                setShowLoginForm(true)
                addBotMessage("🔐 **Login**\n\nPlease enter your credentials:", [])
                break

            case 'delivery_info':
                addBotMessage(FLOW_MESSAGES.delivery_intro, DELIVERY_REPLIES)
                break

            case 'delivery_time':
                addBotMessage(FLOW_MESSAGES.delivery_time, [BACK_TO_MENU])
                break

            case 'free_shipping':
                addBotMessage(FLOW_MESSAGES.free_shipping, [BACK_TO_MENU])
                break

            case 'how_to_order':
                addBotMessage(FLOW_MESSAGES.how_to_order, [BACK_TO_MENU])
                break

            case 'contact':
                addBotMessage(FLOW_MESSAGES.contact_intro, CONTACT_REPLIES)
                break

            case 'contact_call':
                addBotMessage(
                    "📞 **Call Us**\n\n**Main Office:** +91 9925819694\n**Branch 2:** +91 90991 44170\n\n**Hours:**\nMonday – Saturday: 10:00 AM – 10:00 PM\nSunday: Closed",
                    [BACK_TO_MENU]
                )
                break

            case 'contact_email':
                addBotMessage(
                    "📧 **Email Us**\n\n**Email:** customercare@toycker.com\n\nWe typically respond within 24 hours on business days!",
                    [BACK_TO_MENU]
                )
                break

            case 'contact_locations':
                addBotMessage(
                    "📍 **Store Locations**\n\n**HEAD OFFICE - VARACHHA**\nshed no-7/8, sardar campus, opp. River Kent,\nMota Varachha, Surat, Gujarat 394101\n📞 +91 9925819694\n\n**BRANCH 2 - ADAJAN**\nGujarat Gas circle, krishna Nagar Society,\nPremjinagar Society-1, Gita Nagar,\nAdajan, Surat\n📞 +91 90991 44170",
                    [BACK_TO_MENU]
                )
                break

            default:
                // Check if it's an order lookup
                if (flowId.startsWith('lookup_order_')) {
                    const orderNum = parseInt(flowId.replace('lookup_order_', ''), 10)
                    if (!isNaN(orderNum)) {
                        handleOrderLookup(orderNum)
                        return
                    }
                }
                addBotMessage(FLOW_MESSAGES.fallback, [BACK_TO_MENU])
        }
    }, [addBotMessage, userInfo, handleOrderLookup])

    // Open chatbot
    const open = useCallback(() => {
        dispatch({ type: 'OPEN' })
        if (state.messages.length === 0) {
            setTimeout(() => navigateToFlow('welcome'), 100)
        }
    }, [state.messages.length, navigateToFlow])

    // Close chatbot
    const close = useCallback(() => {
        dispatch({ type: 'CLOSE' })
    }, [])

    // Toggle chatbot
    const toggle = useCallback(() => {
        if (!state.isOpen && state.messages.length === 0) {
            dispatch({ type: 'OPEN' })
            setTimeout(() => navigateToFlow('welcome'), 100)
        } else {
            dispatch({ type: 'TOGGLE_OPEN' })
        }
    }, [state.isOpen, state.messages.length, navigateToFlow])

    // Higher-intelligence intent detection
    const detectIntent = useCallback((text: string): string | null => {
        const input = text.toLowerCase().trim()

        // 1. Direct Phrase Mapping (High Confidence)
        const directMapping: Record<string, string[]> = {
            track_order: [
                "track my order", "where is my package", "order status", "shipping update", "find my order",
                "tracking link", "package status", "order update", "parcel location", "delivery status",
                "check my order", "where's my toy", "shipment info", "tracking number please", "order history",
                "my recent orders", "order status check", "package tracker", "where is my delivery", "trace my order",
                "mera order kahan hai", "order track karo", "order details chahiye", "status batao", "order kab ayega",
                "tracking details do", "mera parcel kahan hai", "delivery kab hogi", "order check karein", "mera toy kab milega",
                "status kya hai", "order tracking dekhna hai", "kahan pohacha mera order", "order update do", "tracking link bhej do",
                "mera saman kidhar hai", "delivery date batao", "order status dikhao", "kitne baje ayega", "order track krna h"
            ],
            club_info: [
                "club membership", "toycker club", "join club", "membership benefits", "how to be a member",
                "club discount", "become a member", "club perks", "membership info", "club details",
                "loyal member program", "toycker club guide", "join the club now", "member advantages", "club rewards info",
                "membership enrollment", "how to join club", "club membership cost", "free club joining", "premium membership",
                "club join karna hai", "membership kaise milegi", "club benefits kya hain", "member banna hai", "club ka member kaise banu",
                "toycker club details", "membership leni hai", "club join kaise krte hain", "member discounts batao", "club perks kya h",
                "how to join toycker club", "membership rewards", "club info do", "member ke fayde", "club offers",
                "club join step", "membership details do", "toycker club kya hai", "member banne ke liye kya karein", "club discount chahiye"
            ],
            rewards: [
                "reward points", "my rewards", "loyalty points", "reward balance", "check points",
                "how to earn points", "use reward points", "points guide", "reward wallet", "my point balance",
                "toycker rewards", "spending rewards", "redeem points", "reward points info", "how many points i have",
                "check reward wallet", "point system", "get rewards", "points for shopping", "my cash points",
                "mere kitne points hain", "reward balance dikhao", "points kaise use karein", "rewards check karna hai", "mere pass kitne reward points h",
                "points shop kaise karein", "loyalty points kitne hain", "reward points kaise milege", "mere points kitne h", "points use kaise karein",
                "rewards kitne hain", "reward wallet batao", "points kaise redeem karein", "mere pass kitne points h", "reward points system kya hai",
                "cashback points", "wallet balance check", "rewards summary", "points history", "rewards kaise kamayein"
            ],
            payment_info: [
                "payment info", "how to pay", "online payment", "is payment secure", "payment methods",
                "upi payment", "card payment", "payment help", "payu info", "gpay support",
                "apple pay info", "payment options", "billing help", "secure checkout info", "payment problems",
                "pay online guide", "bank transfer details", "prepaid orders", "payment discounts", "how to use coupon",
                "payment kaise karein", "online pay kaise hoga", "cod option h?", "gpay se pay karein", "upi payment support",
                "site safe h payment ke liye?", "payment methods batao", "phonepe chalega?", "cash on delivery details", "net banking info",
                "payment problem help", "payment link do", "coupon code kaise dalein", "discount kaise milega", "payment fail ho gaya",
                "pay kaise krte h", "card se payment", "vpa id payment", "txn details", "payment receipt"
            ],
            delivery_info: [
                "delivery info", "shipping time", "delivery days", "shipping charges", "free shipping threshold",
                "can you deliver in my city", "delivery speed", "shipping partners", "express delivery", "delivery help",
                "delivery area check", "shipping locations", "how fast you ship", "shipment time", "dispatch timeline",
                "delivery issues", "delivery tracking info", "courier service", "home delivery", "pick up info",
                "delivery kitne din mein hogi", "shipping charges kitne hain", "free delivery kab milti h", "surat mein delivery hogi?", "mere city mein delivery h?",
                "kitne din me ayega", "delivery charges kya h", "free delivery threshold", "delivery speed kya h", "shipping time batao",
                "jaldi mangvana h", "express delivery h?", "delivery kyu nhi ho rhi", "delivery address change", "shipment kab niklega",
                "meray area me delivery", "kitna time lagega", "delivery boy contact", "ghar pe kab ayega", "shipping zone info"
            ],
            how_to_order: [
                "how to order", "place an order", "buying process", "how to buy toys", "ordering guide",
                "step by step order", "how to shop", "order help", "purchase info", "how can i buy",
                "ordering process detail", "start shopping guide", "how to add to cart", "ordering support", "buy now guide",
                "how to check out", "shopping instructions", "order procedure", "how to get toys", "new order help",
                "order kaise karein", "order kaise dena hai", "mujhe kharidna hai kaise lu", "toys kaise mangvayein", "order process batao",
                "naya order kaise dalein", "order kese karte h", "shopping kaise krni h", "buy karne ka tarika", "order step batao",
                "shopping guide chahiye", "kese kharide", "cheez mangvani h", "how to buy toys online", "order krne ki vidhi",
                "shopping help", "cart me kaise dalein", "order confirm kaise karein", "kese le sakte h", "toy mangvana h"
            ],
            contact: [
                "contact us", "talk to human", "customer care", "support phone number", "email address",
                "office location", "office address", "help desk", "customer support team", "reach out",
                "chat with person", "call us now", "store info", "visit our store", "company details",
                "support hours", "get in touch", "complain desk", "feedback channel", "official contact",
                "customer care number do", "baat karni hai support se", "support team number", "call par baat krni h", "email address batao",
                "dukan kahan hai", "office ka pata", "complaint karni hai", "help chahiye kisi se", "talk to agent",
                "support pe call kaise karein", "official contact details", "branch kahan hai", "store location batao", "contact details do",
                "address kya h", "help line number", "customer support help", "phone pay baat krni h", "office address do"
            ]
        }

        for (const [intent, variations] of Object.entries(directMapping)) {
            if (variations.some(v => input === v || input.includes(v))) {
                // Special check to avoid "how to order" being caught by "order" in tracking
                if (intent === 'track_order' && (input.includes('how to') || input.includes('buying') || input.includes('purchase'))) {
                    continue
                }
                return intent
            }
        }

        // 2. Weighted Keyword Scoring (Medium Confidence)
        const scores: Record<string, number> = {
            track_order: 0,
            club_info: 0,
            rewards: 0,
            payment_info: 0,
            delivery_info: 0,
            how_to_order: 0,
            contact: 0
        }

        // Define keywords with weights
        const keywords: Record<string, Record<string, number>> = {
            track_order: { track: 5, status: 5, package: 4, "where is": 4, tracking: 5, kahan: 3, kitna: 2, rasta: 2 },
            club_info: { club: 5, membership: 5, join: 3, member: 4, benefit: 3, banna: 2, lene: 2 },
            rewards: { reward: 5, point: 5, balance: 4, earn: 3, loyal: 2, kitne: 2, wallet: 3 },
            payment_info: { pay: 4, payment: 5, upi: 5, card: 5, secure: 3, bank: 3, code: 2, discount: 2 },
            delivery_info: { deliver: 5, shipping: 5, ship: 4, charges: 4, "how long": 3, time: 2, din: 2 },
            how_to_order: { buy: 5, purchase: 5, shop: 4, process: 3, steps: 3, "how to": 4, mangvana: 3, lene: 2 },
            contact: { contact: 5, help: 3, support: 4, phone: 5, email: 5, human: 5, talk: 4, baat: 3, address: 3 }
        }

        for (const [intent, dictionary] of Object.entries(keywords)) {
            for (const [word, weight] of Object.entries(dictionary)) {
                if (input.includes(word)) {
                    scores[intent] += weight
                }
            }
        }

        // Special context adjustments
        if (input.includes('how to') && input.includes('order')) {
            scores.how_to_order += 10
            scores.track_order -= 5
        }

        // Find best intent
        let bestIntent: string | null = null
        let highestScore = 0

        for (const [intent, score] of Object.entries(scores)) {
            if (score > highestScore && score >= 4) { // Threshold for confidence
                highestScore = score
                bestIntent = intent
            }
        }

        return bestIntent
    }, [])

    // Send user message
    const sendMessage = useCallback((content: string) => {
        if (!content.trim()) return

        dispatch({ type: 'ADD_MESSAGE', payload: createUserMessage(content) })
        dispatch({ type: 'SET_USER_INPUT', payload: '' })

        // 1. Check for explicit order number pattern (e.g., #4, #15, 4, 15)
        const orderNumberMatch = content.match(/^#?(\d+)$/)
        if (orderNumberMatch) {
            const orderNumber = parseInt(orderNumberMatch[1], 10)
            handleOrderLookup(orderNumber)
            return
        }

        // 2. Detect Intent using weighted logic
        const detectedIntent = detectIntent(content)

        if (detectedIntent) {
            navigateToFlow(detectedIntent)
            return
        }

        // 3. Special case for login
        const lower = content.toLowerCase()
        if (lower.includes('login') || lower.includes('sign in')) {
            if (userInfo?.isLoggedIn) {
                addBotMessage(`You're already logged in as ${userInfo.email}!`, [BACK_TO_MENU])
            } else {
                setShowLoginForm(true)
                addBotMessage("🔐 **Login**\n\nPlease enter your credentials:", [])
            }
            return
        }

        // 4. Default fallback
        if (lower.includes('menu') || lower.includes('start') || lower.includes('hello') || lower.includes('hi')) {
            navigateToFlow('main_menu')
        } else {
            addBotMessage(FLOW_MESSAGES.fallback, MAIN_MENU_REPLIES)
        }
    }, [navigateToFlow, addBotMessage, handleOrderLookup, userInfo, detectIntent])

    // Handle quick reply selection
    const handleQuickReply = useCallback((reply: QuickReply) => {
        dispatch({ type: 'ADD_MESSAGE', payload: createUserMessage(reply.label) })
        setShowLoginForm(false)
        navigateToFlow(reply.value)
    }, [navigateToFlow])

    // Reset chat
    const resetChat = useCallback(() => {
        dispatch({ type: 'CLEAR_MESSAGES' })
        localStorage.removeItem(STORAGE_KEY)
        setShowLoginForm(false)
        setPendingOrderLookup(null)
        setLoginError(null)
        refreshUserInfo()
        navigateToFlow('welcome')
    }, [navigateToFlow, refreshUserInfo])

    const value = useMemo(() => ({
        state,
        userInfo,
        showLoginForm,
        loginError,
        isLoggingIn,
        pendingOrderLookup,
        open,
        close,
        toggle,
        sendMessage,
        handleQuickReply,
        resetChat,
        handleLogin,
        cancelLogin,
        refreshUserInfo
    }), [
        state,
        userInfo,
        showLoginForm,
        loginError,
        isLoggingIn,
        pendingOrderLookup,
        open,
        close,
        toggle,
        sendMessage,
        handleQuickReply,
        resetChat,
        handleLogin,
        cancelLogin,
        refreshUserInfo
    ])

    return (
        <ChatbotContext.Provider value={value}>
            {children}
        </ChatbotContext.Provider>
    )
}

// Hook to use chatbot context
export function useChatbot(): ChatbotContextType {
    const context = useContext(ChatbotContext)
    if (!context) {
        throw new Error('useChatbot must be used within a ChatbotProvider')
    }
    return context
}
