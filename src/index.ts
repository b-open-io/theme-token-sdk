/**
 * @theme-token/sdk
 *
 * TypeScript SDK for Theme Token - validate, fetch, convert, and apply
 * ShadCN-compatible themes from the Bitcoin blockchain.
 *
 * @packageDocumentation
 */

// Schema & Validation
export {
	// Schemas
	themeTokenSchema,
	themeStylesSchema,
	themeStylePropsSchema,
	cssRulesSchema,
	// Constants
	THEME_TOKEN_SCHEMA_URL,
	// Validation
	validateThemeToken,
	parseCss,
	// Types
	type ThemeToken,
	type ThemeStyles,
	type ThemeStyleProps,
	type CssRules,
	type ValidationResult,
	type ParseResult,
	type ParseMetadata,
} from "./schema";

// Blockchain Fetching
export {
	fetchThemeByOrigin,
	fetchPublishedThemes,
	getRegistryUrl,
	getOrdfsUrl,
	type PublishedTheme,
} from "./fetch";

// Format Transformations
export {
	toShadcnRegistry,
	toCss,
	toJson,
	createThemeToken,
	toTailwindConfig,
	toShadcnCliCommand,
	getThemeRegistryUrl,
	type ShadcnRegistryItem,
} from "./transform";

// Runtime Application (browser only)
export {
	applyTheme,
	applyThemeMode,
	applyThemeWithAssets,
	applyThemeModeWithAssets,
	getCurrentTheme,
	clearTheme,
	toggleThemeMode,
} from "./apply";

// On-Chain Asset Loading (browser only)
export {
	// Path utilities
	isOnChainPath,
	extractOrigin,
	getContentUrl,
	// Font loading
	loadFontByOrigin,
	isFontLoaded,
	getCachedFont,
	clearFontCache,
	// Pattern/Image loading
	loadPatternByOrigin,
	isPatternLoaded,
	clearPatternCache,
	// Theme asset loading
	loadThemeAssets,
	// Types
	type LoadedFont,
} from "./assets";
