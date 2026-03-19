/**
 * Format number as INR currency (e.g. ₹14,999)
 */
export function formatInr(num) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}
