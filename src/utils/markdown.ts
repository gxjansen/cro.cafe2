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