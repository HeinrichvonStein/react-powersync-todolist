/**
 * Formats a date string into a consistent datetime format
 * @param dateString ISO date string
 * @returns Formatted date string in "MM/DD/YYYY HH:MM AM/PM" format
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}