import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ---------- React Compiler (auto-memoization, stable in Next 16) ---------- */
  // reactCompiler: true,

  /* ---------- Experimental features ---------- */
  experimental: {
    /* Enable "use cache" directive for explicit caching */
    useCache: true,

    /* View transitions for animated route changes (React 19.2) */
    viewTransition: true,
  },

  /* ---------- Image optimisation ---------- */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },

  /* ---------- Server-only packages ---------- */
  serverExternalPackages: [
    "mongoose",
    "bcryptjs",
    "jsonwebtoken",
    "nodemailer",
  ],
};

export default nextConfig;
