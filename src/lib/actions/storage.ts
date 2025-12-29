"use server"

import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2Client } from "../r2"
import { v4 as uuidv4 } from "uuid"

export async function getPresignedUploadUrl({
    fileType,
    folder = "reviews",
}: {
    fileType: string
    folder?: string
}) {
    try {
        const fileId = uuidv4()
        // Extract extension from mime type (simple check)
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
        return { error: "Failed to generate upload URL" }
    }
}
