/** @type {import('tailwindcss').Config} */

/**
 * Returns a list of fallback fonts
 * @param fontVar - The font variable to use as the first fallback
 */
function withFallbackFonts(fontVar: string) {
	return [
		fontVar,
		"-apple-system",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Roboto",
		"Helvetica",
		"Arial",
		"sans-serif",
		"Apple Color Emoji",
		"Segoe UI Emoji",
		"Segoe UI Symbol",
	];
}

export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				display: withFallbackFonts("var(--font-gramatika)"),
			},
		},
	},
	plugins: [],
};
