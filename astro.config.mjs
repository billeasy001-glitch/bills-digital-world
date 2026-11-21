import { defineConfig } from 'astro/config';

// Individual Pages deployments can have a hash or branch prefix.
const deployment = new URL(process.env.CF_PAGES_URL || 'http://localhost:4321');
if (deployment.hostname.endsWith('.pages.dev')) {
  deployment.hostname = deployment.hostname.split('.').slice(-3).join('.');
}
const site = new URL(process.env.SITE_URL || deployment.origin).origin;
export default defineConfig({ site, output: 'static', trailingSlash: 'always' });
