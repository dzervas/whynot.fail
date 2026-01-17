import type { Loader } from "astro/loaders";
import type { PlanePostsLoaderOptions } from "./plane-types";
import { PlaneClient } from "./plane-client";
import { htmlToMarkdown } from "./plane-turndown";

export function planePostsLoader(options: PlanePostsLoaderOptions): Loader {
  return {
    name: "plane-posts-loader",
    async load(context) {
      const { logger, store, parseData, renderMarkdown, generateDigest } = context;

      if (options.localLoader) {
        await options.localLoader.load(context);
      }

      const missing = missingEnv(options);
      if (missing.length > 0) {
        logger.warn(`Plane loader disabled; missing ${missing.join(", ")}. Local posts remain available.`);
        return;
      }

      const client = new PlaneClient(options.apiBaseUrl, options.workspaceSlug, options.projectId, options.apiToken);

      let workItems;
      try {
        workItems = await client.fetchWorkItems();
      } catch (error) {
        logger.error(`Plane loader failed to list work items: ${errorMsg(error)}`);
        return;
      }

      const typeId = workItems.find((item) => item.type_id)?.type_id;
      if (!typeId) {
        logger.error("Plane loader could not determine a work item type_id to fetch custom properties.");
        return;
      }

      let slugPropertyId;
      try {
        slugPropertyId = await client.fetchSlugPropertyId(typeId);
      } catch (error) {
        logger.error(`Plane loader failed to fetch work item properties: ${errorMsg(error)}`);
        return;
      }

      if (!slugPropertyId) {
        logger.error("Plane loader could not find a custom property named Slug.");
        return;
      }

      const seenSlugs = new Set<string>();

      for (const item of workItems) {
        if (!item.completed_at || item.is_draft) continue;

        let rawSlug: string;
        try {
          rawSlug = (await client.fetchSlugValue(item.id, slugPropertyId))?.trim() ?? "";
        } catch (error) {
          logger.error(`Plane work item ${item.id} slug fetch failed: ${errorMsg(error)}`);
          continue;
        }

        const slug = rawSlug.replace(/^\/+/, "").trim();
        if (!slug) {
          logger.error(`Plane work item ${item.id} is missing or has empty slug value.`);
          continue;
        }

        if (!isValidSlug(slug)) {
          logger.error(`Plane work item ${item.id} slug "${slug}" must include a category segment like "notes/hello".`);
          continue;
        }

        if (seenSlugs.has(slug)) {
          logger.error(`Plane work item ${item.id} slug "${slug}" duplicates another Plane item. Skipping.`);
          continue;
        }
        seenSlugs.add(slug);

        const markdown = htmlToMarkdown(item.description_html ?? "", item.name);
        const category = slug.split("/").filter(Boolean)[0] ?? "";
        const tags = item.labels.map((l) => l.name).filter(Boolean);

        const date = new Date(item.completed_at ?? item.updated_at);
        if (Number.isNaN(date.valueOf())) {
          logger.error(`Plane work item ${item.id} has invalid date values. Skipping.`);
          continue;
        }

        const data = await parseData({
          id: slug,
          data: {
            title: item.name,
            date,
            tags,
            categories: category ? [category] : [],
            build_status: undefined,
            image: undefined,
            writer: "dzervas",
            description: item.description_stripped?.trim() || item.name,
          },
        });

        const status = store.get(slug) ? "updated" : "downloaded";
        const rendered = await renderMarkdown(markdown);
        const digest = generateDigest({ data, markdown });

        store.set({ id: slug, data, body: markdown, rendered, digest });
        logger.info(`[plane-posts-loader] ${status} post ${slug} from work item ${item.id}`);
      }
    },
  };
}

function missingEnv(options: PlanePostsLoaderOptions): string[] {
  const missing: string[] = [];
  if (!options.apiBaseUrl) missing.push("PLANE_API_BASE_URL");
  if (!options.workspaceSlug) missing.push("PLANE_WORKSPACE_SLUG");
  if (!options.projectId) missing.push("PLANE_PROJECT_ID");
  if (!options.apiToken) missing.push("API_TOKEN");
  return missing;
}

function isValidSlug(slug: string): boolean {
  const parts = slug.split("/").filter(Boolean);
  return parts.length >= 2 && !parts.some((p) => /\s/.test(p));
}

function errorMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
