import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date object or string into a localized string
 * @param date Date object or date string
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | undefined, options: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}): string {
  if (!date) return "Not available";
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return "Invalid date";
  
  return dateObj.toLocaleDateString('en-GB', options);
}

/**
 * Format a number as a currency string
 * @param amount Number to format
 * @param currency Currency code (default: GBP)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes Size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length (default: 50)
 * @returns Truncated string
 */
export function truncateText(str: string, maxLength = 50): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}