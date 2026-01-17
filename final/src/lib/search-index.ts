import { getCollection } from "astro:content";

export type SearchDocument = {
  title: string;
  description: string;
  tags: string[];
  category: string | null;
  slug: string;
  date: string;
};

export async function buildSearchIndex(): Promise<SearchDocument[]> {
  const posts = await getCollection("posts");

  return posts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((post) => ({
      title: post.data.title,
      description: post.data.description ?? "",
      tags: post.data.tags,
      category: post.data.categories[0] ?? null,
      slug: `/posts/${post.id}/`,
      date: post.data.date.toISOString(),
    }));
}
