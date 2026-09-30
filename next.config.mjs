/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // AliExpress product image CDNs
      { protocol: 'https', hostname: '**.alicdn.com' },
      { protocol: 'https', hostname: '**.aliexpress.com' },
    ],
  },
};
export default nextConfig;
