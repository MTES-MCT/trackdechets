import { z } from "zod";

const booleanString = z
  .string()
  .optional()
  .transform(val => val === "true");

const stringArray = z
  .string()
  .optional()
  .transform(val =>
    val
      ? val
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      : []
  );

// Helper to handle DEV/PROD which can be booleans (from Vite) or strings (from process.env in tests)
const devProdBoolean = z.union([z.boolean(), z.string()]).transform(val => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "true";
  return false;
});

export const envConfig = z
  .object({
    NODE_ENV: z.string().optional(),
    DEV: devProdBoolean,
    PROD: devProdBoolean,
    VITE_API_ENDPOINT: z.string(),
    VITE_NOTIFIER_ENDPOINT: z.string().optional(),
    VITE_WARNING_MESSAGE: z.string().optional(),
    VITE_DOWNTIME_MESSAGE: z.string().optional(),
    VITE_SENTRY_DSN: z.string().optional(),
    VITE_SENTRY_USE_TUNNEL: booleanString,
    VITE_SENTRY_ENV_NAME: z.string().optional(),
    VITE_ALLOW_TEST_COMPANY: booleanString,
    VITE_DISABLE_SIRENE_PDF_UPLOAD: booleanString,
    VITE_VERIFY_COMPANY: booleanString,
    VITE_ALLOW_CLONING_BSDS: booleanString,
    VITE_OVERRIDE_V20241201: z.string().optional(),
    VITE_CONTACT_EMAIL: z
      .string()
      .optional()
      .default("contact@trackdechets.beta.gouv.fr"),
    VITE_SENDER_EMAIL: z
      .string()
      .optional()
      .default("info@trackdechets.beta.gouv.fr"),
    VITE_DEVELOPERS_DOCUMENTATION_URL: z
      .string()
      .optional()
      .default("https://developers.trackdechets.beta.gouv.fr"),
    VITE_MATOMO_TRACKER_SITE_ID: z.string().optional(),
    VITE_MATOMO_TRACKER_URL: z.string().optional(),
    VITE_REGISTRY_EXPORT_ISSUE_NOTICE: z.string().optional(),
    VITE_NO_DATE_LIMIT_SIRETS: stringArray,
    VITE_ENV_NAME: z.string().optional()
  })
  .parse(import.meta.env);
