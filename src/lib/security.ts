import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an input string to prevent XSS attacks.
 * @param input The raw input string.
 * @returns The sanitized string.
 */
export const sanitize = (input: string): string => {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML allowed in standard inputs
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitizes an object by recursively sanitizing all its string properties.
 * @param obj The object to sanitize.
 * @returns A new object with sanitized string properties.
 */
export const sanitizeObject = <T extends object>(obj: T): T => {
  const result = { ...obj } as any;
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = sanitize(result[key]);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizeObject(result[key]);
    }
  }
  return result;
};
