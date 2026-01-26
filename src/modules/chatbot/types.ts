/**
 * Chatbot TypeScript Types
 * Defines all interfaces for the rule-based chatbot system
 */

// Message sender types
export type ChatMessageSender = 'user' | 'bot'

// Different message content types
export type ChatMessageType =
    | 'text'           // Plain text message
    | 'quick_replies'  // Message with quick reply buttons
    | 'order_list'     // List of user's orders
    | 'order_status'   // Single order status display
    | 'club_info'      // Club membership information
    | 'rewards_info'   // Reward points information
    | 'contact_info'   // Contact details

// Quick reply button definition
export interface QuickReply {
    id: string
    label: string
    value: string
    icon?: string
}

// Order data for display in chat
export interface OrderDisplayData {
    orderId?: string
    displayId: number
    status: string
    paymentStatus: string
    total: number
    createdAt: string
    itemCount: number
    trackingNumber?: string
    shippingPartner?: string
}

// Club info data for display
export interface ClubDisplayData {
    isMember: boolean
    discountPercentage: number
    rewardsPercentage: number
    minPurchaseAmount: number
    totalSavings?: number
    memberSince?: string
}

// Rewards data for display
export interface RewardsDisplayData {
    balance: number
    isMember: boolean
}

// Contact data for display
export interface ContactDisplayData {
    phone: string
    email: string
    locations: Array<{
        title: string
        address: string[]
        phone: string
    }>
}

// Individual chat message
export interface ChatMessage {
    id: string
    sender: ChatMessageSender
    type: ChatMessageType
    content: string
    quickReplies?: QuickReply[]
    orderData?: OrderDisplayData | OrderDisplayData[]
    clubData?: ClubDisplayData
    rewardsData?: RewardsDisplayData
    contactData?: ContactDisplayData
    timestamp: Date
}

// Flow node for conversation decision tree
export interface FlowNode {
    id: string
    message: string
    quickReplies?: QuickReply[]
    nextFlow?: string
    action?: ChatbotAction
}

// Actions the chatbot can perform
export type ChatbotAction =
    | 'fetch_orders'
    | 'fetch_club_settings'
    | 'fetch_rewards'
    | 'show_contact'
    | 'go_to_main_menu'
    | 'prompt_order_id'

// Overall chatbot state
export interface ChatbotState {
    isOpen: boolean
    messages: ChatMessage[]
    currentFlow: string
    isTyping: boolean
    userInput: string
    pendingAction: ChatbotAction | null
}

// Chatbot context actions
export type ChatbotActionType =
    | { type: 'TOGGLE_OPEN' }
    | { type: 'OPEN' }
    | { type: 'CLOSE' }
    | { type: 'ADD_MESSAGE'; payload: ChatMessage }
    | { type: 'SET_TYPING'; payload: boolean }
    | { type: 'SET_FLOW'; payload: string }
    | { type: 'SET_USER_INPUT'; payload: string }
    | { type: 'SET_PENDING_ACTION'; payload: ChatbotAction | null }
    | { type: 'CLEAR_MESSAGES' }
    | { type: 'LOAD_MESSAGES'; payload: ChatMessage[] }
    | { type: 'ADD_BOT_RESPONSE'; payload: ChatMessage }

// Props for message components
export interface MessageBubbleProps {
    message: ChatMessage
    onQuickReplyClick?: (reply: QuickReply) => void
}

// Props for quick reply buttons
export interface QuickReplyButtonsProps {
    replies: QuickReply[]
    onSelect: (reply: QuickReply) => void
    disabled?: boolean
}
