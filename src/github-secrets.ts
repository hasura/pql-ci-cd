import { Octokit } from "@octokit/rest";

export interface EnvVar {
  key: string;
  value: string;
}

export class GitHubSecretsManager {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Get the repository's public key for encrypting secrets
   */
  async getPublicKey() {
    const { data } = await this.octokit.rest.actions.getRepoPublicKey({
      owner: this.owner,
      repo: this.repo,
    });
    return data;
  }

  /**
   * Encrypt a secret value using the repository's public key
   * GitHub uses libsodium sealed boxes for encryption
   */
  async encryptSecret(value: string, publicKey: string): Promise<string> {
    try {
      const sodium = require("libsodium-wrappers");
      await sodium.ready;

      // GitHub's public key is base64 encoded but we need to handle it as Uint8Array
      const publicKeyBytes = new Uint8Array(Buffer.from(publicKey, "base64"));
      const messageBytes = new Uint8Array(Buffer.from(value, "utf8"));

      // Use libsodium's crypto_box_seal (sealed box) which is what GitHub expects
      const encrypted = sodium.crypto_box_seal(messageBytes, publicKeyBytes);
      return Buffer.from(encrypted).toString("base64");
    } catch (error) {
      console.error("Failed to encrypt secret with libsodium:", error);
      console.error("Public key length:", publicKey.length);
      console.error("Public key (first 50 chars):", publicKey.substring(0, 50));
      throw new Error(`Failed to encrypt secret: ${error}`);
    }
  }

  /**
   * Create or update a repository secret
   */
  async createOrUpdateSecret(name: string, value: string, keyId: string) {
    const publicKeyData = await this.getPublicKey();
    const encryptedValue = await this.encryptSecret(value, publicKeyData.key);

    await this.octokit.rest.actions.createOrUpdateRepoSecret({
      owner: this.owner,
      repo: this.repo,
      secret_name: name,
      encrypted_value: encryptedValue,
      key_id: publicKeyData.key_id,
    });

    console.log(`✅ Secret '${name}' created/updated successfully`);
  }

  /**
   * List all repository secrets
   */
  async listSecrets() {
    const { data } = await this.octokit.rest.actions.listRepoSecrets({
      owner: this.owner,
      repo: this.repo,
    });
    return data.secrets;
  }
}
