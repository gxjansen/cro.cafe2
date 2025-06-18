# CRO.CAFE Podcast Platform

A modern podcast platform built with Astro, featuring multi-language support and automated content synchronization from NocoDB.

## 🚀 Features

- **Multi-language Support**: Content available in English, Dutch, German, and Spanish
- **Automated Content Sync**: GitHub Actions workflow syncs content from NocoDB
- **Episode Management**: Comprehensive episode pages with transcripts and show notes
- **Guest & Host Profiles**: Dedicated pages for podcast participants
- **Platform Integration**: Multiple podcast platform support

## 📁 Project Structure

```
src/
├── content/          # Content collections (episodes, guests, hosts, platforms)
├── components/       # Reusable UI components
├── layouts/         # Page layouts
├── pages/           # Route pages
├── lib/             # Utilities and services
│   ├── engines/     # Content generation engines
│   └── services/    # External service integrations
└── types/           # TypeScript type definitions
```

## 🔄 Content Synchronization

Content is automatically synchronized from NocoDB using GitHub Actions. The workflow runs:
- Every 6 hours (scheduled)
- On manual trigger
- When sync-related files are updated

### Sync Workflow
1. Fetches data from NocoDB tables (Episodes, Guests, Hosts, Platforms)
2. Generates MDX/JSON files in the appropriate content directories
3. Commits and pushes changes to the repository
4. Validates content and builds the site

## 📋 Known Issues

See [NocoDB Sync Test Findings](docs/nocodb-sync-test-findings.md) for detailed test results and identified issues.

### Current Limitations:
- **No Deletion Sync**: Files remain when NocoDB records are deleted
- **Partial Update Sync**: Only timestamps update, not content
- **Platform Mapping Issues**: Platform data doesn't map correctly

For the complete fix roadmap, see [NocoDB Sync Fix Tasks](docs/nocodb-sync-fix-tasks.md).

## 🛠️ Development

### Prerequisites
- Node.js 20+
- pnpm 8+
- Environment variables (see `.env.example`)

### Setup
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

### Testing Content Sync
A test script is available for validating the NocoDB sync:

```bash
# Test CRUD operations
node scripts/test-nocodb-crud.js create Episodes
node scripts/test-nocodb-crud.js update Episodes <id>
node scripts/test-nocodb-crud.js delete Episodes <id>
```

## 🔧 Configuration

### Environment Variables
Required environment variables for NocoDB synchronization:
- `NOCODB_BASE_URL`: NocoDB instance URL
- `NOCODB_API_KEY`: API authentication key
- `NOCODB_BASE_ID`: Database base identifier

### Content Schema
Content types are validated using Zod schemas defined in `src/content/config.ts`:
- Episodes: Multi-language podcast episodes with metadata
- Guests: Podcast guest profiles with social links
- Hosts: Podcast host information
- Platforms: Podcast platform configurations

## 📚 Documentation

- [Test Findings](docs/nocodb-sync-test-findings.md) - Comprehensive test results
- [Fix Tasks](docs/nocodb-sync-fix-tasks.md) - Prioritized fix roadmap
- [Test Results](tests/) - Detailed test execution reports

## 🤝 Contributing

1. Review the test findings and fix tasks
2. Pick a task from the roadmap
3. Run tests to verify your fix
4. Submit a pull request with test results

## 📄 License

[License information here]