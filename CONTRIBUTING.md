# Contributing to SSH (Scientific Skills Hub)

Thank you for your interest in contributing to SSH!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ssh
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Setup database**
   ```bash
   bun run prisma:generate
   bun run prisma:push
   ```

5. **Start development server**
   ```bash
   bun run dev
   ```

## Code Style

We use [Biome](https://biomejs.dev/) for code formatting and linting:

```bash
# Check for issues
bun run lint

# Auto-fix issues
bun run format
```

## Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage

# Run tests once
bun run test:run
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(search): add fuzzy search support

Add fuzzy search using fuse.js for better search results
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes and ensure tests pass
3. Run linting and type checking
4. Push your changes and create a PR
5. Wait for review and address feedback

## Git Hooks

This project uses Husky for pre-commit hooks. Make sure to:
- Run tests before committing
- Format code before committing
- Keep commits atomic and descriptive

## Questions?

If you have questions, feel free to open an issue or start a discussion.
