# AiSensy WhatsApp OTP Executive Summary

Date: 2026-03-10

Analyzed sources:

- Project workspace: `E:\Next.js\toycker-supabase` on local branch `main`
- Referenced GitHub branch: `feat/whatsapp-otp-login` at commit `8d7940f`
- AiSensy API docs: https://wiki.aisensy.com/en/articles/11501889-api-reference-docs
- AiSensy authentication template guide: https://wiki.aisensy.com/en/articles/11501833-how-to-create-and-automate-the-authentication-whatsapp-template-messages
- Repository: https://github.com/armanmishra1000/toycker-supabase/tree/feat/whatsapp-otp-login

## Executive Summary

The right way to add WhatsApp OTP login to this project is **not** to replace Supabase Auth. It is to keep **Supabase as the identity/session layer** and use **AiSensy only as the WhatsApp OTP delivery provider**.

That recommendation is driven by the current architecture:

- account access is built around `supabase.auth.getUser()`
- customer identity is keyed by `auth.users.id` and `profiles.id`
- checkout gating depends on login state
- admin access depends on the authenticated Supabase user plus `profiles.role`

The linked `feat/whatsapp-otp-login` branch already moves in this direction, but it currently sends OTPs through a different provider (`GOWA`) and stores OTP codes manually in Supabase. The clean implementation is to keep that overall pattern, replace the outbound WhatsApp provider with AiSensy, and harden the OTP flow before release.

## What The Project Looks Like Today

### `main` branch

The local `main` branch still uses standard email/password auth:

- `src/lib/data/customer.ts`
  - `signup()` uses `supabase.auth.signUp()`
  - `login()` uses `supabase.auth.signInWithPassword()`
  - `requestPasswordReset()` uses `supabase.auth.resetPasswordForEmail()`
  - `resetPassword()` uses `supabase.auth.updateUser()`
- `src/modules/account/components/login/index.tsx`
  - email + password form
- `src/modules/account/components/register/index.tsx`
  - signup form with name, email, phone, password
- `src/modules/account/templates/login-template.tsx`
  - toggles sign-in, register, and forgot-password views

### `feat/whatsapp-otp-login` branch

The linked feature branch replaces email/password login with a custom OTP flow:

- adds `src/lib/data/otp.ts`
  - generates OTP in app code
  - stores it in `otp_codes`
  - verifies it manually
  - creates or updates Supabase users
  - issues a Supabase session by generating a magic link and verifying it server-side
- adds `src/modules/account/components/phone-login/index.tsx`
  - phone number form
  - OTP verification form
- adds `supabase/migrations/20260227_add_otp_codes_table.sql`
- removes:
  - login form
  - register form
  - forgot-password flow
  - reset-password flow

That branch is the correct starting point for WhatsApp OTP, but it is still a **manual OTP system with a GOWA transport adapter**, not an AiSensy implementation.

## What AiSensy Officially Supports

From the official AiSensy docs:

- API campaigns are sent with `POST https://backend.aisensy.com/campaign/t1/api/v2`
- required payload fields include:
  - `apiKey`
  - `campaignName`
  - `destination`
  - `userName`
- dynamic template values go into `templateParams`
- the campaign must be `Live`
- the WhatsApp template must already be approved
- successful requests return HTTP `200`

From the official authentication-template guide:

- the template must be created under the `Authentication` category
- the verification code must fit WhatsApp auth-template rules
- the same authentication code must be passed in:
  - `templateParams`
  - the template's copy-code button parameter section
- AiSensy explicitly recommends copying the generated cURL from the campaign test flow and adapting it in your backend

### Important inference from the docs

Based on the official material above, AiSensy is documented here as a **message delivery layer**, not as the OTP verification authority.

That means this project still needs to do all of the following on its own:

- generate the OTP
- store a server-side verification record
- enforce expiry
- enforce resend cooldown
- enforce retry limits
- verify the submitted code
- create the authenticated Supabase session after success

## Recommended Target Architecture

### Core decision

Use this split:

- **AiSensy**: sends the OTP on WhatsApp
- **Supabase database**: stores OTP challenge metadata
- **Supabase Auth**: remains the logged-in identity/session provider
- **Next.js server actions**: orchestrate send/verify/login

### End-to-end flow

1. User enters WhatsApp number on `/login`.
2. Server normalizes the number to one canonical format.
3. Server rate-limits the request by phone and IP.
4. Server generates a short OTP.
5. Server stores a hashed OTP record in `otp_codes`.
6. Server calls AiSensy API campaign with:
   - destination phone number
   - user name
   - OTP in `templateParams`
   - the same OTP in the authentication button payload copied from AiSensy's generated cURL
