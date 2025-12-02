# Add Optional PII Attributes and Social Media Consent Feature

## Overview
Add an optional "Advanced Options" section in the hero search area that allows users to:
1. Enter optional PII attributes (Email, Phone, DOB, Address, etc.) along with their name for more targeted searches
2. Provide explicit consent via checkbox to include social media search (default: false)

## Current Backend Analysis

### Backend Endpoint: `GET /search`
**Location:** `C:\Users\eshwa\CursorProjects\PrivacyGuard\routes\search.py`

**Current Parameters:**
- `searchName` (required) - Name to search for
- `parameters` (optional string) - Comma-separated search parameters for Google Custom Search
- `includeSocial` (bool, default: True) - Include social media search
- `maxResults` (int, default: 25) - Maximum results

**Current Behavior:**
- `parameters` is used to refine Google Custom Search queries
- `includeSocial` controls whether social media platforms are searched
- PII attributes are extracted AFTER search, not used to refine the search query

## Implementation Plan

### Phase 1: Backend Updates

#### 1.1 Update Search Endpoint Model
**File:** `C:\Users\eshwa\CursorProjects\PrivacyGuard\models.py`

- Add new `PIIAttributes` model for optional PII fields
- Update `SearchRequest` model to include:
  - `piiAttributes` (optional dict/object)
  - `includeSocial` (default: False - change from True)

#### 1.2 Update Search Endpoint
**File:** `C:\Users\eshwa\CursorProjects\PrivacyGuard\routes\search.py`

- Accept optional PII attributes in the request
- Build enhanced search query using name + PII attributes
- Convert PII attributes to search parameters for Google Custom Search
- Change default `includeSocial` to `False`
- Use PII attributes to refine search queries (e.g., "John Doe" + "john@email.com" → better targeted search)

#### 1.3 Update Core Search Engine (if needed)
**File:** `C:\Users\eshwa\CursorProjects\PrivacyGuard\core.py`

- Enhance `search_multiple_engines` to better utilize PII attributes
- Build more targeted search queries when PII attributes are provided

### Phase 2: Frontend Updates

#### 2.1 Create Advanced Search Options Component
**New File:** `src/components/AdvancedSearchOptions.tsx`

- Collapsible/expandable section with "Advanced Options" toggle
- Form fields for optional PII attributes:
  - Email
  - Phone
  - DOB (Date of Birth)
  - Address
  - Location
  - Employer
  - Education
  - Other relevant PII fields
- Checkbox: "Include Social Media Search" (default: unchecked/false)
- Clean, user-friendly UI with proper validation

#### 2.2 Update HeroSection Component
**File:** `src/components/HeroSection.tsx`

- Add state for advanced options visibility
- Add state for PII attributes
- Add state for social media consent checkbox
- Integrate `AdvancedSearchOptions` component below search bar
- Update `handleSearch` to include PII attributes and `includeSocial` flag
- Pass all data to API call

#### 2.3 Update API Client
**File:** `src/lib/api.ts`

- Update `searchByName` function signature to accept:
  - `searchName` (required)
  - `piiAttributes` (optional object)
  - `includeSocial` (boolean, default: false)
- Change API call from GET to POST (to support complex data)
- Or keep GET but properly encode PII attributes as query parameters
- Update request to send all parameters to backend

#### 2.4 Update Type Definitions
**File:** `src/lib/api.ts` or `src/types/analysis.ts`

- Add interface for PII attributes
- Add interface for enhanced search request
- Update SearchResponse if needed

### Phase 3: User Experience

#### 3.1 UI/UX Considerations
- Advanced options should be collapsible (hidden by default)
- Clear labels and placeholders for each PII field
- Validation for email, phone format
- Help text explaining what each field does
- Social media checkbox should have clear consent language
- Visual indication when advanced options are enabled

#### 3.2 Accessibility
- Proper form labels
- Keyboard navigation support
- Screen reader friendly
- Clear focus states

## Files to Modify

### Backend Files:
1. `C:\Users\eshwa\CursorProjects\PrivacyGuard\models.py` - Add PII attributes model
2. `C:\Users\eshwa\CursorProjects\PrivacyGuard\routes\search.py` - Update endpoint
3. `C:\Users\eshwa\CursorProjects\PrivacyGuard\core.py` - Enhance search logic (if needed)

### Frontend Files:
1. `src/components/HeroSection.tsx` - Add advanced options integration
2. `src/components/AdvancedSearchOptions.tsx` - **NEW** - Advanced options UI component
3. `src/lib/api.ts` - Update API client
4. `src/types/analysis.ts` - Add type definitions (if needed)

## Implementation Details

### PII Attributes to Support:
Based on backend analysis, these are the available PII categories:
- **Contact Info:** Email, Phone, Personal Cell, Business Phone, Address
- **Personal Info:** DOB, Gender, Location, Birth Place
- **Professional:** Employer, Education, Occupation, Salary
- **Other:** Website

### Search Query Enhancement:
When PII attributes are provided, the backend should:
1. Use them to build more targeted Google Custom Search queries
2. Example: "John Doe" + "john@example.com" → search for both together
3. Use parameters to refine search results

### Social Media Consent:
- Default: **false** (user must explicitly opt-in)
- Clear consent language: "I consent to search social media platforms"
- When unchecked, backend should skip social media search entirely

## Testing Checklist
- [ ] Advanced options section is collapsible and hidden by default
- [ ] PII attribute fields are optional and work correctly
- [ ] Social media checkbox defaults to false
- [ ] Search works with only name (backward compatible)
- [ ] Search works with name + PII attributes
- [ ] Search respects social media consent checkbox
- [ ] Backend properly uses PII attributes to refine search
- [ ] API calls include all parameters correctly
- [ ] Error handling for invalid PII data
- [ ] Mobile responsive design

## Notes
- Backward compatibility: Existing searches (name only) should continue to work
- The `parameters` field in backend can be used to pass PII attributes as search refinements
- Social media search should be opt-in (explicit consent required)

