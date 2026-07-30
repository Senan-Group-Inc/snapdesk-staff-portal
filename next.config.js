const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: path.join(__dirname),
  },
}

module.exports = nextConfig
