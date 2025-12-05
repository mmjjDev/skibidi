/**
 * Format date to Polish locale
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw'
  });
}

/**
 * Format points with thousands separator
 * @param {number} points - Number of points
 * @returns {string} Formatted points string
 */
export function formatPoints(points) {
  return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format odds
 * @param {number} odds - Odds value
 * @returns {string} Formatted odds
 */
export function formatOdds(odds) {
  return odds.toFixed(2);
}

/**
 * Create error embed
 * @param {string} message - Error message
 * @returns {object} Embed object
 */
export function createErrorEmbed(message) {
  return {
    color: 0xFF0000,
    title: '❌ Błąd',
    description: message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create success embed
 * @param {string} message - Success message
 * @returns {object} Embed object
 */
export function createSuccessEmbed(message) {
  return {
    color: 0x00FF00,
    title: '✅ Sukces',
    description: message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 100) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export default {
  formatDate,
  formatPoints,
  formatOdds,
  createErrorEmbed,
  createSuccessEmbed,
  truncate
};
