import { defineConfig, defineCollection, s } from 'velite';

// Reusable schema for a single link
const linkSchema = s.object({
  label: s.string(),
  url: s.string(),
});

// -- Define Schemas for Individual Page Builder Blocks --

const heroBlockSchema = s.object({
  type: s.literal('hero'),
  headline: s.string(),
  subline: s.string().optional(),
});

const mediaBlockSchema = s.object({
  type: s.literal('media'),
  src: s.string(), // URL to image or video
  invert: s.boolean().default(false), // Corresponds to `data-op`
});

const projectRollBlockSchema = s.object({
  type: s.literal('projectRoll'),
  // This block has no data; it's a signal to render the project list.
});

// -- Union Schema for All Possible Blocks --
// This allows any page to be built from any combination of these blocks.
const blocksSchema = s.union([
  heroBlockSchema,
  mediaBlockSchema,
  projectRollBlockSchema,
  // Future blocks like 'textBlock', 'mediaGrid', etc., would be added here
]);

// -- Define Content Collections --

const globals = defineCollection({
  name: 'Globals',
  pattern: 'content/globals.json',
  single: true,
  schema: s.object({
    navLinks: s.array(linkSchema),
    footerText: s.string(),
  }),
});

const pages = defineCollection({
  name: 'Page',
  pattern: 'content/pages/**/*.md',
  schema: s.object({
    title: s.string(),
    slug: s.slug('global'),
    blocks: s.array(blocksSchema),
  }).transform(data => ({
    ...data,
    permalink: `/${data.slug}`
  }))
});

const projects = defineCollection({
  name: 'Project',
  pattern: 'content/projects/**/*.md',
  schema: s.object({
    title: s.string(),
    slug: s.slug('global'),
    date: s.string(),
    cover: s.string(), // URL to cover image/video
    tags: s.array(s.string()),
    blocks: s.array(blocksSchema), // Projects also use the block builder for their content
  }).transform(data => ({
    ...data,
    permalink: `/project/${data.slug}`
  }))
});

export default defineConfig({
  root: 'src/content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    clean: true,
  },
  collections: { globals, pages, projects },
});
