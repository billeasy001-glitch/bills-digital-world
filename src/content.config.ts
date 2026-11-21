import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const common = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  date: z.coerce.date(),
  publishedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

export const collections = {
  projects: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/projects' }), schema: common }),
  blog: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/blog' }), schema: common }),
  tools: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
    schema: common.extend({ website: z.url().startsWith('https://') }),
  }),
};
