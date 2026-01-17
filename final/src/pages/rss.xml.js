import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = await getCollection("posts");

  return rss({
    title: "WhyNot.Fail",
    description: "Cause when you fail, somebody has to laugh at you",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? "",
      link: `/posts/${post.id}/`,
      categories: [...post.data.tags, ...post.data.categories],
    })),
  });
}
