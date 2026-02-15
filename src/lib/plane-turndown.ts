import TurndownService from "turndown";

const CALLOUT_MAP: Record<string, string> = {
  blue: "INFO",
  "light-blue": "INFO",
  peach: "DANGER",
  red: "DANGER",
  "light-red": "DANGER",
  orange: "WARNING",
  yellow: "WARNING",
  "light-yellow": "WARNING",
  gray: "NOTE",
  green: "NOTE",
  "light-green": "NOTE",
};

export function htmlToMarkdown(html: string, title: string): string {
  if (!html) return "";

  const service = createTurndownService();
  const markdown = service.turndown(html);
  const cleaned = markdown.replace(/\n{3,}/g, "\n\n").replace(/\n\s+\n/g, "\n\n").trim();
  if (!cleaned) return "";

  const withoutDuplicateHeading = stripLeadingHeading(cleaned, title);
  return withoutDuplicateHeading;
}

function stripLeadingHeading(markdown: string, title: string): string {
  const leadingHeading = markdown.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*(?:\n+|$)/);
  if (!leadingHeading) return markdown;

  const headingText = normalizeHeading(leadingHeading[1] ?? "");
  const normalizedTitle = normalizeHeading(title);
  if (!headingText || headingText !== normalizedTitle) return markdown;

  return markdown.slice(leadingHeading[0].length).trim();
}

function normalizeHeading(text: string): string {
  return text.replace(/\\/g, "").replace(/`/g, "").trim().toLowerCase();
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    // Handle empty elements like Plane's horizontal rule divs
    blankReplacement: (_content, node) => {
      const el = node as Element;
      if (el.tagName === "DIV" && el.getAttribute("data-type") === "horizontalRule") {
        return "\n\n---\n\n";
      }
      return "";
    },
  });

  service.addRule("callout", {
    filter: (node) =>
      node.nodeType === 1 &&
      (node as Element).getAttribute("data-block-type") === "callout-component",
    replacement: (content, node) => {
      const bg = ((node as Element).getAttribute("data-background") ?? "").trim().toLowerCase();
      const type = CALLOUT_MAP[bg] ?? "NOTE";
      const quoted = content
        .trim()
        .split("\n")
        .map((line) => (line.trim() ? `> ${line}` : ">"))
        .join("\n");
      return `\n\n> [!${type}]\n${quoted}\n\n`;
    },
  });

  service.addRule("lineBreak", {
    filter: "br",
    replacement: () => "  \n",
  });

  service.addRule("fencedCode", {
    filter: (node) =>
      node.nodeType === 1 && node.nodeName === "PRE" && !!(node as Element).querySelector("code"),
    replacement: (_, node) => {
      const text = (node as Element).querySelector("code")?.textContent ?? "";
      return `\n\n\`\`\`\n${text.replace(/\n+$/g, "")}\n\`\`\`\n`;
    },
  });

  return service;
}
