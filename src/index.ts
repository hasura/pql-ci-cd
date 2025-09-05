#!/usr/bin/env node

import { validateHasuraProject, validateAndParseEnvCloud, extractGitHubConfig } from "./project-validator.js";
import { generateWorkflowFiles } from "./workflow-manager.js";
import { handleSecretSync } from "./secrets-sync.js";

/**
 * Main CLI function
 */
export async function main() {
  console.log("🚀 pql-ci-cd - Setting up CI/CD for your Hasura DDN project");
  console.log("");

  // Validate we're in a Hasura project
  validateHasuraProject();

  // Look for .env.cloud in current directory
  const projectRoot = process.cwd();
  console.log(`📁 Project directory: ${projectRoot}`);

  // Validate and parse .env.cloud file
  const envVars = validateAndParseEnvCloud(projectRoot);
  console.log(`🔑 Found ${envVars.length} environment variables`);

  // Always generate workflow files
  console.log("");
  console.log("📝 Generating GitHub Actions workflows...");
  generateWorkflowFiles(projectRoot, envVars);

  // Try to sync secrets if GitHub credentials are provided in .env.cloud file
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = extractGitHubConfig(envVars);
  const secretsSynced = await handleSecretSync(envVars, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO);

  console.log("");
  console.log("🎉 Setup completed! Your project is now configured with:");
  console.log("  ✅ GitHub Actions workflows (create-build.yml + apply-build.yml)");
  if (secretsSynced) {
    console.log("  ✅ Synced environment secrets");
  }
  console.log("");
  console.log("Next steps:");
  console.log("  1. Commit and push the .github/workflows/ files");
  console.log("  2. Create a pull request to test the create-build workflow");
  console.log("  3. Merge the PR to test the apply-build workflow");
}

// Note: CLI execution is handled by cli.js script

// Export all modules for potential external use
export * from "./github-secrets.js";
export * from "./project-validator.js";
export * from "./workflow-generator.js";
export * from "./workflow-manager.js";
export * from "./secrets-sync.js";
