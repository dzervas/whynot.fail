import type lunr from "lunr";
import { SEARCH_CONFIG } from "../lib/search-config";

type SearchDocument = {
  title: string;
  description: string;
  tags: string[];
  category: string | null;
  slug: string;
  date: string;
};

type LunrStatic = typeof lunr;

declare global {
  interface Window {
    lunr?: LunrStatic;
  }
}

const overlay = document.querySelector<HTMLElement>("[data-search-overlay]");
const results = document.querySelector<HTMLElement>("[data-search-results]");
const input = document.querySelector<HTMLInputElement>("[data-search-input]");
const closeButtons = document.querySelectorAll<HTMLElement>("[data-search-close]");
const trigger = document.querySelector<HTMLElement>("[data-search-trigger]");

if (overlay) {
  overlay.hidden = true;
}

let index: lunr.Index | null = null;
let documents: SearchDocument[] = [];
let lunrLib: LunrStatic | null = null;
let activeIndex = -1;

const loadLunrFromCdn = () =>
  new Promise<LunrStatic>((resolve, reject) => {
    if (window.lunr) {
      resolve(window.lunr);
      return;
    }

    const script = document.createElement("script");
    script.src = SEARCH_CONFIG.cdnUrl;
    script.async = true;
    script.onload = () => {
      if (window.lunr) {
        resolve(window.lunr);
      } else {
        reject(new Error("Lunr CDN loaded without window.lunr"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Lunr CDN"));
    document.head.appendChild(script);
  });

const loadLunr = async () => {
  if (lunrLib) return lunrLib;

  if (SEARCH_CONFIG.useCdn) {
    lunrLib = await loadLunrFromCdn();
    return lunrLib;
  }

  const mod = await import("lunr");
  lunrLib = mod.default as LunrStatic;
  return lunrLib;
};

const toResultsMarkup = (items: SearchDocument[]) => {
  if (items.length === 0) {
    return '<p class="search-empty">No matches. Try a different incantation.</p>';
  }

  const slice = items.length > 10 ? items.slice(0, 10) : items;

  return slice
    .map((item, index) => {
      const tags = item.tags
        .slice(0, 3)
        .map((tag) => `<span class="search-tag">${tag}</span>`)
        .join("");

      const isActive = index === activeIndex;

      return `
        <a class="search-item${isActive ? " is-active" : ""}" data-search-item href="${item.slug}">
          <span class="search-title">${item.title}</span>
          <span class="search-description">${item.description}</span>
          <span class="search-tags">${tags}</span>
        </a>
      `;
    })
    .join("");
};

const openOverlay = () => {
  if (!overlay || !input) return;
  overlay.hidden = false;
  document.body.classList.add("search-open");
  input.value = "";
  activeIndex = -1;
  if (results) {
    results.innerHTML =
      '<p class="search-empty">Type something and hit Enter. Or just panic.</p>';
  }
  window.setTimeout(() => input.focus(), 0);
};

const closeOverlay = () => {
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove("search-open");
};

const ensureIndex = async () => {
  if (index) return;
  const response = await fetch("/search.json");
  documents = await response.json();

  const lunrInstance = await loadLunr();
  index = lunrInstance(function (this: lunr.Builder) {
    this.ref("slug");
    this.field("title");
    this.field("description");
    this.field("tags");
    this.field("category");

    documents.forEach((doc) => this.add(doc));
  });
};

const runSearch = async (term: string) => {
  if (!results) return [];
  await ensureIndex();
  if (!index) return [];

  const matches = index.search(term).slice(0, 25);
  const mapped = matches
    .map((match: lunr.Index.Result) =>
      documents.find((doc) => doc.slug === match.ref)
    )
    .filter((doc): doc is SearchDocument => Boolean(doc));

  results.innerHTML = toResultsMarkup(mapped);
  return mapped;
};

const updateActiveItem = (direction: 1 | -1) => {
  if (!results) return;
  const items = Array.from(results.querySelectorAll<HTMLElement>("[data-search-item]"));
  if (items.length === 0) return;

  activeIndex = (activeIndex + direction + items.length) % items.length;
  items.forEach((item, idx) => {
    item.classList.toggle("is-active", idx === activeIndex);
  });

  items[activeIndex].scrollIntoView({ block: "nearest" });
};

const activateCurrent = () => {
  if (!results) return;
  const items = Array.from(results.querySelectorAll<HTMLElement>("[data-search-item]"));
  if (items.length === 0 || activeIndex < 0) return;
  items[activeIndex].click();
};

const handleKeydown = (event: KeyboardEvent) => {
  const isCmd = event.metaKey || event.ctrlKey;
  if (isCmd && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openOverlay();
    return;
  }

  if (event.key === "Escape") {
    closeOverlay();
    return;
  }

  if (!overlay || overlay.hidden) return;

  if (event.key === "ArrowDown" || event.key.toLowerCase() === "j") {
    event.preventDefault();
    updateActiveItem(1);
  }

  if (event.key === "ArrowUp" || event.key.toLowerCase() === "k") {
    event.preventDefault();
    updateActiveItem(-1);
  }

  if (event.key === "Enter") {
    event.preventDefault();
    activateCurrent();
  }
};

if (input) {
  input.addEventListener("input", (event) => {
    const value = (event.target as HTMLInputElement).value.trim();
    if (value.length === 0) {
      activeIndex = -1;
      if (results) {
        results.innerHTML =
          '<p class="search-empty">Type something and hit Enter. Or just panic.</p>';
      }
      return;
    }

    runSearch(value).then(() => {
      activeIndex = -1;
      if (results) {
        const items = results.querySelectorAll("[data-search-item]");
        items.forEach((item) => item.classList.remove("is-active"));
      }
    });
  });
}

closeButtons.forEach((btn) => btn.addEventListener("click", closeOverlay));
trigger?.addEventListener("click", openOverlay);

document.addEventListener("keydown", handleKeydown);

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  if (target.matches("[data-search-close]") || target.closest("[data-search-close]")) {
    closeOverlay();
  }
});

const root = document.documentElement;
root.classList.add("js-enabled");
