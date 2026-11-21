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
  return rows.filter(row => !row.data.draft).sort((a, b) => {
    const publishedA = (a.data.publishedAt ?? a.data.date).valueOf();
    const publishedB = (b.data.publishedAt ?? b.data.date).valueOf();
    return publishedB - publishedA || a.id.localeCompare(b.id, 'en');
  });
}
export const github = 'https://github.com/billeasy001-glitch/bills-digital-world';
export const dateLabel = (date: Date, publishedAt?: Date) => {
  if (!publishedAt) return date.toISOString().slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(publishedAt);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second} UTC+8`;
};
