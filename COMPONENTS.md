# 🧩 Component Documentation - Toycker Platform

This document describes the core UI components and design system used in the Toycker storefront.

## 🎨 Design System

We use **Tailwind CSS** for styling with a custom color palette defined in `tailwind.config.ts`.
- **Primary Color**: Emerald/Teal (Admin), Varies by section (Storefront).
- **Typography**: 
  - `Grandstander`: Used for headings and brand elements.
  - `Inter`: Used for body text and UI elements.

---

## 🏗️ Core Components (`src/modules/common/components`)

### 1. `LocalizedClientLink`
- **Purpose**: A wrapper around `next/link` that handles region-aware routing.
- **Usage**: Always use this instead of standard `Link` for internal site navigation.
- **Props**: Inherits all standard Next.js Link props.

### 2. `Button`
- **Variants**: `primary`, `secondary`, `ghost`, `danger`.
- **Sizes**: `small`, `medium`, `large`.
- **Properties**: Supports `isLoading` state.

### 3. `Modal`
- **Purpose**: A accessible modal dialog powered by Headless UI.
- **Contexts**: Used for review submission, quick view, and address editing.

---

## 🛒 Store Components (`src/modules/products/components`)

### 1. `ProductCard`
- **Features**: Hover effects, wishlist button, price display (including Club Price), and discount badges.
- **Pricing Logic**: Automatically handles original vs. discounted pricing.

### 2. `ImageGallery`
- **Core Library**: Swiper.js.
- **Features**: Main slider + Thumbnails, Zoom modal support, and Mobile optimization.

### 3. `Thumbnail`
- **Purpose**: Multi-format media display (Images, GIFs, and MP4 videos).
- **Behavior**: Auto-plays muted videos on hover.

---

## 🛠️ Admin Components (`src/modules/admin/components`)

### 1. `InventoryTable`
- **Purpose**: Managing product stock levels with real-time updates.
- **Visuals**: Highlights low-stock items based on `LOW_STOCK_THRESHOLD`.

### 2. `AdminGlobalSearch`
- **Purpose**: Fast search across products, orders, and customers.
- **Keyboard Shortcut**: `Cmd/Ctrl + K`.

---

## 📱 Layout Components (`src/modules/layout/components`)

### 1. `Header`
- **Features**: Mobile menu integration, search bar, cart dropdown, and wishlist/account access.

### 2. `MobileMenu`
- **Features**: Multi-level navigation support for categories and collections.

---

## 📄 Best Practices

1. **Accessibility**: Always include `aria-label` for icon-only buttons.
2. **Performance**: Use `Image` from `next/image` with proper `priority` for LCP elements.
3. **Logic Placement**: Prefer Server Components for data fetching; use Client Components only when interactivity is required.

---

*Last Updated: January 12, 2026*
