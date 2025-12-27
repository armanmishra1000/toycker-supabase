# AI Rules

## Tech Stack

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Tailwind Merge, CLSX
*   **UI Components:** Headless UI, Radix UI Primitives
*   **Icons:** Lucide React, Heroicons
*   **Database & Auth:** Supabase (PostgreSQL)
*   **Backend Logic:** Server Actions
*   **Payment:** Stripe, PayU
*   **Carousel:** Swiper.js

## Development Rules

### 1. Component Structure & Styling
*   **Server Components First:** Default to Server Components. Only use `"use client"` when interactivity (state, effects, event listeners) is required.
*   **Tailwind CSS:** Use Tailwind for all styling. Use the `cn()` utility (combining `clsx` and `tailwind-merge`) for conditional class names.
*   **UI Primitives:** Use `@headlessui/react` for accessible interactive components like Dialogs, Popovers, and Listboxes. Use `@radix-ui` primitives if Headless UI doesn't cover the use case (e.g., Accordion).
*   **Responsiveness:** Always implement responsive design using Tailwind's breakpoints (`small`, `medium`, `large` or standard `sm`, `md`, `lg`).

### 2. Data Fetching & State Management
*   **Supabase:** Use `@supabase/ssr` methods. Use `createClient` from `@lib/supabase/server` for server-side operations and `@lib/supabase/client` for client-side.
*   **Server Actions:** Use Next.js Server Actions for form submissions and data mutations. Use `useActionState` and `useFormStatus` for managing form state in client components.
*   **URL State:** Store filter, pagination, and sorting state in URL search params to ensure shareability and server-side rendering compatibility.
*   **Context:** Use React Context sparingly, primarily for global UI state like Cart visibility or Toasts.

### 3. Navigation & Routing
*   **Localization:** Routes are prefixed with `[countryCode]`.
*   **Links:** Always use the `LocalizedClientLink` component for internal navigation to preserve the current country code context. Do not use Next.js native `Link` directly for internal routes unless strictly necessary.

### 4. Images & Media
*   **Next/Image:** Use `next/image` for all images.
*   **Icons:** Prefer `lucide-react` for UI icons. Use `@heroicons/react` if consistency with existing icons is required.

### 5. Conventions
*   **File Naming:** Use kebab-case for directories and files (e.g., `product-card.tsx`).
*   **Imports:** Use absolute imports with `@` aliases (e.g., `@modules/...`, `@lib/...`).
*   **Code Location:** Place page-specific components in `src/modules/[module-name]/components`. Shared components go in `src/modules/common/components`.