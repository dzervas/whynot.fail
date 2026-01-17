import type { Loader } from "astro/loaders";

export type PlanePostsLoaderOptions = {
  apiBaseUrl: string;
  workspaceSlug: string;
  projectId: string;
  apiToken: string;
  localLoader?: Loader;
};

export type WorkItemsResponse = {
  results?: WorkItem[];
  next_cursor?: string;
  next_page_results?: boolean;
};

export type WorkItem = {
  id: string;
  type_id: string;
  name: string;
  description_html: string | null;
  description_stripped?: string | null;
  updated_at: string;
  completed_at: string | null;
  is_draft: boolean;
  labels: WorkItemLabel[];
};

export type WorkItemLabel = {
  id: string;
  name: string;
};

export type WorkItemProperty = {
  id: string;
  name: string;
};

export type WorkItemPropertyValue = {
  value?: unknown;
  values?: unknown;
};
