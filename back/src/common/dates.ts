/**
 * String formats allowed as date values in GraphQL API
 * Note that we may accept all ISO 8601 formats but only
 * those ones are tested
 */
export const allowedFormats = [
  "yyyy-MM-dd",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm:ssX",
  "yyyy-MM-dd'T'HH:mm:ss.SSS",
  "yyyy-MM-dd'T'HH:mm:ss.SSSX"
];
