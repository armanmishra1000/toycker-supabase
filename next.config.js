const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

const R2_PROTOCOL = process.env.NEXT_PUBLIC_R2_MEDIA_PROTOCOL || "https"
const R2_HOSTNAME = process.env.NEXT_PUBLIC_R2_MEDIA_HOSTNAME || "cdn.toycker.in"
const R2_PATHNAME = process.env.NEXT_PUBLIC_R2_MEDIA_PATHNAME || "/uploads/**"

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

/**
 * @type {import('next').NextConfig}
 */
const IMAGE_QUALITIES = [50, 75, 90]

const nextConfig = {
  reactStrictMode: true,

  // Remove console.logs in production (keep error/warn for debugging)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
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
          {
            protocol: R2_PROTOCOL,
            hostname: `*.${R2_HOSTNAME}`,
            pathname: R2_PATHNAME,
          },
        ]
        : []),
    ],
    qualities: IMAGE_QUALITIES,
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "swiper", "@heroicons/react"],
  },
}

// Injected Sentry Configuration
const { withSentryConfig } = require("@sentry/nextjs");

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

const sentryOptions = {
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

module.exports = withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryWebpackPluginOptions,
  sentryOptions
);