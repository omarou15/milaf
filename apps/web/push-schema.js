#!/usr/bin/env node
/**
 * Push Mi-Laf schema to Neon PostgreSQL
 * Usage: DATABASE_URL=postgresql://... node push-schema.js
 */

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

console.log("🔗 Connecting to:", DATABASE_URL.replace(/:[^@]+@/, ":***@"));

const { execSync } = require("child_process");

try {
  execSync("npx drizzle-kit push", {
    env: { ...process.env, DATABASE_URL },
    stdio: "inherit",
    cwd: __dirname,
  });
  console.log("✅ Schema pushed successfully");
} catch (e) {
  console.error("❌ Schema push failed");
  process.exit(1);
}
