import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Unpooled Neon connection, used by the CLI (migrate, studio, seed tooling).
    url: env("DIRECT_URL"),
  },
});
