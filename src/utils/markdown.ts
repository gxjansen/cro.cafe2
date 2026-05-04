/**
 * Simple markdown parser for rendering links in bio text
 * Handles markdown links in the format [text](url)
 */
export function parseMarkdownLinks(text: string): string {
  if (!text) return '';

  // Replace markdown links [text](url) with HTML links
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  return text.replace(linkPattern, (match, linkText, url) => {
    // Ensure the URL is valid and safe
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-300 hover:underline">${linkText}</a>`;
      }
    } catch {
      // If URL parsing fails, try to add protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `<a href="https://${url}" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-300 hover:underline">${linkText}</a>`;
      }
    }
    // Return original text if URL is invalid
    return match;
  });
}

/**
 * Render an episode description that may mix plain text, markdown-style
 * [text](url) links, bare URLs, and inline HTML (e.g. <a>, <ul>, <li>).
 * Returns HTML safe to render with set:html.
 */
export function renderEpisodeDescription(text: string): string {
  if (!text) return '';

  const stash: string[] = [];
  const mask = (match: string) => {
    stash.push(match);
    return `<\x00T${stash.length - 1}\x00>`;
  };

  // 1. Mask existing <a>...</a> blocks so their inner URLs aren't re-linked
  let result = text.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, mask);

  // 2. Convert markdown [text](url) links to <a>, then mask those too
  result = parseMarkdownLinks(result);
  result = result.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, mask);

  // 3. Mask remaining real HTML tags. The "[^>\x00]" class skips placeholders.
  result = result.replace(/<[^>\x00]+>/g, mask);

  // 4. Auto-link bare URLs. "[^\s<]" stops the match at placeholder boundaries.
  result = result.replace(/https?:\/\/[^\s<]+/g, (url) => {
    const m = url.match(/^(.*?)([.,;!?:)\]"']*)$/);
    const clean = (m && m[1]) || url;
    const trail = (m && m[2]) || '';
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-300 hover:underline">${clean}</a>${trail}`;
  });

  // 5. Restore masked tokens
  result = result.replace(/<\x00T(\d+)\x00>/g, (_, i) => stash[parseInt(i, 10)] ?? '');

  return result;
}
