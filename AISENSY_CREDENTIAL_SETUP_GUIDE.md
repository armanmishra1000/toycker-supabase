# AiSensy WhatsApp OTP Credential Setup Guide

This file explains how to set all credentials needed for the AiSensy WhatsApp OTP login in a simple step-by-step way.

## Where to put these values

Add all values in your local `.env` file.

Example:

```env
AISENSY_API_KEY=
AISENSY_CAMPAIGN_NAME=
AISENSY_BASE_URL=https://backend.aisensy.com/campaign/t1/api/v2
AISENSY_SOURCE=toycker-storefront
AISENSY_AUTH_TEMPLATE_EXTRA_PAYLOAD_JSON=
OTP_HASH_SECRET=
OTP_TTL_SECONDS=180
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=3
WHATSAPP_LOGIN_EMAIL_DOMAIN=wa.toycker.store
```

## What comes from AiSensy and what does not

### These come from AiSensy

- `AISENSY_API_KEY`
- `AISENSY_CAMPAIGN_NAME`
- `AISENSY_AUTH_TEMPLATE_EXTRA_PAYLOAD_JSON`

### These do not come from AiSensy

- `AISENSY_BASE_URL`
- `AISENSY_SOURCE`
- `OTP_HASH_SECRET`
- `OTP_TTL_SECONDS`
- `OTP_RESEND_COOLDOWN_SECONDS`
- `OTP_MAX_ATTEMPTS`
- `WHATSAPP_LOGIN_EMAIL_DOMAIN`

## Step 1: Create the WhatsApp Authentication template in AiSensy

1. Log in to your AiSensy dashboard.
2. Go to `Manage`.
3. Open `Template Message`.
4. Click `+ New`.
5. Choose the template category as `Authentication`.
6. Create the OTP template.
7. Add a 4-digit sample OTP code like `1234`.
8. In the `Copy Code` section, enter the same 4-digit sample OTP again.
9. Submit the template for approval.
10. Wait until the template is approved.

Important:

- The OTP code must be the same in both places:
  - inside the message template
  - inside the copy-code button section

## Step 2: Create the API campaign in AiSensy

1. In AiSensy, go to `Campaigns`.
2. Click `+ Launch`.
3. Choose `API Campaign`.
4. Select the approved authentication template.
5. Give the campaign a clear name.
6. Save it.
7. Set the campaign status to `Live`.

The exact campaign name you create here is your:

```env
AISENSY_CAMPAIGN_NAME=your-live-campaign-name
```

## Step 3: Get the AiSensy API key

1. In AiSensy, go to `Manage`.
2. Open `API Key`.
3. Copy the API key.
4. Put it in your `.env`.

Example:

```env
AISENSY_API_KEY=your-real-aisensy-api-key
```

## Step 4: Set the fixed AiSensy base URL

This value is fixed. You do not need to get it from the dashboard.

Use:

```env
AISENSY_BASE_URL=https://backend.aisensy.com/campaign/t1/api/v2
```

## Step 5: Set `AISENSY_SOURCE`

This is just your own label. It helps identify where the request is coming from.

You can use:

```env
AISENSY_SOURCE=toycker-storefront
```

You can also use another simple value like:

- `website`
- `toycker-web`
- `toycker-auth`

## Step 6: Get `AISENSY_AUTH_TEMPLATE_EXTRA_PAYLOAD_JSON`

This is the most important part after the API key.

### Why this is needed

The app already sends these standard fields:

- `apiKey`
- `campaignName`
- `destination`
- `userName`
- `source`
- `templateParams`

But AiSensy authentication templates usually need extra fields in the request body, especially for the OTP button or auth-specific payload.

### How to get it

1. Open the same AiSensy API campaign.
2. Click `Test Campaign`.
3. Fill in sample values.
4. Generate the request / cURL.
5. Copy the generated cURL.
6. Look at the JSON body inside that cURL.

### What to keep

Keep only the extra fields that are not already covered by these:

- `apiKey`
- `campaignName`
- `destination`
- `userName`
- `source`
- `templateParams`

### What to put in `.env`

Paste only the extra JSON object into:

```env
AISENSY_AUTH_TEMPLATE_EXTRA_PAYLOAD_JSON=
```

### Replace hardcoded sample values with placeholders

When you paste the JSON, replace fixed sample values like this:

- OTP value -> `{{OTP_CODE}}`
- destination number -> `{{DESTINATION}}`
- user name -> `{{USER_NAME}}`

### Example

This is only an example shape. Your real AiSensy cURL may look different.

```env
AISENSY_AUTH_TEMPLATE_EXTRA_PAYLOAD_JSON={"paramsFallbackValue":{"otp":"{{OTP_CODE}}"}}
```

Important:

- Do not invent this JSON.
- Copy it from AiSensy `Test Campaign`.
- Then replace only the sample values with placeholders.

## Step 7: Generate `OTP_HASH_SECRET`

This does not come from AiSensy. You generate it yourself.

### Simple PowerShell method

1. Open PowerShell in your project folder.
2. Run this command:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

3. It will print a long random string.
4. Copy the full output.
5. Put it into your `.env`.

Example:

```env
OTP_HASH_SECRET=your-generated-random-secret
```

Important:

- Generate it once.
- Keep it private.
- Do not change it later unless you intentionally want old OTP hashes to stop matching.

## Step 8: Set OTP timing values

These are app settings, not AiSensy credentials.

Recommended values:

```env
OTP_TTL_SECONDS=180
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=3
```

Meaning:

- `OTP_TTL_SECONDS=180` -> OTP expires in 3 minutes
- `OTP_RESEND_COOLDOWN_SECONDS=60` -> user must wait 60 seconds before requesting another OTP
- `OTP_MAX_ATTEMPTS=3` -> user gets 3 tries before the OTP is blocked

## Step 9: Set `WHATSAPP_LOGIN_EMAIL_DOMAIN`

This is an app-side setting used internally for Supabase user creation.

Use:

```env
WHATSAPP_LOGIN_EMAIL_DOMAIN=wa.toycker.store
```

If you want, you can keep this exact value.

## Final `.env` example

```env
AISENSY_API_KEY=your-real-aisensy-api-key
AISENSY_CAMPAIGN_NAME=your-live-campaign-name
AISENSY_BASE_URL=https://backend.aisensy.com/campaign/t1/api/v2
AISENSY_SOURCE=toycker-storefront
AISENSY_AUTH_TEMPLATE_EXTRA_PAYLOAD_JSON={"your":"real-extra-json-from-aisensy-with-{{OTP_CODE}}-placeholders"}
OTP_HASH_SECRET=your-generated-random-secret
OTP_TTL_SECONDS=180
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=3
WHATSAPP_LOGIN_EMAIL_DOMAIN=wa.toycker.store
```

## Quick checklist

- Authentication template created
- Template approved
- API campaign created
- API campaign set to `Live`
- `AISENSY_API_KEY` copied
- `AISENSY_CAMPAIGN_NAME` copied
- `AISENSY_AUTH_TEMPLATE_EXTRA_PAYLOAD_JSON` copied from `Test Campaign` cURL
- `OTP_HASH_SECRET` generated
- `.env` updated

## Official AiSensy references

- API reference: https://wiki.aisensy.com/en/articles/11501889-api-reference-docs
- Authentication template setup: https://wiki.aisensy.com/en/articles/11501833-how-to-create-and-automate-the-authentication-whatsapp-template-messages
