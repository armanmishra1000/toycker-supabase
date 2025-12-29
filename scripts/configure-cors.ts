import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3"
import dotenv from "dotenv"

// Load env vars from .env.local
dotenv.config({ path: ".env.local" })

async function configureCors() {
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET

    if (!bucketName) {
        console.error("CLOUDFLARE_R2_BUCKET is not defined in environment variables")
        process.exit(1)
    }

    const r2Client = new S3Client({
        region: "auto",
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
        },
    })

    console.log(`Configuring CORS for bucket: ${bucketName}...`)

    const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["PUT", "POST", "GET", "HEAD", "DELETE"],
                    AllowedOrigins: ["*"], // For development.
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3600,
                },
            ],
        },
    })

    try {
        await r2Client.send(command)
        console.log("Successfully configured CORS for R2 bucket.")
    } catch (error) {
        console.error("Error configuring CORS:", error)
    }
}

configureCors()
