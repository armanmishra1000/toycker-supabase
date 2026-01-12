"use server"

import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client } from "../r2"
import { v4 as uuidv4 } from "uuid"

export async function getPresignedUploadUrl({
    fileType,
    folder = "reviews",
    maxSizeMB: _maxSizeMB = 10,
}: {
    fileType: string
    folder?: "reviews" | "banners" | "exclusive-videos" | "products"
    maxSizeMB?: number
}) {
    try {
        // Validate file type based on folder
        const allowedTypes: Record<string, string[]> = {
            reviews: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
            banners: ["image/jpeg", "image/png", "image/webp"],
            "exclusive-videos": ["video/mp4", "video/webm"],
            products: ["image/jpeg", "image/png", "image/webp"],
        }

        if (!allowedTypes[folder]?.includes(fileType)) {
            return { error: `Invalid file type for ${folder}. Allowed: ${allowedTypes[folder]?.join(", ")}` }
        }

        const fileId = uuidv4()
        // Extract extension from mime type
        const extension = fileType.split("/")[1] || "bin"
        const key = `${folder}/${fileId}.${extension}`

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
            Key: key,
            ContentType: fileType,
        })

        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })

        return { url: signedUrl, key }
    } catch (error) {
        console.error("Error generating presigned URL:", error)
        return { error: "Unable to prepare file upload. Please try again." }
    }
}

export async function deleteFile(key: string) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
            Key: key,
        })

        await r2Client.send(command)
        return { success: true }
    } catch (error) {
        console.error("Error deleting file from R2:", error)
        return { error: "Failed to delete file from storage" }
    }
}

/**
 * Extracts the R2 key from a full public URL.
 * Example: https://pub-xxx.r2.dev/banners/file.jpg -> banners/file.jpg
 */
export async function extractKeyFromUrl(url: string): Promise<string | null> {
    try {
        const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
        if (!publicUrl || !url.startsWith(publicUrl)) {
            return null
        }

        // Remove the base URL and the leading slash
        // url: https://cdn.example.com/folder/file.jpg
        // publicUrl: https://cdn.example.com
        // result: folder/file.jpg
        const key = url.replace(publicUrl, "").replace(/^\//, "")
        return key
    } catch (e) {
        return null
    }
}
