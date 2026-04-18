/**
 * Formats a date string or object into dd/mm/yyyy format.
 * @param {Date|string|number} date 
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  // Using 'en-GB' for dd/mm/yyyy format
  return d.toLocaleDateString('en-GB');
}
