<p align="center">
  <picture>
    <img alt="Toycker logo" src="public/assets/images/toycker.png" width="200">
  </picture>
</p>

<h1 align="center">
  Toycker Storefront
</h1>

<p align="center">
  Next.js 15 + Supabase Ecommerce Starter
</p>

# Overview

The Toycker Storefront is built with:

- [Next.js 15](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [Typescript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) (Database & Auth)

Features include:

- Full ecommerce support:
  - Product Detail Page
  - Product Overview Page
  - Product Collections
  - Cart
  - Checkout with Stripe & PayU
  - User Accounts
  - Order Details
- Full Next.js 15 support:
  - App Router
  - Server Actions
  - Streaming
  - Static Pre-Rendering

# Quickstart

### Setting up the environment variables

Navigate into your projects directory and set up your `.env.local` file:

```shell
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_STRIPE_KEY=<your-stripe-public-key>
PAYU_MERCHANT_SALT=<your-payu-salt>
```

### Install dependencies

```shell
npm install
# or
yarn
```

### Start developing

```shell
npm run dev
# or
yarn dev
```

Your site is now running at http://localhost:8000!

# Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)