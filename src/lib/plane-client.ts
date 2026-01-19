import type { WorkItem, WorkItemsResponse, WorkItemProperty, WorkItemPropertyValue } from "./plane-types";

export class PlaneClient {
  private baseUrl: string;

  constructor(
    baseUrl: string,
    private workspaceSlug: string,
    private projectId: string,
    private apiToken: string,
  ) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }

  async fetchWorkItems(): Promise<WorkItem[]> {
    const items: WorkItem[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | null = null;

    while (true) {
      const params = new URLSearchParams({ expand: "labels" });
      if (cursor) {
        if (seenCursors.has(cursor)) break;
        seenCursors.add(cursor);
        params.set("cursor", cursor);
      }

      const path = `v1/workspaces/${this.workspaceSlug}/projects/${this.projectId}/work-items/?${params}`;
      const response = await this.fetch<WorkItemsResponse>(path);
      items.push(...(response.results ?? []));

      if (!response.next_page_results || !response.next_cursor) break;
      cursor = response.next_cursor;
    }

    return items;
  }

  async fetchSlugPropertyId(typeId: string): Promise<string | null> {
    const path = `v1/workspaces/${this.workspaceSlug}/projects/${this.projectId}/work-item-types/${typeId}/work-item-properties/`;
    const properties = await this.fetch<WorkItemProperty[]>(path);
    const slugProp = properties.find((p) => p.name.toLowerCase() === "slug");
    return slugProp?.id ?? null;
  }

  async fetchSlugValue(workItemId: string, propertyId: string): Promise<string | null> {
    const path = `v1/workspaces/${this.workspaceSlug}/projects/${this.projectId}/work-items/${workItemId}/work-item-properties/${propertyId}/values/`;
    const response = await this.fetch<WorkItemPropertyValue | WorkItemPropertyValue[]>(path);
    const entry = Array.isArray(response) ? response[0] : response;
    return entry ? this.coerceValue(entry.value ?? entry.values) : null;
  }

  private coerceValue(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      for (const v of value) {
        const result = this.coerceValue(v);
        if (result) return result;
      }
    }
    return null;
  }

  private async fetch<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { "x-api-key": this.apiToken },
    });
    if (!response.ok) {
      throw new Error(`Plane API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
