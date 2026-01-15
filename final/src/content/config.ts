import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    build_status: z.enum(["passing", "failing", "unknown"]).optional(),
    image: z.string().optional(),
    writer: z.string().default("dzervas"),
    description: z.string().optional(),
  }),
});

export const collections = { posts };
