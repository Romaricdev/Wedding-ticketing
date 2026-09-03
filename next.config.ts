import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Les imports sont validés côté serveur à 20 Mo maximum ; la limite Next
    // doit donc accepter un PDF réel avant que cette validation s'applique.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
