# Changelog

All notable changes to this project will be documented in this file.

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
