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
	getCurrentTheme,
	clearTheme,
	toggleThemeMode,
} from "./apply";
