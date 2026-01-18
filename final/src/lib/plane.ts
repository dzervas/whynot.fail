import type { Loader } from "astro/loaders";
import type { PlanePostsLoaderOptions } from "./plane-types";
import { PlaneClient } from "./plane-client";
import { htmlToMarkdown } from "./plane-turndown";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

const DEFAULT_OUTPUT_DIR = "content/posts";

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

         const data = {
          title: item.name,
          date,
          tags,
          categories: category ? [category] : [],
          build_status: undefined,
          image: undefined,
          writer: "dzervas",
          description: item.description_stripped?.trim() || item.name,
        };

        const parsed = await parseData({
          id: slug,
          data,
        });

        const status = store.get(slug) ? "updated" : "downloaded";
        const rendered = await renderMarkdown(markdown);
        const digest = generateDigest({ data: parsed, markdown });

        store.set({ id: slug, data: parsed, body: markdown, rendered, digest });

        if (options.saveToDisk) {
          try {
            await savePostToDisk({
              slug,
              markdown,
              data,
              outputDir: options.outputDir,
            });
            logger.info(`[plane-posts-loader] saved ${slug} to disk`);
          } catch (error) {
            logger.error(`[plane-posts-loader] failed to save ${slug}: ${errorMsg(error)}`);
          }
        }

        logger.info(`[plane-posts-loader] ${status} post ${slug} from work item ${item.id}`);
      }
    },
  };
}

async function savePostToDisk({
  slug,
  markdown,
  data,
  outputDir,
}: {
  slug: string;
  markdown: string;
  data: {
    title: string;
    date: Date;
    tags: string[];
    categories: string[];
    build_status: string | undefined;
    image: string | undefined;
    writer: string;
    description: string;
  };
  outputDir?: string;
}): Promise<void> {
  const targetDir = outputDir ?? DEFAULT_OUTPUT_DIR;
  const safeSlug = slug.replace(/^\/|\/$/g, "");
  const filePath = join(targetDir, `${safeSlug}.md`);
  const frontmatter = buildFrontmatter(data);
  const contents = `${frontmatter}\n${markdown.trim()}\n`;
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

function buildFrontmatter(data: {
  title: string;
  date: Date;
  tags: string[];
  categories: string[];
  build_status: string | undefined;
  image: string | undefined;
  writer: string;
  description: string;
}): string {
  const lines = ["---"];
  lines.push(`title: ${escapeYaml(data.title)}`);
  lines.push(`date: ${data.date.toISOString()}`);

  if (data.description) {
    lines.push(`description: ${escapeYaml(data.description)}`);
  }

  lines.push("tags:");
  if (data.tags.length === 0) {
    lines.push("  - untagged");
  } else {
    data.tags.forEach((tag) => lines.push(`  - ${escapeYaml(tag)}`));
  }

  lines.push("categories:");
  if (data.categories.length === 0) {
    lines.push("  - uncategorized");
  } else {
    data.categories.forEach((category) => lines.push(`  - ${escapeYaml(category)}`));
  }

  if (data.build_status) {
    lines.push(`build_status: ${data.build_status}`);
  }

  if (data.image) {
    lines.push(`image: ${data.image}`);
  }

  lines.push(`writer: ${escapeYaml(data.writer)}`);
  lines.push("---");
  return lines.join("\n");
}

function escapeYaml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "\"\"";
  return trimmed.includes(":") || trimmed.includes("#") ? `"${trimmed.replace(/"/g, "\\\"")}"` : trimmed;
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
