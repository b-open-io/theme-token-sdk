# Changelog

All notable changes to this project will be documented in this file.

## [0.0.19] - 2026-08-31

### Fixed

- Preserve optional Theme Token CSS when generating ShadCN registry CSS

## [0.0.18] - 2026-08-31

### Changed

- Emit the current ShadCN `registry:theme` type for generated registry items
- Preserve discovery of previously published `registry:style` MAP records

## [0.0.17] - 2026-08-30

### Changed

- Limit each Theme Token to 16 optional asset relationships

## [0.0.16] - 2026-08-30

### Added

- Optional immutable on-chain asset relationships on the existing Theme Token schema
- Versionless public schemas and TypeScript types for asset sources, rendering hints, and asset declarations

### Changed

- Preserve legacy bundle documents while allowing new themes to compose fonts, patterns, and wallpapers

## [0.0.15] - 2026-08-30

### Changed

- Install on-chain fonts through ShadCN-supported immutable CSS imports
- Apply `font-heading` to heading elements when a heading font is present

### Fixed

- Remove synthetic `@font-face-*` registry keys that current ShadCN parsed as invalid at-rules
- Deduplicate stylesheet imports when multiple font slots reference one on-chain font
- Normalize current ShadCN CSS that omits the legacy required `destructive-foreground` token

## [0.0.14] - 2026-08-30

### Added

- Current TweakCN-compatible computed shadow scale for registry, CSS, Tailwind, and runtime output
- Heading-font support, including relative on-chain font loading and generated `@font-face` rules
- Pinned ShadCN and TweakCN style-conformance coverage

### Changed

- Emit public `shadow-x` and `shadow-y` variables while retaining legacy authoring aliases
- Use the current multiplicative ShadCN radius scale through `radius-4xl`
- Hoist shared font, radius, spacing, and tracking values into registry theme variables without dropping custom tokens

### Fixed

- Apply computed shadow utilities during live theme previews so shadow controls affect components
- Preserve light/dark-specific shared-style values when the two modes differ

## [0.0.13] - 2026-08-30

### Added

- Theme bundle metadata and generated `@font-face` rules for on-chain fonts
- Optional AI generation provenance metadata
- Tests for packaged theme fetching and strict CSS parsing

### Changed

- Fetch raw content from the current `api.1sat.app` gateway
- Load `theme.json` from ord-fs packages with a legacy direct-inscription fallback
- Add indexed discovery for lowercase `theme-token` MAP metadata and `registry:style` records
- Update compatible build and type dependencies

### Fixed

- Reject incomplete CSS instead of returning an invalid Theme Token as successful
- Preserve the `use client` directive in published React entry bundles
- Recognize current lowercase MAP metadata while retaining legacy ThemeToken support

## [0.0.10] - 2024-12-09

### Changed

- **ThemeTokenProvider** now auto-detects light/dark mode changes
  - Uses MutationObserver to watch for `.dark` class on `<html>`
  - No `mode` prop needed - just wrap your app and it works
  - Automatically re-applies theme when mode changes

### Removed

- Removed `mode` prop from ThemeTokenProvider (no longer needed)

## [0.0.9] - 2024-12-09

### Added

- **ThemeTokenProvider** - React context provider for easy integration
  - Wrap your app to enable theme loading from the blockchain
  - Automatic localStorage persistence of selected theme
  - Re-applies theme when light/dark mode changes
  - Loads on-chain assets (fonts, patterns) automatically
  - `mode` prop to sync with your app's light/dark state
  - `storageKey` prop for custom localStorage key
  - `defaultOrigin` prop to load a theme on first visit
- **useThemeTokenContext()** - Hook to access ThemeToken state anywhere in the app
  - `activeTheme` - Currently loaded ThemeToken or null
  - `activeOrigin` - Origin of active theme
  - `loadTheme(origin)` - Load a theme by origin
  - `resetTheme()` - Clear theme and return to defaults
  - `isLoading` / `error` - Loading and error states
- **On-Chain Asset Loading**
  - `loadFontByOrigin()` - Load blockchain-inscribed fonts
  - `loadPatternByOrigin()` - Load blockchain-inscribed patterns/images
  - `loadThemeAssets()` - Load all assets referenced in a theme
  - `applyThemeWithAssets()` - Apply theme and load assets
  - `applyThemeModeWithAssets()` - Apply mode and load assets
  - Font and pattern caching utilities

### Changed

- Renamed `src/react.ts` to `src/react.tsx` for JSX support
- Added `jsx: "react-jsx"` to tsconfig for proper JSX compilation

## [0.0.1] - 2024-12-02

### Added

- Initial release of @theme-token/sdk
- **Schema & Validation**
  - Zod schemas: `themeTokenSchema`, `themeStylesSchema`, `themeStylePropsSchema`, `cssRulesSchema`
  - `validateThemeToken()` - validate unknown JSON against ThemeToken schema
  - `parseCss()` - parse CSS with `:root` and `.dark` blocks into ThemeToken format
  - `THEME_TOKEN_SCHEMA_URL` constant
- **Blockchain Fetching**
  - `fetchThemeByOrigin()` - fetch a theme by its origin outpoint
  - `fetchPublishedThemes()` - fetch all published ThemeToken themes
  - `getRegistryUrl()` - get ShadCN registry URL for a theme
  - `getOrdfsUrl()` - get ORDFS content URL for a theme
- **Format Transformations**
  - `toShadcnRegistry()` - convert ThemeToken to ShadCN registry format
  - `toCss()` - convert ThemeToken to CSS string
  - `toJson()` - convert ThemeToken to JSON string
  - `createThemeToken()` - create a new ThemeToken with defaults
- **Runtime Application** (browser)
  - `applyTheme()` - apply theme styles to document root
  - `applyThemeMode()` - apply light or dark mode from a theme
  - `getCurrentTheme()` - read current theme from DOM CSS variables
  - `clearTheme()` - remove all theme CSS variables
  - `toggleThemeMode()` - toggle between light and dark mode
- **Types**
  - `ThemeToken`, `ThemeStyles`, `ThemeStyleProps`, `CssRules`
  - `ValidationResult`, `ParseResult`
  - `PublishedTheme`, `ShadcnRegistryItem`
