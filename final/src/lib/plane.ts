import type { Loader } from "astro/loaders";
import TurndownService from "turndown";

type PlanePostsLoaderOptions = {
  apiBaseUrl: string;
  workspaceSlug: string;
  projectId: string;
  apiToken: string;
  localLoader?: Loader;
};

type WorkItemsResponse = {
  results?: WorkItem[];
  next_cursor?: string;
  next_page_results?: boolean;
};

type WorkItem = {
  id: string;
  type_id: string;
  name: string;
  description_html: string | null;
  description_stripped?: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  is_draft: boolean;
  labels: WorkItemLabel[];
};

type WorkItemLabel = {
  id: string;
  name: string;
};

type WorkItemProperty = {
  id: string;
  name: string;
};

type WorkItemPropertyValueEntry = {
  value?: unknown;
  values?: unknown;
};

export function planePostsLoader(options: PlanePostsLoaderOptions): Loader {
  return {
    name: "plane-posts-loader",
    async load(context) {
      const { logger, store, parseData, renderMarkdown, generateDigest } =
        context;

      if (options.localLoader) {
        await options.localLoader.load(context);
      }

      const missing = missingEnv(options);
      if (missing.length > 0) {
        logger.warn(
          `Plane loader disabled; missing ${missing.join(", ")}. Local posts remain available.`,
        );
        return;
      }

      let workItems: WorkItem[] = [];
      try {
        workItems = await fetchWorkItems(options);
      } catch (error) {
        logger.error(
          `Plane loader failed to list work items: ${errorMessage(error)}`,
        );
        return;
      }

      const typeId = firstTypeId(workItems);
      if (!typeId) {
        logger.error(
          "Plane loader could not determine a work item type_id to fetch custom properties.",
        );
        return;
      }

      const properties = await fetchWorkItemProperties(typeId, options).catch(
        (error) => {
          logger.error(
            `Plane loader failed to fetch work item properties: ${errorMessage(
              error,
            )}`,
          );
          return null;
        },
      );

      if (!properties) {
        return;
      }

      const slugProperty = properties.find(
        (property) => property.name.toLowerCase() === "slug",
      );

      if (!slugProperty) {
        logger.error("Plane loader could not find a custom property named Slug.");
        return;
      }

      const seenSlugs = new Set<string>();

      for (const item of workItems) {
        if (!item.completed_at || item.is_draft) {
          continue;
        }

        const rawSlug = await fetchSlugValue(
          item.id,
          slugProperty.id,
          options,
        )
          .then((value) => value?.trim() ?? "")
          .catch((error) => {
            logger.error(
              `Plane work item ${item.id} slug fetch failed: ${errorMessage(
                error,
              )}`,
            );
            return "";
          });

        if (!rawSlug) {
          logger.error(
            `Plane work item ${item.id} is missing slug custom property value.`,
          );
          continue;
        }

        const slug = normalizeSlug(rawSlug);
        if (!slug) {
          logger.error(`Plane work item ${item.id} has empty slug value.`);
          continue;
        }

        if (!isValidSlug(slug)) {
          logger.error(
            `Plane work item ${item.id} slug "${slug}" must include a category segment like "notes/hello".`,
          );
          continue;
        }

        if (seenSlugs.has(slug)) {
          logger.error(
            `Plane work item ${item.id} slug "${slug}" duplicates another Plane item. Skipping.`,
          );
          continue;
        }
        seenSlugs.add(slug);

        const description = item.description_html ?? "";
        const markdown = htmlToMarkdownFallback(description, item.name);

        const category = slug.split("/").filter(Boolean)[0] ?? "";
        const tags = item.labels.map((label) => label.name).filter(Boolean);

        const date = item.completed_at
          ? new Date(item.completed_at)
          : new Date(item.updated_at);
        if (Number.isNaN(date.valueOf())) {
          logger.error(
            `Plane work item ${item.id} has invalid date values. Skipping.`,
          );
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

        const existingEntry = await getStoreEntry(store, slug);
        const status = existingEntry ? "updated" : "downloaded";

        const rendered = await renderMarkdown(markdown);
        const digest = generateDigest({ data, markdown });
        store.set({
          id: slug,
          data,
          body: markdown,
          rendered,
          digest,
        });

        logger.info(
          `[plane-posts-loader] ${status} post ${slug} from work item ${item.id}`,
        );
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

function normalizeSlug(value: string): string {
  return value.replace(/^\/+/, "").trim();
}

function isValidSlug(slug: string): boolean {
  const parts = slug.split("/").filter(Boolean);
  return parts.length >= 2 && !parts.some((part) => /\s/.test(part));
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

async function fetchWorkItems(
  options: PlanePostsLoaderOptions,
): Promise<WorkItem[]> {
  const items: WorkItem[] = [];
  const base = ensureTrailingSlash(options.apiBaseUrl);
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  while (true) {
    const url = new URL(
      `v1/workspaces/${options.workspaceSlug}/projects/${options.projectId}/work-items/`,
      base,
    );
    url.searchParams.set("expand", "labels");
    if (cursor) {
      if (seenCursors.has(cursor)) {
        break;
      }
      seenCursors.add(cursor);
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetchJson<WorkItemsResponse>(url.toString(), {
      headers: {
        "x-api-key": options.apiToken,
      },
    });

    items.push(...(response.results ?? []));

    if (!response.next_page_results || !response.next_cursor) {
      break;
    }

    cursor = response.next_cursor;
  }

  return items;
}

function firstTypeId(workItems: WorkItem[]): string | null {
  for (const item of workItems) {
    if (item.type_id) {
      return item.type_id;
    }
  }
  return null;
}

async function fetchWorkItemProperties(
  typeId: string,
  options: PlanePostsLoaderOptions,
): Promise<WorkItemProperty[]> {
  const base = ensureTrailingSlash(options.apiBaseUrl);
  const url = new URL(
    `v1/workspaces/${options.workspaceSlug}/projects/${options.projectId}/work-item-types/${typeId}/work-item-properties/`,
    base,
  );

  return fetchJson<WorkItemProperty[]>(url.toString(), {
    headers: {
      "x-api-key": options.apiToken,
    },
  });
}

async function fetchSlugValue(
  workItemId: string,
  propertyId: string,
  options: PlanePostsLoaderOptions,
): Promise<string | null> {
  const base = ensureTrailingSlash(options.apiBaseUrl);
  const url = new URL(
    `v1/workspaces/${options.workspaceSlug}/projects/${options.projectId}/work-items/${workItemId}/work-item-properties/${propertyId}/values/`,
    base,
  );

  const response = await fetchJson<WorkItemPropertyValueEntry | WorkItemPropertyValueEntry[]>(
    url.toString(),
    {
      headers: {
        "x-api-key": options.apiToken,
      },
    },
  );

  const entry = Array.isArray(response) ? response[0] : response;
  if (!entry) {
    return null;
  }

  return extractValue(entry);
}

function extractValue(entry: WorkItemPropertyValueEntry): string | null {
  if (typeof entry.value !== "undefined") {
    return coerceValue(entry.value);
  }
  if (typeof entry.values !== "undefined") {
    return coerceValue(entry.values);
  }
  return null;
}

function coerceValue(value: unknown): string | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = coerceValue(entry);
      if (candidate) {
        return candidate;
      }
    }
  }
  return null;
}

function normalizeWhitespace(content: string): string {
  return content
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

async function getStoreEntry(store: {
  get: (id: string) => unknown;
}, id: string): Promise<unknown | null> {
  try {
    const entry = store.get(id);
    if (entry) {
      return entry as unknown;
    }
  } catch {
    return null;
  }

  return null;
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  service.addRule("callout", {
    filter: (node: Node) =>
      node.nodeType === 1 &&
      (node as Element).getAttribute("data-block-type") ===
        "callout-component",
    replacement: (content: string, node: Node) => {
      const element = node as Element;
      const background = element.getAttribute("data-background") ?? "";
      const calloutType = calloutTypeFromBackground(background);
      const safeContent = content.trim();
      const lines = safeContent.split("\n");
      const quoted = lines
        .map((line: string) => (line.trim() ? `> ${line}` : ">"))
        .join("\n");
      return `\n\n> [!${calloutType}]\n${quoted}\n\n`;
    },
  });

  service.addRule("lineBreak", {
    filter: "br",
    replacement: () => "  \n",
  });

  service.addRule("horizontalRule", {
    filter: (node: Node) => {
      if (node.nodeType !== 1) {
        return false;
      }
      const element = node as Element;
      return (
        element.getAttribute("data-type") === "horizontalRule" ||
        element.classList.contains("border-custom-border-400")
      );
    },
    replacement: () => "\n\n---\n\n",
  });

  service.addRule("fencedCode", {
    filter: (node: Node) => {
      if (node.nodeType !== 1) {
        return false;
      }
      const element = node as Element;
      return element.nodeName === "PRE" && !!element.querySelector("code");
    },
    replacement: (_content: string, node: Node) => {
      const code = (node as Element).querySelector("code");
      const text = code?.textContent ?? "";
      return `\n\n\`\`\`\n${text.replace(/\n+$/g, "")}\n\`\`\`\n`;
    },
  });

  return service;
}

function calloutTypeFromBackground(background: string): string {
  const normalized = background.trim().toLowerCase();
  if (normalized === "light-blue" || normalized === "blue") {
    return "INFO";
  }
  if (normalized === "peach") {
    return "DANGER";
  }
  if (normalized === "orange") {
    return "WARNING";
  }
  if (normalized === "gray") {
    return "NOTE";
  }
  if (normalized === "yellow" || normalized === "light-yellow") {
    return "WARNING";
  }
  if (normalized === "red" || normalized === "light-red") {
    return "DANGER";
  }
  if (normalized === "green" || normalized === "light-green") {
    return "NOTE";
  }
  return "NOTE";
}

function htmlToMarkdownFallback(html: string, title: string): string {
  if (!html) {
    return "";
  }

  const turndown = createTurndownService();
  const markdown = turndown.turndown(html);
  const cleaned = normalizeWhitespace(markdown);

  if (!cleaned) {
    return "";
  }

  return `# ${title}\n\n${cleaned}`.trim();
}



async function fetchJson<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