7. User enters OTP.
8. Server verifies the OTP against the latest active record.
9. On success, server finds or creates the matching Supabase auth user.
10. Server creates the Supabase session and redirects the user to checkout, account, or admin as appropriate.

## Why This Fits Toycker

This app is already tightly coupled to Supabase-authenticated users:

- `src/lib/data/auth.ts` and `src/lib/data/customer.ts` use `supabase.auth.getUser()`
- `src/app/(main)/account/layout.tsx` renders `LoginTemplate` when there is no authenticated customer
- `src/app/(checkout)/checkout/page.tsx` blocks checkout until the user is logged in
- `src/lib/data/admin.ts` gates admin access via the current Supabase user plus `profiles.role`

If you move authentication away from Supabase entirely, you will need to redesign account access, checkout gating, admin permissions, and customer/profile linkage. That is unnecessary. AiSensy should be integrated as the WhatsApp delivery provider only.

## Project-Specific Implementation Plan

### 1. Keep the feature branch approach, but replace the provider adapter

Retain the custom server-side OTP flow from `feat/whatsapp-otp-login`, but replace the GOWA-specific send logic in `src/lib/data/otp.ts` with an AiSensy integration module.

Recommended new module:

- `src/lib/integrations/aisensy.ts`

Responsibilities:

- build the AiSensy payload
- call `POST /campaign/t1/api/v2`
- validate required environment variables
- surface provider errors cleanly
- avoid leaking API keys or OTPs in logs

### 2. Keep Supabase session creation exactly as the auth backbone

The feature branch already uses a workable pattern:

- lookup user by phone/profile
- create auth user when needed
- generate a magic link
- verify it server-side to establish the session cookie

That pattern should stay, because it avoids rewriting all auth-dependent areas of the app.

### 3. Harden the OTP storage model before using AiSensy in production

The current feature branch stores OTP codes in plaintext:

- current file: `supabase/migrations/20260227_add_otp_codes_table.sql`
- current code: `src/lib/data/otp.ts`

Recommended changes:

- replace `code` with `code_hash`
- add `consumed_at`
- add `delivery_status`
- add `provider_message_id` if AiSensy returns an identifier you can store
- only allow verification of rows with `delivery_status = 'sent'`
- purge expired rows regularly

Recommended fields:

- `phone`
- `code_hash`
- `expires_at`
- `verified`
- `attempts`
- `delivery_status`
- `provider_message_id`
- `created_at`
- `consumed_at`

## Required Code Changes

### `src/lib/data/otp.ts`

Replace the outbound WhatsApp logic only; keep the overall login/session flow.

Implementation notes:

- continue using `normalizePhone()`
- continue validating India numbers if India-only login is intended
- hash OTP before storing
- verify hashes instead of comparing plaintext
- preserve admin redirect logic
- accept and honor `returnUrl`
- also support `next` for compatibility with current admin redirects

### `src/modules/account/components/phone-login/index.tsx`

Update this component to carry redirect intent through both steps.

Needed changes:

- accept `returnUrl` and/or `next`
- include it as hidden input in send and verify forms
- preserve the number between send and verify
- show a generic error if AiSensy delivery fails

### `src/modules/account/templates/login-template.tsx`

The current feature branch simplifies login too aggressively. It should:

- read `returnUrl`
- read `next`
- pass the resolved redirect target to `PhoneLogin`

This matters because:

- checkout currently redirects to `/login?returnUrl=/checkout?step=address`
- admin code currently redirects to `/login?next=/admin`

If this is not fixed, WhatsApp OTP login will cause redirect regressions.

### `src/app/(main)/login/page.tsx`

Update search-param handling so both redirect styles are supported consistently.

### `src/lib/data/admin.ts`

Standardize on one redirect parameter name.

Recommended choice:

- use `returnUrl` everywhere

That avoids having one login path for checkout and another for admin.

## AiSensy Payload Guidance

Use the official API campaign endpoint:

- `POST https://backend.aisensy.com/campaign/t1/api/v2`

Minimum payload shape for this project:

```json
{
  "apiKey": "AISENSY_API_KEY",
  "campaignName": "AISENSY_CAMPAIGN_NAME",
  "destination": "919876543210",
  "userName": "Toycker Customer",
  "source": "toycker-storefront",
  "templateParams": ["1234"]
}
```

Important:

