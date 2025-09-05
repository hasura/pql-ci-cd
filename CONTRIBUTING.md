# Contributing to pql-ci-cd

Thank you for your interest in contributing to pql-ci-cd! This document provides guidelines and information for
developers.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- Node.js 18+ (for compatibility testing)
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/hasura/pql-ci-cd.git
cd pql-ci-cd

# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for distribution
bun run build
```

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
src/
├── index.ts                 # Main CLI entry point
├── github-secrets.ts        # GitHub API & encryption logic
├── project-validator.ts     # Project validation & .env parsing
├── workflow-generator.ts    # GitHub Actions workflow templates
├── workflow-manager.ts      # File generation & management
├── secrets-sync.ts          # Secret syncing orchestration
├── build.ts                 # Build configuration
├── package.json            # Dependencies & scripts
└── dist/                   # Built output
    ├── index.js
    └── cli.js              # Executable CLI script
```

### Module Responsibilities

- **`index.ts`** - Main orchestration and CLI interface
- **`github-secrets.ts`** - GitHub API integration, libsodium encryption, secret management
- **`project-validator.ts`** - PromptQL project validation, .env.cloud parsing, GitHub config extraction
- **`workflow-generator.ts`** - GitHub Actions YAML template generation (create-build & apply-build)
- **`workflow-manager.ts`** - File system operations for workflow generation
- **`secrets-sync.ts`** - Secret syncing orchestration and error handling

## Development Commands

```bash
# Install dependencies
bun install

# Run the tool in development mode
bun run dev

# Build for distribution
bun run build

# Test the built CLI
cd ../pql-test  # or any PromptQL project
node ../src/dist/cli.js
```

### Secret Management

- Uses libsodium-wrappers for GitHub-compatible encryption
- Reads all configuration from `.env.cloud` (single source of truth)
- Uses `PQL_GITHUB_*` prefixes to avoid GitHub's reserved `GITHUB_*` variables

### Workflow Generation

- Generates both create-build and apply-build workflows
- Templates are in `workflow-generator.ts` for easy modification
- Supports dynamic secret injection based on `.env.cloud` contents

## Testing

### Manual Testing

Use the `pql-test` directory as a test project:

```bash
cd pql-test
node ../src/dist/cli.js
```

### Test Project Setup

The `pql-test` directory should contain:

- `.hasura/` directory (validates PromptQL project)
- `.env.cloud` with test secrets and GitHub credentials

## Making Changes

### Adding New Features

1. Identify the appropriate module for your change
2. If creating new functionality, consider adding a new module
3. Update the main `index.ts` if orchestration changes are needed
4. Test thoroughly with the `pql-test` project

### Modifying Workflows

- Edit templates in `workflow-generator.ts`
- Rebuild and test with a real PromptQL project
- Ensure both create-build and apply-build workflows work correctly

### Changing Secret Handling

- Modify `github-secrets.ts` for API changes
- Update `secrets-sync.ts` for orchestration changes
- Test with real GitHub repository (secrets will be created)

## Getting Help

- Check existing issues and documentation
- Review the modular architecture to understand code organization
- Test changes with the provided `pql-test` project
- Ensure all modules work together correctly

Thank you for contributing to pql-ci-cd!
