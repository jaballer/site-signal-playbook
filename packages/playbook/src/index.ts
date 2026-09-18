export * from "./schema.ts";
export { effortLabel, firstSignalLabel, ownerLabel, titleOf, type AnyEntry } from "./entries.ts";
export { loadPlaybook, PlaybookError } from "./load.ts";
export { linksTo, resolveLinks } from "./links.ts";
// Repository paths are a separate export (`@site-signal/playbook/paths`) because they rely on
// import.meta.url, which bundlers rewrite. Bundled consumers pass the content folder explicitly.
