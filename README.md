# CRO.CAFE Podcast Platform

A modern podcast platform built with Astro, featuring multi-language support and automated content synchronization from NocoDB.

## 🚀 Features

- **Multi-language Support**: Full internationalization with content available in English, Dutch, German, and Spanish
- **Automated Content Sync**: Robust GitHub Actions workflow with real-time synchronization from NocoDB
- **Episode Management**: Rich episode pages with transcripts, show notes, and metadata
- **Guest & Host Profiles**: Detailed participant pages with social media integration
- **Platform Integration**: Comprehensive podcast platform support with automated linking
- **Content Validation**: Zod schema validation ensuring data integrity
- **Responsive Design**: Mobile-first, accessible design with modern UI components
- **SEO Optimized**: Built-in meta tags, structured data, and search engine optimization

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

## ✅ System Status

All core functionality is operational:
- **Complete CRUD Sync**: Full create, read, update, and delete synchronization
- **Real-time Content Updates**: Content changes reflect immediately
- **Robust Error Handling**: Comprehensive error handling and logging
- **Data Integrity**: Validated content with proper schema enforcement

## 🛠️ Development

### Prerequisites
- Node.js 20+
- pnpm 8+

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

### Content Schema
Content types are validated using Zod schemas defined in `src/content/config.ts`:
- Episodes: Multi-language podcast episodes with metadata
- Guests: Podcast guest profiles with social links
- Hosts: Podcast host information
- Platforms: Podcast platform configurations

## 📚 Documentation

- [Content Schema](src/content/config.ts) - Content type definitions and validation
- [Project Architecture](src/) - Codebase structure and organization
- [Development Guide](docs/) - Development workflows and best practices

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Run the development server with `pnpm dev`
4. Visit `http://localhost:4321` to view the site

## 📄 License

This project is proprietary software. All rights reserved. Not licensed for copying, distribution, or modification.