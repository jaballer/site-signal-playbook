import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

const contentDir = fileURLToPath(new URL("../../content/", import.meta.url));
const playbookModule = fileURLToPath(new URL("./src/lib/playbook.ts", import.meta.url));

/**
 * Content lives outside the app, so Vite doesn't see it by default. Watch it, and treat any
 * change as a change to the playbook loader so pages and route lists refresh.
 */
function watchContent() {
  return {
    name: "site-signal:watch-content",
    configureServer(server) {
      server.watcher.add(contentDir);
      const refresh = (file) => {
        if (file.startsWith(contentDir)) server.watcher.emit("change", playbookModule);
      };
      for (const event of ["add", "change", "unlink"]) server.watcher.on(event, refresh);
    },
  };
}

/**
 * `astro build` and `astro dev` would otherwise share Vite's dependency cache. A build writes
 * production React into it, which breaks every React component in dev with
 * "_jsxDEV is not a function". Builds get their own cache folder.
 */
const isBuild = process.argv.includes("build");

export default defineConfig({
  integrations: [react()],
  vite: {
    cacheDir: isBuild ? "./node_modules/.vite-build/" : "./node_modules/.vite/",
    define: { __PLAYBOOK_CONTENT_DIR__: JSON.stringify(contentDir) },
    plugins: [watchContent()],
  },
});
