import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: {
    inlineStylesheets: 'always',
  },
  site: 'https://davisk.dev',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
