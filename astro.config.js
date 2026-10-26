import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.blessed.cafe',
  // Astro 7 defaults to 'jsx' whitespace stripping, which glues inline words together.
  compressHTML: true,
  // Every stylesheet as a file, so the CSP can keep style-src 'self'.
  build: { inlineStylesheets: 'never' },
  // Same for scripts: Astro inlines small ones below this limit, which the CSP would block.
  vite: { build: { assetsInlineLimit: 0 } },
  server: { port: 3001, host: true },
  devToolbar: { enabled: false },
});
