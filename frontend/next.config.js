/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly use webpack — Turbopack in Next 15/16 has @swc/helpers bugs
  // Remove this line once your Next version stabilises
};

module.exports = nextConfig;
