/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Product photos uploaded to Supabase Storage.
      { protocol: "https", hostname: "**.supabase.co" },
      // Placeholder photos used by the sample catalogue.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;