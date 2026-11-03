import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// The dev server gets its own output directory so running `next build`
// (which writes `.next`) never overwrites the manifests of a live dev server.
export default function config(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
