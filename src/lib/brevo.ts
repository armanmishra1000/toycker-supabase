/**
 * Brevo API Utility
 * Used to send transactional emails using Brevo's REST API v3.
 */

interface BrevoRecipient {
    email: string
    name?: string
}

interface BrevoSender {
    email: string
    name?: string
}

interface BrevoSendEmailParams {
    subject: string
    htmlContent: string
    sender: BrevoSender
    to: BrevoRecipient[]
    replyTo?: BrevoRecipient
}

interface BrevoErrorResponse {
    code: string
    message: string
}

/**
 * Sends a transactional email via Brevo.
 * @param params - The email parameters including subject, content, sender, and recipients.
 * @returns A promise that resolves to the API response or throws an error.
 */
export async function sendBrevoEmail(params: BrevoSendEmailParams): Promise<{ messageId: string }> {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
        throw new Error("BREVO_API_KEY is not defined in environment variables.")
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "api-key": apiKey,
        },
        body: JSON.stringify(params),
    })

    if (!response.ok) {
        const errorData = (await response.json()) as BrevoErrorResponse
        throw new Error(`Brevo API Error: ${errorData.message || response.statusText}`)
    }

    return (await response.json()) as { messageId: string }
}
