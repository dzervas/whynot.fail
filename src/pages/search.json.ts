import type { APIRoute } from "astro";
import { buildSearchIndex } from "../lib/search-index";

export const GET: APIRoute = async () => {
  const data = await buildSearchIndex();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
