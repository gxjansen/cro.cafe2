# Platforms Sync Test Script

## Overview
This test script (`test-platforms-sync.ts`) validates the synchronization of the Platforms table between NocoDB and GitHub. It performs a complete lifecycle test including creation, update, and deletion of platform records.

## Prerequisites

### Environment Variables
The following environment variables must be set:
- `NOCODB_BASE_URL`: Your NocoDB instance URL (e.g., https://app.nocodb.com)
- `NOCODB_API_KEY`: Your NocoDB API token
- `NOCODB_BASE_ID`: The base/project ID in NocoDB

### Permissions
- Write access to the Platforms table in NocoDB
- Ability to trigger GitHub Actions (for production testing)

## Usage

### Basic Test Run
```bash
npx tsx scripts/test-platforms-sync.ts
```

### Local Mode (Direct Script Execution)
```bash
TEST_MODE=local npx tsx scripts/test-platforms-sync.ts
```

## Test Phases

### Phase A: Creation Test
1. Creates a test platform "Test Platform QA" in NocoDB
2. Triggers content synchronization
3. Validates that `src/content/platforms/test-platform-qa.json` is created
4. Verifies the content matches the NocoDB data

### Phase B: Update Test
1. Updates the test platform with new values
2. Triggers synchronization again
3. Validates that the JSON file is updated
4. Verifies all changes are reflected correctly

### Phase C: Deletion Test
1. Deletes the test platform from NocoDB
2. Triggers synchronization
3. Validates that the JSON file is removed
4. Ensures no orphaned files remain

## Test Data

The test creates a platform with:
- **Name**: Test Platform QA
- **Slug**: test-platform-qa
- **URLs**: Multi-language URLs for en, nl, de, es
- **Icon**: Test icon URL
- **Display Order**: 999 (to appear last)
- **Active**: true

## Error Handling

- If any test phase fails, the script will attempt to clean up the test record
- All API errors are logged with detailed information
- File system operations are checked and validated

## Notes

- In production mode, the script expects you to manually trigger the GitHub Action
- In local mode (`TEST_MODE=local`), it will run the content generation script directly
- The script waits 30 seconds between operations to allow for sync completion
- All test records use high display order (999) to avoid interfering with real data