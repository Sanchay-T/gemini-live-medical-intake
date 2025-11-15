/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // Disabled to prevent double WebSocket connections in dev
  swcMinify: true,
}

module.exports = nextConfig
