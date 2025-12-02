# Changelog

All notable changes to this project will be documented in this file.

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
