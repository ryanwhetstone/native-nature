# SimpleMaps SVG Integration - Canada Proof of Concept

## Overview
Successfully integrated SimpleMaps SVG map for Canada with clickable regions that navigate to province/territory pages.

## Implementation

### 1. Downloaded SVG Map
- **Source**: https://simplemaps.com/static/svg/country/ca/admin1/ca.svg
- **Location**: `/public/canada-map.svg`
- **Size**: 589.8 KB
- **License**: Free for commercial and personal use

### 2. SVG Structure
Each Canadian province/territory is represented by a `<path>` element with:
- `id` attribute: 2-letter abbreviation (e.g., "CABC" for British Columbia)
- `name` attribute: Full name (e.g., "British Columbia")

### 3. Created Mapping System
**File**: `/lib/canada-svg-mapping.ts`

Maps SVG region IDs to our route slugs:
```typescript
{
  CABC: { name: "British Columbia", slug: "british-columbia" },
  CAAB: { name: "Alberta", slug: "alberta" },
  // ... all 13 provinces/territories
}
```

### 4. Interactive SVG Component
**File**: `/components/CanadaInteractiveSVG.tsx`

Features:
- Loads SVG dynamically from `/public/canada-map.svg`
- Adds click handlers to each region
- Navigates to `/place/can/{province-slug}` on click
- Hover effects with region name tooltip
- Color changes on hover (darker green)

### 5. Updated Country Page
**File**: `/app/country/[country]/page.tsx`

Added conditional rendering:
- If country is Canada (`can`), render `CanadaInteractiveSVG`
- Otherwise, render existing `CountryDetailMapWrapper` (Leaflet)

## Technical Details

### SVG Region IDs (Canada)
- CAAB - Alberta
- CABC - British Columbia  
- CAMB - Manitoba
- CANB - New Brunswick
- CANL - Newfoundland and Labrador
- CANS - Nova Scotia
- CANT - Northwest Territories
- CANU - Nunavut
- CAON - Ontario
- CAPE - Prince Edward Island
- CAQC - Québec
- CASK - Saskatchewan
- CAYT - Yukon

### Benefits of SimpleMaps SVG
1. **Lighter weight**: SVG is smaller than tile-based maps
2. **No external dependencies**: Replaces Leaflet for country detail pages
3. **Pre-defined regions**: Admin boundaries already drawn correctly
4. **Scalable**: Vector graphics look sharp at any size
5. **Free license**: Can use commercially

## Next Steps

To extend this to all countries:

1. **Download SVG maps**: Use SimpleMaps pattern `https://simplemaps.com/static/svg/country/{country-code}/admin1/{country-code}.svg`

2. **Create mapping files**: For each country, create a mapping file like `canada-svg-mapping.ts` that maps SVG region IDs to route slugs

3. **Generic SVG component**: Create a generic `InteractiveSVG` component that accepts:
   - Country code
   - SVG file path
   - Region mapping

4. **Automated mapping generation**: Script to generate region mappings by:
   - Downloading SVG
   - Parsing path IDs
   - Matching against countrycitystatejson state names
   - Creating slug mappings

## Testing
Navigate to http://localhost:3000/country/can to see the interactive Canada map.

- Hover over provinces to see names
- Click on provinces to navigate to their detail pages
- Links follow pattern: `/place/can/{province-slug}`
