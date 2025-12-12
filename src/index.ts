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
	bundleAssetSchema,
	bundleSchema,
	generationMetaSchema,
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
	type BundleAsset,
	type ThemeBundle,
	type GenerationMeta,
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

// Asset Loading (browser only)
export {
	// Path utilities
	isOnChainPath,
	extractOrigin,
	getContentUrl,
	// Google Fonts
	GOOGLE_FONTS_CATALOG,
	extractFontFamily,
	isGoogleFont,
	getGoogleFontInfo,
	buildGoogleFontUrl,
	loadGoogleFont,
	isGoogleFontLoaded,
	// On-chain font loading
	loadFontByOrigin,
	isFontLoaded,
	getCachedFont,
	clearFontCache,
	// Pattern/Image loading
	loadPatternByOrigin,
	isPatternLoaded,
	clearPatternCache,
	// Theme asset loading (handles both Google and on-chain)
	loadThemeAssets,
	// Types
	type LoadedFont,
} from "./assets";
