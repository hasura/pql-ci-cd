import { EnvVar } from "./github-secrets.js";

/**
 * Generate create-build GitHub Actions workflow
 */
export function generateCreateBuildWorkflow(envVars: EnvVar[], pqlPath: string = "."): string {
  // Add HASURA_DDN_PAT if it's not in the env file (it's needed for the workflow)
  const allVars = [...envVars];
  if (!allVars.find((v) => v.key === "HASURA_DDN_PAT")) {
    allVars.unshift({ key: "HASURA_DDN_PAT", value: "" });
  }

  const secretRefs = allVars.map(({ key }) => `          ${key}: \${{ secrets.${key} }}`).join("\n");
  const envSection = allVars.map(({ key }) => `          ${key}=$${key}`).join("\n");

  return `name: Create PromptQL Build

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set environment variables
        run: |
          cd ${pqlPath}
          cat > .env.cloud << EOF
${envSection}
          EOF
        env:
${secretRefs}

      - name: Install DDN CLI
        run: |
          curl -L https://graphql-engine-cdn.hasura.io/ddn/cli/v4/get.sh | bash
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Verify DDN CLI installation
        run: ddn --version

      - name: Authenticate with Hasura DDN
        run: |
          cd ${pqlPath}
          ddn auth login --pat "$HASURA_DDN_PAT"
        env:
          HASURA_DDN_PAT: \${{ secrets.HASURA_DDN_PAT }}

      - name: Create DDN build
        id: build
        run: |
          cd ${pqlPath}
          BUILD_OUTPUT=$(ddn supergraph build create --out json -d "PR #\${{ github.event.number }}: \${{ github.event.pull_request.title }}")
          echo "build_output<<EOF" >> $GITHUB_OUTPUT
          echo "$BUILD_OUTPUT" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Comment on PR
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const buildOutput = JSON.parse(\`\${{ steps.build.outputs.build_output }}\`);

            const comment = \`## 🚀 PromptQL Build Complete

            **Build Version:** \\\`\${buildOutput.build_version || 'N/A'}\\\`
            **Project:** \\\`\${buildOutput.project_name || 'docs-bot'}\\\`
            **PromptQL Playground:** \${buildOutput.promptql_url ? \`[Open Playground](\${buildOutput.promptql_url})\` : 'N/A'}

            \${buildOutput.description ? \`\\n**Description:** \${buildOutput.description}\` : ''}
            \`;

            // Find existing comment
            const comments = await github.rest.issues.listComments({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
            });

            const existingComment = comments.data.find(comment =>
              comment.body.includes('🚀 PromptQL Build Complete')
            );

            if (existingComment) {
              // Update existing comment
              await github.rest.issues.updateComment({
                comment_id: existingComment.id,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            } else {
              // Create new comment
              await github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
`;
}

/**
 * Generate apply-build GitHub Actions workflow
 */
export function generateApplyBuildWorkflow(pqlPath: string = "."): string {
  return `name: Apply PromptQL Build

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  apply:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set environment variables
        run: |
          cd ${pqlPath}
          cat > .env.cloud << EOF
          HASURA_DDN_PAT=$HASURA_DDN_PAT
          EOF
        env:
          HASURA_DDN_PAT: \${{ secrets.HASURA_DDN_PAT }}

      - name: Install DDN CLI
        run: |
          curl -L https://graphql-engine-cdn.hasura.io/ddn/cli/v4/get.sh | bash
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Authenticate with PromptQL
        run: |
          cd ${pqlPath}
          ddn auth login --pat "$HASURA_DDN_PAT"
        env:
          HASURA_DDN_PAT: \${{ secrets.HASURA_DDN_PAT }}

      - name: Get build version from PR comment
        id: get_build
        uses: actions/github-script@v7
        with:
          script: |
            // Get all comments from the merged PR
            const comments = await github.rest.issues.listComments({
              issue_number: context.payload.pull_request.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
            });

            // Find the build comment
            const buildComment = comments.data.find(comment => 
              comment.body.includes('🚀 PromptQL Build Complete')
            );

            if (!buildComment) {
              core.setFailed('No build comment found in PR');
              return;
            }

            // Extract build version from comment
            const buildVersionMatch = buildComment.body.match(/\\*\\*Build Version:\\*\\* \\\`([^\\\`]+)\\\`/);
            if (!buildVersionMatch) {
              core.setFailed('Could not extract build version from comment');
              return;
            }

            const buildVersion = buildVersionMatch[1];
            console.log(\`Found build version: \${buildVersion}\`);
            core.setOutput('build_version', buildVersion);

      - name: Apply build
        run: |
          cd ${pqlPath}
          echo "Applying build version: \${{ steps.get_build.outputs.build_version }}"
          ddn supergraph build apply \${{ steps.get_build.outputs.build_version }}

      - name: Comment on merged PR
        uses: actions/github-script@v7
        with:
          script: |
            const comment = \`## ✅ PromptQL Build Applied

            **Build Version:** \\\`\${{ steps.get_build.outputs.build_version }}\\\`
            **Status:** Successfully applied to production
            **Applied at:** \${new Date().toISOString()}
            \`;

            await github.rest.issues.createComment({
              issue_number: context.payload.pull_request.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
`;
}
