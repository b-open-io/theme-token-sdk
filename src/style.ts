import type { ThemeStyleProps } from "./schema";

const SHADOW_DEFAULTS = {
	"shadow-color": "hsl(0 0% 0%)",
	"shadow-opacity": "0.1",
	"shadow-blur": "3px",
	"shadow-spread": "0px",
	"shadow-offset-x": "0",
	"shadow-offset-y": "1px",
} as const;

/** Map Theme Token's legacy authoring names to their public CSS names. */
export function toCssVariableName(key: string): string {
	if (key === "letter-spacing") return "tracking-normal";
	if (key === "shadow-offset-x") return "shadow-x";
	if (key === "shadow-offset-y") return "shadow-y";
	return key;
}

function withOpacity(color: string, opacity: number): string {
	const hsl = color.match(/^hsl\((.+?)(?:\s*\/\s*[^)]+)?\)$/i);
	if (hsl) return `hsl(${hsl[1].trim()} / ${opacity.toFixed(2)})`;

	const percentage = Number((opacity * 100).toFixed(4));
	return `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
}

/** Build the shadow utility scale used by current TweakCN theme exports. */
export function getShadowScale(
	styles: Partial<ThemeStyleProps>,
): Record<string, string> {
	const color = styles["shadow-color"] || SHADOW_DEFAULTS["shadow-color"];
	const opacityValue = Number.parseFloat(
		styles["shadow-opacity"] || SHADOW_DEFAULTS["shadow-opacity"],
	);
	const opacity = Number.isFinite(opacityValue) ? opacityValue : 0.1;
	const blur = styles["shadow-blur"] || SHADOW_DEFAULTS["shadow-blur"];
	const spread = styles["shadow-spread"] || SHADOW_DEFAULTS["shadow-spread"];
	const offsetX =
		styles["shadow-offset-x"] || SHADOW_DEFAULTS["shadow-offset-x"];
	const offsetY =
		styles["shadow-offset-y"] || SHADOW_DEFAULTS["shadow-offset-y"];
	const spreadValue = Number.parseFloat(spread);
	const secondSpread = `${(Number.isFinite(spreadValue) ? spreadValue : 0) - 1}px`;
	const firstLayer = (multiplier: number) =>
		`${offsetX} ${offsetY} ${blur} ${spread} ${withOpacity(color, opacity * multiplier)}`;
	const secondLayer = (y: string, layerBlur: string) =>
		`${offsetX} ${y} ${layerBlur} ${secondSpread} ${withOpacity(color, opacity)}`;

	return {
		"shadow-2xs": firstLayer(0.5),
		"shadow-xs": firstLayer(0.5),
		"shadow-sm": `${firstLayer(1)}, ${secondLayer("1px", "2px")}`,
		shadow: `${firstLayer(1)}, ${secondLayer("1px", "2px")}`,
		"shadow-md": `${firstLayer(1)}, ${secondLayer("2px", "4px")}`,
		"shadow-lg": `${firstLayer(1)}, ${secondLayer("4px", "6px")}`,
		"shadow-xl": `${firstLayer(1)}, ${secondLayer("8px", "10px")}`,
		"shadow-2xl": firstLayer(2.5),
	};
}
