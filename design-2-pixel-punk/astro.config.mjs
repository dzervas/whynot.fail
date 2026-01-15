// @ts-check
import { defineConfig } from 'astro/config';
import remarkCallouts from './remark-callouts.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://whynot.fail',
  markdown: {
    remarkPlugins: [remarkCallouts],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
