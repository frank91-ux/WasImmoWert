/**
 * Input sanitization utilities using DOMPurify
 * Protects against XSS attacks in user inputs
 */
import DOMPurify from 'dompurify'

/**
 * Sanitize a plain text string (removes all HTML/script).
 * Use for: project names, addresses, notes.
 */
export function sanitizeText(input: string): string {
  // DOMPurify strips HTML tags; ALLOWED_TAGS: [] means no tags allowed
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim()
}

/**
 * Sanitize a string that may contain basic formatting.
 * Allows bold, italic, links only.
 * Use for: descriptions, notes with formatting.
 */
export function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

/**
 * Sanitize and validate a numeric string input.
 * Returns the cleaned number or NaN.
 */
export function sanitizeNumber(input: string | number): number {
  if (typeof input === 'number') return isFinite(input) ? input : 0
  // Remove everything except digits, dots, commas, minus
  const cleaned = String(input).replace(/[^\d.,-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isFinite(num) ? num : 0
}

/**
 * Sanitize an email address.
 */
export function sanitizeEmail(input: string): string {
  return sanitizeText(input).toLowerCase().trim()
}

/**
 * Sanitize URL parameters to prevent injection.
 */
export function sanitizeUrlParam(input: string): string {
  return encodeURIComponent(sanitizeText(input))
}
