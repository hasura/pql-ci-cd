import { GitHubSecretsManager, EnvVar } from "./github-secrets.js";

/**
 * Sync environment variables to GitHub repository secrets
 */
export async function syncSecretsToGitHub(
  envVars: EnvVar[],
  githubToken: string,
  githubOwner: string,
  githubRepo: string
): Promise<void> {
  console.log("");
  console.log("🔄 Syncing secrets to GitHub...");

  const secretsManager = new GitHubSecretsManager(githubToken, githubOwner, githubRepo);

  console.log(`🔄 Syncing ${envVars.length} secrets to ${githubOwner}/${githubRepo}...`);

  let successCount = 0;
  for (const { key, value } of envVars) {
    try {
      await secretsManager.createOrUpdateSecret(key, value, "");
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to sync secret '${key}':`, error);
    }
  }

  console.log(`✅ Secret sync completed! (${successCount}/${envVars.length} secrets synced)`);
}

/**
 * Handle GitHub credentials and secret syncing
 */
export async function handleSecretSync(
  envVars: EnvVar[],
  githubToken: string,
  githubOwner: string,
  githubRepo: string
): Promise<boolean> {
  if (githubToken && githubOwner && githubRepo) {
    await syncSecretsToGitHub(envVars, githubToken, githubOwner, githubRepo);
    return true;
  } else {
    console.log("");
    console.log("⚠️  Skipping secret sync (GitHub credentials not found in .env.cloud file)");
    console.log("To enable secret sync, add these to your .env.cloud file:");
    console.log("  PQL_GITHUB_TOKEN=your_github_personal_access_token");
    console.log("  PQL_GITHUB_OWNER=your_github_username_or_org");
    console.log("  PQL_GITHUB_REPO=your_repository_name");
    return false;
  }
}
