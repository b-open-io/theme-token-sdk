/** The registry item type emitted for current ShadCN theme packages. */
export const THEME_REGISTRY_TYPE = "registry:theme" as const;

const COMPATIBLE_THEME_REGISTRY_TYPES = new Set<string>([
	THEME_REGISTRY_TYPE,
	// Previously published Theme Token records used this valid ShadCN type.
	"registry:style",
]);

/** Whether a MAP type identifies a Theme Token theme package. */
export function isThemeRegistryType(type: unknown): boolean {
	return typeof type === "string" && COMPATIBLE_THEME_REGISTRY_TYPES.has(type);
}
