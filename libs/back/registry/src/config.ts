import { z } from "zod";

export const envConfig = z
  .object({
    S3_ENDPOINT: z.string(),
    S3_REGION: z.string(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_REGISTRY_ERRORS_BUCKET: z.string(),
    S3_REGISTRY_IMPORTS_BUCKET: z.string(),
    S3_REGISTRY_MODELS_BUCKET: z.string(),
    NO_DATE_LIMIT_SIRETS: z
      .string()
      .optional()
      .transform(val =>
        val
          ? val
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
          : []
      )
  })
  .parse(process.env);
