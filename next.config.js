const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

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