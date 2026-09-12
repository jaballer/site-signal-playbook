import { fileURLToPath } from "node:url";

/** The repository's /content folder. */
export const defaultContentDir = fileURLToPath(new URL("../../../content/", import.meta.url));

/** The repository's /dist folder, used for exports. */
export const defaultDistDir = fileURLToPath(new URL("../../../dist/", import.meta.url));
