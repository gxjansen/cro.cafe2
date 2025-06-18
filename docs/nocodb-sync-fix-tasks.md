# NocoDB Sync Fix Tasks

## 🚨 Critical Issues (P0)

### 1. Implement Deletion Synchronization
**Priority**: HIGH  
**Effort**: Medium  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts`
- `scripts/generate-content.ts`

**Tasks**:
- [ ] Add method to track existing files before sync
- [ ] Compare NocoDB records with existing files
- [ ] Implement file deletion for removed records
- [ ] Add deletion logging and reporting
- [ ] Test deletion sync with all content types

**Acceptance Criteria**:
- Files are removed when corresponding NocoDB records are deleted
- Deletion operations are logged
- No orphaned files remain after sync

### 2. Fix Update Synchronization
**Priority**: HIGH  
**Effort**: Low  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts`

**Tasks**:
- [ ] Remove `overwriteExisting: false` check for updates
- [ ] Ensure latest data from NocoDB is used
- [ ] Update all fields, not just timestamps
- [ ] Add change detection to log what was updated
- [ ] Test updates for all content types

**Acceptance Criteria**:
- Content changes in NocoDB reflect in GitHub files
- All fields update correctly
- Update operations are logged

### 3. Fix Platform Table Synchronization
**Priority**: HIGH  
**Effort**: Medium  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts`
- `src/lib/services/nocodb-api-client.ts`

**Tasks**:
- [ ] Review platform field mapping in NocoDB
- [ ] Fix platform file naming (use slug not ID)
- [ ] Map all platform fields correctly
- [ ] Add platform-specific validation
- [ ] Test platform sync end-to-end

**Acceptance Criteria**:
- Platform files use slug-based naming
- All platform fields map correctly
- Platform data matches NocoDB records

## ⚠️ Important Issues (P1)

### 4. Add Comprehensive Validation
**Priority**: MEDIUM  
**Effort**: Medium  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts`
- `src/content/config.ts`

**Tasks**:
- [ ] Add pre-generation validation for required fields
- [ ] Validate data types and formats
- [ ] Create validation error reports
- [ ] Skip invalid records but continue processing
- [ ] Add validation tests

**Acceptance Criteria**:
- Invalid records are skipped with clear error messages
- Valid records still process successfully
- Validation errors are logged and reported

### 5. Standardize Field Mapping
**Priority**: MEDIUM  
**Effort**: Low  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts`
- Documentation files

**Tasks**:
- [ ] Document expected field names for each table
- [ ] Add field name normalization helpers
- [ ] Create field mapping configuration
- [ ] Update all field references to use consistent names
- [ ] Add field mapping tests

**Acceptance Criteria**:
- Consistent field naming across all tables
- Clear documentation of field mappings
- No field mapping errors

### 6. Fix Social Links Mapping
**Priority**: MEDIUM  
**Effort**: Low  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts` (already partially fixed)

**Tasks**:
- [ ] Ensure hosts social links properly convert to array format
- [ ] Map individual fields (website, twitter, linkedin) correctly
- [ ] Handle missing social fields gracefully
- [ ] Test with various social link combinations

**Acceptance Criteria**:
- Social links appear as proper array in generated files
- All platform types are supported
- Missing fields don't cause errors

## 📋 Nice-to-Have (P2)

### 7. Add Test Mode
**Priority**: LOW  
**Effort**: Medium  
**Files to modify**: 
- `scripts/generate-content.ts`
- `.github/workflows/sync-nocodb.yml`

**Tasks**:
- [ ] Add --dry-run flag to content generator
- [ ] Show preview of changes without applying
- [ ] Add --test-mode for safe testing
- [ ] Document test mode usage

### 8. Improve Error Reporting
**Priority**: LOW  
**Effort**: Low  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts`

**Tasks**:
- [ ] Add detailed error context
- [ ] Create error summary report
- [ ] Add error categorization
- [ ] Include recovery suggestions

### 9. Add Sync Metrics
**Priority**: LOW  
**Effort**: Low  
**Files to modify**: 
- `src/lib/engines/simple-content-generator.ts`

**Tasks**:
- [ ] Track sync duration
- [ ] Count created/updated/deleted files
- [ ] Add performance metrics
- [ ] Generate sync summary report

## Implementation Order

1. **Week 1**: Fix Critical Issues (P0)
   - Fix update synchronization (easiest win)
   - Implement deletion synchronization
   - Fix platform synchronization

2. **Week 2**: Address Important Issues (P1)
   - Add validation
   - Standardize field mapping
   - Complete social links fix

3. **Week 3**: Nice-to-Have Features (P2)
   - Add test mode
   - Improve error reporting
   - Add metrics

## Testing Strategy

After each fix:
1. Run the test script (`scripts/test-nocodb-crud.js`)
2. Verify the specific issue is resolved
3. Ensure no regression in other areas
4. Update test documentation

## Success Metrics

- 100% of CRUD operations work correctly
- No orphaned files after deletion
- All field updates propagate properly
- Zero data loss during sync
- Clear error reporting for failures