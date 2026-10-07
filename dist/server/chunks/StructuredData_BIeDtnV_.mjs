import "react";
import { jsx } from "react/jsx-runtime";
//#region components/StructuredData.tsx
/**
* Injects valid Schema.org JSON-LD structured data into the page head safely
*/
function StructuredData({ data }) {
	if (!data) return null;
	return /* @__PURE__ */ jsx("script", {
		type: "application/ld+json",
		dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") }
	});
}
//#endregion
export { StructuredData as t };
