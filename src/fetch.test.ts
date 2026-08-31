import { afterEach, describe, expect, it } from "bun:test";
import { fetchThemeByOrigin, getOrdfsUrl, getRegistryUrl } from "./fetch";
import { createThemeToken } from "./transform";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("theme fetching", () => {
	it("normalizes public URL suffixes and outpoint separators", () => {
		expect(getOrdfsUrl("https://themetoken.dev/r/themes/abc.0.json")).toBe(
			"https://api.1sat.app/content/abc_0",
		);
		expect(getRegistryUrl("abc_0.json")).toBe(
			"https://themetoken.dev/r/themes/abc_0",
		);
	});

	it("loads the packaged theme.json before the legacy direct inscription", async () => {
		const theme = createThemeToken("Packaged", {});
		const requests: string[] = [];
		globalThis.fetch = (async (input) => {
			requests.push(String(input));
			return new Response(JSON.stringify(theme), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}) as typeof fetch;

		const result = await fetchThemeByOrigin("abc_0.json");
		expect(result?.theme.name).toBe("Packaged");
		expect(requests).toEqual(["https://api.1sat.app/content/abc_0/theme.json"]);
	});
});
