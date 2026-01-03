# Profanity Filter Usage

The profanity filter is a reusable utility located at `/lib/profanity-filter.ts` that helps keep user-generated content family-friendly.

## Features

- **Validation**: Block content with inappropriate language
- **Detection**: Identify profanity with word boundaries
- **Censoring**: Replace bad words with asterisks
- **Obfuscation handling**: Catches common character substitutions (e.g., 'f*ck', 'sh!t')

## Usage Examples

### 1. API Route Validation (Recommended)

Validate user input in your API routes before saving to database:

```typescript
import { validateNoProfanity } from "@/lib/profanity-filter";

export async function POST(request: Request) {
  const { title, description } = await request.json();

  // Validate fields
  try {
    validateNoProfanity(title, 'Title');
    validateNoProfanity(description, 'Description');
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Content contains inappropriate language' },
      { status: 400 }
    );
  }

  // Proceed with saving...
}
```

### 2. Check for Profanity

Get detailed information about profanity matches:

```typescript
import { checkProfanity } from "@/lib/profanity-filter";

const result = checkProfanity(userInput);

if (result.isProfane) {
  console.log('Found inappropriate words:', result.matches);
}
```

### 3. Censor Profanity

Replace bad words with asterisks (use sparingly):

```typescript
import { censorProfanity } from "@/lib/profanity-filter";

const sanitized = censorProfanity(userInput);
// "This is some bad shit" -> "This is some bad ****"
```

## Current Implementation

✅ **Account Settings** (`/api/user/profile`)
- Bio field
- Name field  
- Public name field

## Where to Add Next

Consider adding profanity filtering to:

- `/api/observations` - Observation descriptions
- `/api/projects` - Project titles and descriptions
- `/api/projects/[id]/updates` - Project update content
- `/api/conservation-project/[id]/questions` - User questions
- Any other user-generated content fields

## Customization

To add or modify the word list, edit `/lib/profanity-filter.ts`:

```typescript
const badWords = [
  // Add new words here
  'newbadword',
];
```

## Notes

- The filter uses word boundaries to avoid false positives
- It handles basic character substitution obfuscation
- Returns clear error messages to help users understand what went wrong
- Validation happens server-side for security
