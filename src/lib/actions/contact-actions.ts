"use server"

import { z } from "zod"
import { sendBrevoEmail } from "@/lib/brevo"

// Validation schema for contact form data
const ContactFormSchema = z.object({
    name: z.string().min(1, "Full name is required").max(100, "Name is too long"),
    email: z.string().email("Invalid email address"),
    phone: z.string().max(20, "Phone number is too long").optional().or(z.literal("")),
    message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
})

const ProductQuestionSchema = ContactFormSchema.extend({
    productName: z.string().min(1),
    productUrl: z.string().url(),
})

export type ContactFormData = z.infer<typeof ContactFormSchema>
export type ProductQuestionData = z.infer<typeof ProductQuestionSchema>

export interface ContactActionResult {
    success: boolean
    error?: string
}

/**
 * Server Action to handle Contact Us form submission.
 * Validates the form data and sends an email via Brevo.
 */
export async function sendContactEmail(
    data: ContactFormData
): Promise<ContactActionResult> {
    try {
        // Validate input data
        const validatedData = ContactFormSchema.parse(data)

        const recipientEmail = process.env.CONTACT_FORM_RECIPIENT || "customercare@toycker.com"
        const senderEmail = process.env.CONTACT_FORM_SENDER || "toycker@apexture.in"

        // Format the email content
        const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #ff3e3e;">New Contact Inquiry</h2>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Phone:</strong> ${validatedData.phone || "Not provided"}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${validatedData.message}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 0.8em; color: #888;">This email was sent from the Toycker Contact Us form.</p>
      </div>
    `

        await sendBrevoEmail({
            subject: `New Inquiry from ${validatedData.name} - Toycker`,
            htmlContent,
            sender: {
                email: senderEmail,
                name: "Toycker Website",
            },
            to: [
                {
                    email: recipientEmail,
                    name: "Toycker Customer Care",
                },
            ],
            replyTo: {
                email: validatedData.email,
                name: validatedData.name,
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Contact form error:", error)

        if (error instanceof z.ZodError) {
            const firstError = error.issues[0]
            return {
                success: false,
                error: firstError?.message || "Invalid form data",
            }
        }

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while sending your message. Please try again later.",
        }
    }
}

/**
 * Server Action to handle "Ask a Question" form on product pages.
 */
export async function sendProductQuestion(
    data: ProductQuestionData
): Promise<ContactActionResult> {
    try {
        const validatedData = ProductQuestionSchema.parse(data)

        const recipientEmail = process.env.CONTACT_FORM_RECIPIENT || "customercare@toycker.com"
        const senderEmail = process.env.CONTACT_FORM_SENDER || "toycker@apexture.in"

        const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #ff3e3e;">New Product Inquiry</h2>
        <p><strong>Product:</strong> <a href="${validatedData.productUrl}" style="color: #ff3e3e; text-decoration: none; font-weight: bold;">${validatedData.productName}</a></p>
        <p><strong>Link:</strong> <a href="${validatedData.productUrl}">${validatedData.productUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><strong>From:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Phone:</strong> ${validatedData.phone || "Not provided"}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><strong>Question/Message:</strong></p>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${validatedData.message}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 0.8em; color: #888;">This email was sent from the "Ask a Question" form on the Toycker product page.</p>
      </div>
    `

        await sendBrevoEmail({
            subject: `Product Inquiry: ${validatedData.productName} - ${validatedData.name}`,
            htmlContent,
            sender: {
                email: senderEmail,
                name: "Toycker Website",
            },
            to: [
                {
                    email: recipientEmail,
                    name: "Toycker Customer Care",
                },
            ],
            replyTo: {
                email: validatedData.email,
                name: validatedData.name,
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Product question error:", error)

        if (error instanceof z.ZodError) {
            const firstError = error.issues[0]
            return {
                success: false,
                error: firstError?.message || "Invalid form data",
            }
        }

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while sending your question. Please try again later.",
        }
    }
}
