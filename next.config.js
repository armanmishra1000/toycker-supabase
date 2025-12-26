const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME
const R2_PROTOCOL = process.env.NEXT_PUBLIC_R2_MEDIA_PROTOCOL || "https"
const R2_HOSTNAME = process.env.NEXT_PUBLIC_R2_MEDIA_HOSTNAME || "cdn.toycker.in"
const R2_PATHNAME = process.env.NEXT_PUBLIC_R2_MEDIA_PATHNAME || "/uploads/**"

/**
 * @type {import('next').NextConfig}
 */
const IMAGE_QUALITIES = [50, 75, 90]

const shouldForceOptimizedImages =
  process.env.NEXT_PUBLIC_ENABLE_IMAGE_OPTIMIZATION === "true"

const disableOptimizer = !shouldForceOptimizedImages && Boolean(process.env.VERCEL)

const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.toycker.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cdn.toycker.in",
        pathname: "/**",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
      ...(R2_HOSTNAME
        ? [
            {
              protocol: R2_PROTOCOL,
              hostname: R2_HOSTNAME,
              pathname: R2_PATHNAME,
            },
            // Support bucket-style subdomains like <bucket>.cdn.toycker.in
            {
              protocol: R2_PROTOCOL,
              hostname: `*.${R2_HOSTNAME}`,
              pathname: R2_PATHNAME,
            },
          ]
        : []),
    ],
    qualities: IMAGE_QUALITIES,
    unoptimized: disableOptimizer,
  },
}

module.exports = nextConfig