import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['cards.scryfall.io'], // このドメインからの画像読み込みを許可
  },

};

export default nextConfig;
