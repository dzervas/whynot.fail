import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { planePostsLoader } from "../lib/plane";

const posts = defineCollection({
  loader: planePostsLoader({
    apiBaseUrl: String(import.meta.env["PLANE_API_BASE_URL"] ?? ""),
    workspaceSlug: String(import.meta.env["PLANE_WORKSPACE_SLUG"] ?? ""),
    projectId: String(import.meta.env["PLANE_PROJECT_ID"] ?? ""),
    apiToken: String(import.meta.env["PLANE_API_TOKEN"] ?? ""),
    localLoader: glob({ pattern: "**/*.md", base: "content/posts" }),
    saveToDisk: true,
    outputDir: "content/posts",
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    build_status: z.enum(["passing", "failing", "unknown"]).optional(),
    image: z.string().optional(),
    writer: z.string().default("dzervas"),
    description: z.string().optional(),
  }),
});

export const collections = { posts };