- For authentication templates, the same code must also be sent in the copy-code button payload.
- The exact button JSON shape is not clearly described in the API reference article.
- For that reason, the safest implementation is to copy the generated cURL from AiSensy's `Test Campaign` flow and mirror that payload structure exactly in `src/lib/integrations/aisensy.ts`.

## Environment Variables

Add:

- `AISENSY_API_KEY`
- `AISENSY_CAMPAIGN_NAME`
- `AISENSY_BASE_URL=https://backend.aisensy.com/campaign/t1/api/v2`
- `AISENSY_SOURCE=toycker-storefront`
- `OTP_TTL_SECONDS=180`
- `OTP_RESEND_COOLDOWN_SECONDS=60`
- `OTP_MAX_ATTEMPTS=3`
- `WHATSAPP_LOGIN_EMAIL_DOMAIN=wa.toycker.store`

Remove after migration:

- `GOWA_API_URL`
- `GOWA_API_USER`
- `GOWA_API_PASSWORD`
- `GOWA_DEVICE_ID`

## Data Preconditions Before Cutover

### 1. Normalize phone numbers

This project already captures phone numbers during registration on `main`, but there is no schema-level uniqueness or canonical-format enforcement on `profiles.phone`.

Before switching login to phone OTP:

- backfill existing profile phone values into a canonical format such as `91XXXXXXXXXX`
- resolve duplicates manually
- reject invalid or shared phone numbers

### 2. Enforce uniqueness

The feature branch looks up users by `profiles.phone`. That is unsafe unless phone is unique.

Before production cutover, add a uniqueness guarantee after cleanup.

Recommended outcome:

- one normalized phone number maps to one `profiles.id`

### 3. Decide how to handle email in a phone-first system

The feature branch uses a synthetic email like `9198xxxxxxx@wa.toycker.store` to keep Supabase happy.

That works technically, but it creates a UX issue because the current account profile displays `customer.email` directly.

Recommended handling:

- keep synthetic email internally for Supabase session mechanics
- hide synthetic email from customer-facing UI
- optionally collect a real email later as a profile field, not as the login credential

## Recommended UX/Product Behavior

If Toycker is moving fully to WhatsApp OTP login, the cleanest behavior is:

- remove email/password sign-in from `/login`
- make first successful OTP verification create the customer account automatically
- remove forgot-password from the public login flow
- keep checkout and account behavior unchanged once session exists

For rollback safety, keep the old email/password code available in git history or behind a feature flag until the AiSensy flow is stable.

## Security And Abuse Controls

These should be part of the implementation, not a later improvement:

- never store plaintext OTPs
- never log OTPs
- rate-limit by phone
- rate-limit by IP
- cap verification attempts
- expire codes quickly
- invalidate older unverified OTPs when a new OTP is issued
- only allow verification against successfully delivered OTP records
- consider CAPTCHA or device throttling if abuse begins

## Risks To Address During Implementation

### Redirect regression

Current checkout and admin entry points do not use the same redirect parameter. The WhatsApp login flow must preserve both or standardize them.

### Duplicate accounts

If two existing `profiles` rows share the same phone number, phone-based login will be ambiguous and can attach the wrong account.

### Synthetic email leakage

Without UI cleanup, users may see synthetic emails in profile/account screens.

### Delivery success vs. verification state

If you store the OTP before sending it and AiSensy delivery fails, you create orphaned active OTPs. Track delivery state explicitly.

## Recommended Rollout Sequence

1. Create and approve the AiSensy authentication template.
2. Create a live AiSensy API campaign for that template.
3. Copy the generated authentication cURL from `Test Campaign`.
4. Replace the GOWA adapter with `src/lib/integrations/aisensy.ts`.
5. Harden OTP storage and verification.
6. Backfill and normalize existing profile phone numbers.
7. Add uniqueness protection for login phone numbers.
8. Fix redirect propagation for checkout and admin.
9. Hide synthetic emails in customer-facing profile UI.
10. Test with:
    - existing customer
    - new customer
    - checkout redirect
    - admin login
    - resend cooldown
    - wrong OTP
    - expired OTP
    - AiSensy provider failure

## Final Recommendation

Implement AiSensy in this project as a **WhatsApp OTP transport provider on top of the existing Supabase-centered auth model**.

Do **not** attempt to make AiSensy the session/auth authority for the app.

The best implementation path is:

- start from `feat/whatsapp-otp-login`
- replace GOWA with AiSensy
- harden OTP storage and phone identity rules
- preserve Supabase session creation
- fix redirect handling and synthetic-email UX before release

That gives Toycker WhatsApp OTP login with the smallest architectural change and the lowest risk to checkout, account, and admin flows.
