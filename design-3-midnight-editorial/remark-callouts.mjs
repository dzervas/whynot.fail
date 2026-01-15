import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = new Map([
  ['NOTE', 'note'],
  ['INFO', 'info'],
  ['WARNING', 'warning'],
  ['DANGER', 'danger'],
]);

/**
 * Remark plugin to transform GitHub-style callouts.
 * Converts blockquotes starting with [!NOTE] into styled callouts.
 */
export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const firstChild = node.children?.[0];
      if (!firstChild || firstChild.type !== 'paragraph') return;

      const firstText = firstChild.children?.[0];
      if (!firstText || firstText.type !== 'text') return;

      const match = firstText.value.match(/^\[!(NOTE|INFO|WARNING|DANGER)\]\s*/);
      if (!match) return;

      const typeKey = match[1];
      const calloutType = CALLOUT_TYPES.get(typeKey);
      if (!calloutType) return;

      // Remove the [!TYPE] marker from the text
      firstText.value = firstText.value.replace(match[0], '');

      // Attach HTML properties for styling
      node.data ??= {};
      node.data.hProperties ??= {};
      node.data.hProperties['data-callout'] = calloutType;
      node.data.hProperties['class'] = `callout callout-${calloutType}`;
    });
  };
}
