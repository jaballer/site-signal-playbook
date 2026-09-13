import type { Page } from "playwright-core";

export type Prep = (page: Page) => Promise<void>;
export type Shot = { name: string; path: string; prep?: Prep };
export type Variant = {
  name: string;
  viewport: { width: number; height: number };
  colorScheme: "light" | "dark";
  /** A theme saved by the theme toggle, overriding the OS setting. */
  theme?: "light" | "dark";
  shots: Shot[];
};

const desktop = { width: 1280, height: 900 };
const mobile = { width: 375, height: 812 };
const itemCollections = ["questions", "plays", "audit", "diagnostics", "signals", "glossary"];
const foldPages = ["/questions/", "/audit/", "/plays/", "/diagnostics/"];

export const slug = (path: string) =>
  path === "/" ? "home" : path.replace(/^\/|\/$/g, "").replaceAll("/", "__");

const openFolds: Prep = async (page) => {
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
};

const hover =
  (selector: string): Prep =>
  (page) =>
    page.hover(selector);

/** Presses Tab until `selector` has focus, so :focus-visible styles show. */
const tabTo =
  (selector: string): Prep =>
  async (page) => {
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return;
    }
    throw new Error(`Tab never reached ${selector}`);
  };

/**
 * Chapter pages plus the first item page of each collection: enough to cover every template.
 */
export function representativePages(pages: string[]): string[] {
  const depth = (p: string) => p.split("/").filter(Boolean).length;
  const chapters = pages.filter((p) => depth(p) <= 1);
  const firstItems = itemCollections
    .map((c) => pages.find((p) => p.startsWith(`/${c}/`) && depth(p) === 2))
    .filter((p): p is string => Boolean(p));
  return [...chapters, ...firstItems];
}

export function planVariants(pages: string[], { quick }: { quick: boolean }): Variant[] {
  const reps = representativePages(pages);
  const main = quick ? reps : pages;
  const each = (list: string[], prep?: Prep): Shot[] =>
    list.filter((p) => pages.includes(p)).map((path) => ({ name: slug(path), path, prep }));

  return [
    { name: "desktop-light", viewport: desktop, colorScheme: "light", shots: each(main) },
    { name: "desktop-dark", viewport: desktop, colorScheme: "dark", shots: each(main) },
    { name: "mobile-light", viewport: mobile, colorScheme: "light", shots: each(main) },
    { name: "mobile-dark", viewport: mobile, colorScheme: "dark", shots: each(main) },
    {
      name: "toggle-light-on-dark-os",
      viewport: desktop,
      colorScheme: "dark",
      theme: "light",
      shots: each(reps),
    },
    {
      name: "toggle-dark-on-light-os",
      viewport: desktop,
      colorScheme: "light",
      theme: "dark",
      shots: each(reps),
    },
    {
      name: "toggle-dark-mobile",
      viewport: mobile,
      colorScheme: "light",
      theme: "dark",
      shots: each(reps),
    },
    {
      name: "open-folds-light",
      viewport: desktop,
      colorScheme: "light",
      shots: each(foldPages, openFolds),
    },
    {
      name: "open-folds-dark",
      viewport: desktop,
      colorScheme: "dark",
      shots: each(foldPages, openFolds),
    },
    {
      name: "open-folds-mobile",
      viewport: mobile,
      colorScheme: "light",
      shots: each(foldPages, openFolds),
    },
    {
      name: "states",
      viewport: desktop,
      colorScheme: "light",
      shots: [
        { name: "hover-card", path: "/signals/", prep: hover(".card") },
        { name: "hover-nav-link", path: "/", prep: hover("nav.side .links a:not([aria-current])") },
        { name: "hover-pill-link", path: "/questions/search-value/", prep: hover("a.pill") },
        { name: "focus-fold", path: "/questions/", prep: tabTo(".fold > summary") },
        { name: "focus-phase", path: "/engagement/", prep: tabTo(".phases button") },
        { name: "focus-filter", path: "/signals/", prep: tabTo(".filters button") },
        { name: "focus-theme", path: "/glossary/", prep: tabTo("nav.side .theme-btn") },
        { name: "focus-copy", path: "/questions/search-value/", prep: tabTo(".copy") },
        { name: "focus-card", path: "/signals/", prep: tabTo(".card") },
      ].filter((shot) => pages.includes(shot.path)),
    },
  ];
}
