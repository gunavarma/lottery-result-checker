import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  compress: true,
  poweredByHeader: false,
  experimental: {
    // Two root layouts exist (en route group + /[locale]); unmatched URLs must
    // render app/global-not-found.tsx, which carries its own <html> document.
    globalNotFound: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            // `camera=(self)` allows our own origin to use the camera (required
            // by the ticket scanner) while still blocking third-party iframes.
            // An empty allowlist, `camera=()`, disables the camera for this
            // site too and makes every `getUserMedia()` call fail with
            // NotAllowedError before the user is ever prompted.
            value: 'camera=(self), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
