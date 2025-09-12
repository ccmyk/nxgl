import { defineConfig, defineCollection, s } from 'velite';

const projects = defineCollection({
  name: 'projects',
  pattern: 'content/projects/*.md',
  schema: s.object({
    title: s.string(),
    slug: s.string(),
    cover: s.string(),      // url to image/video
    media: s.array(s.string()),
    date: s.string(),
    tags: s.array(s.string()).optional()
  })
});

export default defineConfig({
  root: process.cwd(),
  collections: { projects }
});