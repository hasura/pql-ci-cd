# pql-ci-cd

A CLI tool to sync CI/CD setup for PromptQL projects with GitHub Actions and secrets management.

## Usage

Run the tool from your PromptQL project directory (must contain `.hasura` directory):

```bash
npx pql-ci-cd
```

That's it! The tool will:

- ✅ Generate GitHub Actions workflows (create-build.yml + apply-build.yml)
- ✅ Sync secrets to GitHub (if GitHub credentials are in .env.cloud)
- ✅ Provide clear next steps

### Prerequisites

1. **PromptQL Project**: Must be run from a directory containing `.hasura` directory

2. **Environment File**: You must have a `.env.cloud` file in your project root with your actual environment variables
   and GitHub credentials:

```bash
# .env.cloud (should already exist with real values)
HASURA_DDN_PAT=ddn_pat_1234567890abcdef
PQL_GITHUB_TOKEN=ghp_your_github_personal_access_token
PQL_GITHUB_OWNER=your_github_username_or_org
PQL_GITHUB_REPO=your_repository_name
DATABASE_URL=your_database_url
API_KEY=your_api_key
```

**Note**: This file should already exist with your real secrets and GitHub credentials. The tool reads these values and
syncs them to GitHub repository secrets. We use `PQL_GITHUB_*` prefixes to avoid conflicts with GitHub's reserved
`GITHUB_*` environment variables.

## Project Structure

The tool expects this structure:

```
your-promptql-project/
├── .hasura/           # Required - validates this is a PromptQL project
├── .env.cloud         # Required - your environment variables AND GitHub credentials
└── ...
```

## What it does

1. **Generates GitHub Actions Workflows**: Creates two workflow files:

   - `.github/workflows/create-build.yml` - Creates PromptQL builds on PRs
   - `.github/workflows/apply-build.yml` - Applies builds to production when PRs are merged

   The create-build workflow:

   - Triggers on pull requests
   - Sets up PromptQL CLI
   - Uses your existing `.env.cloud` file (via GitHub repository secrets)
   - Creates PromptQL builds
   - Comments build results on PRs

   The apply-build workflow:

   - Triggers when PRs are merged to main
   - Extracts build version from PR comments
   - Applies the build to production
   - Confirms successful deployment

2. **Syncs Environment Secrets**: Reads your existing `.env.cloud` file and uploads the variables as encrypted GitHub
   repository secrets

## Example Workflow

```bash
# 1. Navigate to your PromptQL project (must have .hasura directory)
cd my-promptql-project

# 2. Ensure .env.cloud exists with your actual secrets AND GitHub credentials; you can do this using the CLI:
ddn supergraph build create # which will generate .env.cloud file with your secrets
# Then, add the following credentials to the .env.cloud file, with the real values:
echo "HASURA_DDN_PAT=ddn_pat_1234567890abcdef" >> .env.cloud
echo "PQL_GITHUB_TOKEN=ghp_your_github_personal_access_token" >> .env.cloud
echo "PQL_GITHUB_OWNER=your_github_username_or_org" >> .env.cloud
echo "PQL_GITHUB_REPO=your_repository_name" >> .env.cloud

# 3. Run the tool
npx pql-ci-cd

# 4. Commit and push the generated workflows
git add .
git commit -m "Add PromptQL CI/CD workflows"
git push

# 5. Create a pull request to test the create-build workflow
# 6. Merge the PR to test the apply-build workflow
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.
