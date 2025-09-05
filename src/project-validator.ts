import { readFileSync, existsSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
import { EnvVar } from "./github-secrets.js";

/**
 * Check if current directory is a valid Hasura DDN project
 */
export function validateHasuraProject(): void {
  const hasuraDir = join(process.cwd(), ".hasura");

  if (!existsSync(hasuraDir)) {
    console.error("❌ No .hasura directory found in current directory.");
    console.error("Please run this command from the root of your Hasura DDN project.");
    console.error("");
    console.error("Expected structure:");
    console.error("  your-project/");
    console.error("  ├── .hasura/");
    console.error("  ├── .env.cloud");
    console.error("  └── ...");
    process.exit(1);
  }
}

/**
 * Parse .env file and return key-value pairs
 */
export function parseEnvFile(filePath: string): EnvVar[] {
  const content = readFileSync(filePath, "utf8");
  const parsed = dotenv.parse(content);

  return Object.entries(parsed).map(([key, value]) => ({
    key,
    value: String(value).replace(/^["']|["']$/g, ""), // Remove surrounding quotes
  }));
}

/**
 * Validate and parse the .env.cloud file
 */
export function validateAndParseEnvCloud(projectRoot: string): EnvVar[] {
  const envFilePath = join(projectRoot, ".env.cloud");

  if (!existsSync(envFilePath)) {
    console.error(`❌ .env.cloud file not found at: ${envFilePath}`);
    console.error("The .env.cloud file should contain your actual environment variables and secrets.");
    console.error("");
    console.error("Expected .env.cloud format:");
    console.error("  HASURA_DDN_PAT=ddn_pat_1234567890abcdef");
    console.error("  PQL_GITHUB_TOKEN=ghp_your_github_personal_access_token");
    console.error("  PQL_GITHUB_OWNER=your_github_username_or_org");
    console.error("  PQL_GITHUB_REPO=your_repository_name");
    console.error("  DATABASE_URL=postgresql://user:pass@host:5432/db");
    console.error("  API_KEY=your_actual_api_key");
    console.error("");
    console.error("This file should already exist with your real values.");
    process.exit(1);
  }

  return parseEnvFile(envFilePath);
}

/**
 * Extract GitHub configuration from environment variables
 */
export function extractGitHubConfig(envVars: EnvVar[]) {
  return {
    GITHUB_TOKEN: envVars.find((v) => v.key === "PQL_GITHUB_TOKEN")?.value || "",
    GITHUB_OWNER: envVars.find((v) => v.key === "PQL_GITHUB_OWNER")?.value || "",
    GITHUB_REPO: envVars.find((v) => v.key === "PQL_GITHUB_REPO")?.value || "",
  };
}
