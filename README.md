# @theme-token/sdk

TypeScript SDK for [Theme Token](https://themetoken.dev) - validate, fetch, convert, and apply ShadCN-compatible themes from the Bitcoin blockchain.

## Installation

```bash
bun add @theme-token/sdk
# or
npm install @theme-token/sdk
```

## Features

- **Validation** - Zod schemas for ThemeToken format
- **Fetching** - Retrieve themes from blockchain
- **Transformation** - Convert between ThemeToken, CSS, and ShadCN Registry formats
- **Runtime** - Apply themes to DOM at runtime

## Quick Start

```typescript
import {
  fetchThemeByOrigin,
  validateThemeToken,
  toShadcnRegistry,
  toCss,
  applyThemeMode,
} from "@theme-token/sdk";

// Fetch a theme from the blockchain
const published = await fetchThemeByOrigin("65481b3b...b0_0");
if (published) {
  // Apply it to the page
  applyThemeMode(published.theme, "dark");

  // Convert to CSS
  const css = toCss(published.theme);

  // Get ShadCN registry format
  const registry = toShadcnRegistry(published.theme);
}
```

## API Reference

### Schema & Validation

```typescript
import {
  validateThemeToken,
  parseCss,
  themeTokenSchema,
  THEME_TOKEN_SCHEMA_URL,
} from "@theme-token/sdk";

// Validate unknown JSON
const result = validateThemeToken(json);
if (result.valid) {
  console.log(result.theme.name);
} else {
  console.error(result.error);
}

// Parse CSS from TweakCN or other tools
const parsed = parseCss(cssString, "My Theme");
if (parsed.valid) {
  console.log(parsed.theme);
}

// Use Zod schema directly
const validated = themeTokenSchema.parse(data);
```

### Blockchain Fetching

```typescript
import {
  fetchThemeByOrigin,
  fetchPublishedThemes,
  getRegistryUrl,
} from "@theme-token/sdk";

// Fetch a specific theme by origin outpoint
const theme = await fetchThemeByOrigin("abc123_0");

// Fetch all published themes
const allThemes = await fetchPublishedThemes();

// Get the registry URL for shadcn CLI
const url = getRegistryUrl("abc123_0");
// => "https://themetoken.dev/r/themes/abc123_0"
```

### Format Transformations

```typescript
import {
  toShadcnRegistry,
  toCss,
  toJson,
  createThemeToken,
} from "@theme-token/sdk";

// Convert to ShadCN Registry format
const registryItem = toShadcnRegistry(theme);
// Use with: npx shadcn add https://themetoken.dev/r/themes/abc123_0

// Convert to CSS
const css = toCss(theme);
// Outputs :root { ... } and .dark { ... }

// Convert to JSON string
const json = toJson(theme, true); // pretty-printed

// Create a new theme with defaults
const newTheme = createThemeToken("My Theme", {
  primary: "oklch(0.7 0.15 240)",
  background: "oklch(0.98 0.01 240)",
});
```

### Runtime Application (Browser)

```typescript
import {
  applyTheme,
  applyThemeMode,
  getCurrentTheme,
  clearTheme,
  toggleThemeMode,
} from "@theme-token/sdk";

// Apply styles directly
applyTheme(theme.styles.light);

// Apply a specific mode
applyThemeMode(theme, "dark");

// Read current theme from DOM
const current = getCurrentTheme();
console.log(current.primary);

// Clear all theme variables
clearTheme();

// Toggle between light/dark
const newMode = toggleThemeMode(theme);
```

## Types

```typescript
import type {
  ThemeToken,
  ThemeStyles,
  ThemeStyleProps,
  ValidationResult,
  ParseResult,
  PublishedTheme,
  ShadcnRegistryItem,
} from "@theme-token/sdk";
```

### ThemeToken

The core theme format:

```typescript
interface ThemeToken {
  $schema: string;
  name: string;
  author?: string;
  styles: {
    light: ThemeStyleProps;
    dark: ThemeStyleProps;
  };
  css?: {
    "@layer base"?: Record<string, Record<string, string>>;
  };
}
```

### ThemeStyleProps

Required color properties (19 required, many optional):

```typescript
interface ThemeStyleProps {
  // Required (19 colors)
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  radius: string;

  // Optional
  "chart-1"?: string;
  "chart-2"?: string;
  // ... sidebar, typography, shadow properties
}
```

## Color Format

All colors use OKLCH format:

```
oklch(L C H)
```

- **L** (Lightness): 0-1 (0 = black, 1 = white)
- **C** (Chroma): 0-0.4 (0 = gray, higher = more saturated)
- **H** (Hue): 0-360 degrees

Examples:

```css
oklch(0.95 0.02 240)  /* Light blue-gray */
oklch(0.6 0.15 145)   /* Forest green */
oklch(0.7 0.25 330)   /* Magenta */
```

## Using with ShadCN

```bash
# Add a theme directly from the registry
npx shadcn add https://themetoken.dev/r/themes/YOUR_THEME_ORIGIN
```

Or programmatically:

```typescript
import { getRegistryUrl } from "@theme-token/sdk";

const url = getRegistryUrl(origin);
// Pass to shadcn CLI or use in your build process
```

## License

MIT
