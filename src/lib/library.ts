import { getCollection } from 'astro:content';

export const sections = {
  projects: { label: '项目', en: 'Projects', description: '从个人门户到本地经营，记录每个项目要解决的问题和具体做法。' },
  blog: { label: '博客与教程', en: 'Field notes', description: '把一次具体的实践写清楚，留下可以复用的步骤。' },
  tools: { label: 'AI 工具箱', en: 'Toolkit', description: '按任务选择工具，从整理资料、起草文章到检查改动。' },
} as const;

export type Section = keyof typeof sections;
export const sectionKeys = Object.keys(sections) as Section[];
export async function entries(section: Section) {
  const rows = await getCollection(section);
  return rows.filter(row => !row.data.draft).sort((a, b) =>
    b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id, 'en'));
}
export const github = 'https://github.com/billeasy001-glitch/bills-digital-world';
export const dateLabel = (date: Date) => date.toISOString().slice(0, 10);
