import { describe, expect, it } from "bun:test";
import { THEME_REGISTRY_TYPE, isThemeRegistryType } from "./registry";

describe("theme registry metadata", () => {
	it("uses the current ShadCN theme type", () => {
		expect(THEME_REGISTRY_TYPE).toBe("registry:theme");
		expect(isThemeRegistryType("registry:theme")).toBe(true);
	});

	it("recognizes previously published theme metadata", () => {
		expect(isThemeRegistryType("registry:style")).toBe(true);
	});

	it("rejects unrelated and missing types", () => {
		expect(isThemeRegistryType("registry:file")).toBe(false);
		expect(isThemeRegistryType(undefined)).toBe(false);
	});
});
