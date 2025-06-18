Well done, our content seems to be properly imported. 

Now I want you to spawn QA testing agents to test our setup. you can spawn an agent for each of the tables to test them. 

## Test description
This test suite is designed to validate the functionality of the "Content Synchronization from NocoDB" workflow. It covers the creation, update, and deletion of test records in NocoDB and ensures that the corresponding files are created, updated, and deleted in the GitHub repository.

For each of the four tables (episodes, guests, hosts and platforms):

**A: Test file creation** 
1) Using your nocodeDB MCP server, add a single test record with mock data and make sure the new record is saved. 
2) Trigger the GitHub Action "Content Synchronization from NocoDB" to import the data from NocoDB to GitHub. 
3) Using your GitHub MCP server, validate that the test record with mock data has indeed been added as a file to our GitHub repo. 
4) Using your GitHub MCP server, validate that the content of the test record has been correctly transferred to the GitHub file. 

**B: Test file update** 
5) Using your nocodeDB MCP server, update the test record by changing the data in three random fields. Make sure the edited record is saved. 
6) Trigger the GitHub Action "Content Synchronization from NocoDB" to import the data from NocoDB to GitHub. 
7) Using your GitHub MCP server, validate that the test record fields have indeed been updated in our GitHub repo. 

**C: Test file deletion** 
8) Using your nocodeDB MCP server, delete the test record.
9) Trigger the GitHub Action "Content Synchronization from NocoDB" to import the data from NocoDB to GitHub.
10) Using your GitHub MCP server, validate that the record with mock data has indeed been deleted from our GitHub repo. 

If any of these tests fail, adjust the "Content Synchronization from NocoDB" workflow to fix the issue. After updating the workflow, always validate if the workflow is working correctly and successfully and then run the above tests again. 

Important: I don't want you to edet/delete any of the existing records, only edit the data that you yourself have as added for testing purposes. 

## Additional information:

### GitHub Action Workflow for Content Synchronization
The workflow file is located at .github/workflows/sync-nocodb.yml and has the following key features:

     Trigger Methods:
     - Scheduled: Runs every 6 hours via cron
     - Manual: GitHub UI workflow_dispatch with configurable inputs
     - Push: Triggers on changes to specific files in main branch

     Workflow Jobs:
     1. sync-nocodb-content: Generates content from NocoDB
     2. sync-images: Syncs episode images from Transistor CDN
     3. validate-content: Validates generated content
     4. summary: Creates job summary

     Environment Variables Required:
     - NOCODB_API_KEY
     - NOCODB_BASE_URL
     - NOCODB_BASE_ID

### Content File Structure
Content files in src/content/ follow this structure:

     Episodes (episodes/{language}/season-{n}/episode-{id}-{slug}.mdx):
     - Frontmatter: title, description, pubDate, season, episode, duration, audioUrl, slug, language, imageUrl, hosts, guests, keywords, transistorId, shareUrl, featured,
     episodeType, summary
     - MDX content with sections like: Episode Highlights, Key Takeaways, Resources, Guest Bio

     Guests (guests/{slug}.mdx):
     - Frontmatter: name, bio, company, title, website, twitter, linkedin, episodes, languages, slug, canonicalLanguage
     - MDX content with additional details

     Hosts (hosts/{slug}.mdx):
     - Similar structure to guests

     Platforms (platforms/{slug}.json):
     - JSON files with platform configuration