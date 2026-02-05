/**
 * UI Utility Module
 * Provides UI-related helper functions
 */
export const UIUtil = {
  /**
   * Convert URLs in text to clickable links
   * @param {string} text - Text containing URLs
   * @returns {string} HTML string with clickable links
   */
  linkify(text) {
    if (!text) return '';

    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

    return text.replace(urlPattern, (url) => {
      const href = url.startsWith('http') ? url : `http://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;">${url}</a>`;
    });
  }
};
