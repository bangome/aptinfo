/**
 * Apartment-related utility functions
 */

/**
 * Formats a price in Korean won to a readable format
 * @param price - Price in won
 * @returns Formatted price string (e.g., "5.5억", "3000만")
 */
export function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(1)}억`;
  }
  return `${(price / 10000).toFixed(0)}만`;
}

/**
 * Formats area in square meters to a readable format
 * @param area - Area in square meters
 * @returns Formatted area string (e.g., "84.3㎡")
 */
export function formatArea(area: number): string {
  return `${area.toFixed(1)}㎡`;
}

/**
 * Formats a number to Korean locale string with commas
 * @param num - Number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * Formats building year to a readable format
 * @param year - Building year
 * @returns Formatted year string (e.g., "2020년")
 */
export function formatBuildYear(year: number): string {
  return `${year}년`;
}

/**
 * Formats maintenance fee to a readable format
 * @param fee - Monthly maintenance fee in won
 * @returns Formatted fee string (e.g., "150,000원/월")
 */
export function formatMaintenanceFee(fee: number): string {
  return `${formatNumber(fee)}원/월`;
}