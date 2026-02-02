/**
 * Site-wide configuration
 */

export const siteConfig = {
  title: "WhyNot.Fail",
  description: "Cause when you fail, somebody has to laugh at you",

  // Author information
  author: {
    name: "dzervas",
    // Mastodon handle in the format: username@instance
    mastodon: "dzervas@infosec.exchange",
  },
} as const;

/**
 * Get the full Mastodon profile URL from the handle
 */
export function getMastodonUrl(handle: string): string {
  const [username, instance] = handle.split("@");
  return `https://${instance}/@${username}`;
}
