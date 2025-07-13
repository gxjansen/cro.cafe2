# Manual n8n Workflow Activation Instructions

## Workflow Status

✅ **Workflow Created**: Episode Thumbnail Automation (ID: `XoM3lpY95pIblvGD`)
⚠️  **Requires Manual Activation**: API limitation prevents automatic activation

## Webhook URL
Once activated, the webhook will be available at:
```
https://n8n-8gcyh-u31496.vm.elestio.app/webhook/thumbnail-trigger
```

## Manual Activation Steps

1. **Access n8n Interface**:
   - Open: https://n8n-8gcyh-u31496.vm.elestio.app
   - Login with your credentials

2. **Find the Workflow**:
   - Navigate to "Workflows" section
   - Look for "Episode Thumbnail Automation"
   - Workflow ID: `XoM3lpY95pIblvGD`

3. **Activate the Workflow**:
   - Click on the workflow to open it
   - Toggle the "Active" switch to ON
   - Confirm activation

4. **Verify Webhook URL**:
   - After activation, the webhook trigger node will show the URL
   - Should be: `https://n8n-8gcyh-u31496.vm.elestio.app/webhook/thumbnail-trigger`

## Testing the Workflow

Once activated, you can test with the provided test script:

```bash
cd /Users/guidojansen/Documents/Github/crocafesparc
node n8n-workflows/test-thumbnail-generation.js "https://n8n-8gcyh-u31496.vm.elestio.app/webhook/thumbnail-trigger"
```

## Workflow Summary

The workflow is ready and contains:
- ✅ Webhook trigger for episode_id input
- ✅ Input validation (checks for episode_id)
- ✅ Episode data retrieval (using HTTP request to NocoDB)
- ✅ Data processing (host/guest configuration detection)
- ✅ HTML template generation (with 2025 design best practices)
- ✅ Success logging
- ✅ Error handling

## Next Steps After Activation

1. **Test with sample episode**: Use episode ID 1993 (Episode #50)
2. **Verify output**: Check the logs in n8n execution history
3. **Add image generation**: Replace HTML template with Puppeteer screenshot
4. **Add Google Drive upload**: For testing phase
5. **Integrate with Transistor**: For production deployment

## Test Episodes Ready
- Episode #50 (ID: 1993): Host + Guest configuration
- Episode #49 (ID: 1994): Host-only configuration  
- Episode #48 (ID: 1760): Host + Guest configuration
- Episode #47 (ID: 1761): Host + Guest configuration
- Episode #46 (ID: 1762): Host + Guest configuration

---
**Created**: 2025-07-13  
**Status**: Ready for manual activation