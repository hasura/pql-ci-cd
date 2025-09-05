import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { EnvVar } from "./github-secrets.js";
import { generateCreateBuildWorkflow, generateApplyBuildWorkflow } from "./workflow-generator.js";

/**
 * Generate and write both GitHub Actions workflow files
 */
export function generateWorkflowFiles(projectRoot: string, envVars: EnvVar[]): void {
  // Always generate both workflows (using "." as the path since we're in the project root)
  const createBuildYaml = generateCreateBuildWorkflow(envVars, ".");
  const applyBuildYaml = generateApplyBuildWorkflow(".");
  const githubDir = join(projectRoot, ".github", "workflows");

  if (!existsSync(githubDir)) {
    mkdirSync(githubDir, { recursive: true });
  }

  const createBuildPath = join(githubDir, "create-build.yml");
  const applyBuildPath = join(githubDir, "apply-build.yml");

  writeFileSync(createBuildPath, createBuildYaml);
  writeFileSync(applyBuildPath, applyBuildYaml);

  console.log(`✅ Generated workflow files:`);
  console.log(`  - ${createBuildPath}`);
  console.log(`  - ${applyBuildPath}`);
}
