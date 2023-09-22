import { z } from "zod";

export const envVariables = z
  .object({
    // Node
    TZ: z.string({
      required_error:
        "Please explicitly set the `TZ` env variable to `Europe/Paris`."
    }),
    NODE_ENV: z.enum(["test", "production", "dev", "development"]),
    // -------
    // Dbs
    REDIS_URL: z.string(),
    MONGO_URL: z.string(),
    DATABASE_URL: z.string(),
    PRISMA_TRANSACTION_TIMEOUT: z
      .string()
      .optional()
      .default("5000")
      .refine(isNumber),
    ELASTICSEARCH_BSDS_ALIAS_NAME: z.string().optional().default("bsds"),
    ELASTIC_SEARCH_URL: z.string(),
    // -------
    // Secrets & sessions
    API_TOKEN_SECRET: z.string(),
    SESSION_SECRET: z.string(),
    SESSION_COOKIE_HOST: z.string(),
    SESSION_COOKIE_SECURE: z.string(),
    SESSION_NAME: z.string(),
    UI_HOST: z.string(),
    UI_URL_SCHEME: z.string(),
    API_HOST: z.string(),
    API_PORT: z.string().optional().default("80").refine(isNumber),
    OIDC_PRIVATE_KEY: z.string(),
    // -------
    // Various
    USERS_BLACKLIST: z.string().optional(),
    MAX_REQUESTS_PER_WINDOW: z.string().optional().default("1000"),
    STARTUP_FILE: z.string().optional(),
    TRUST_PROXY_HOPS: z.string().optional().default("1").refine(isNumber),
    CRON_ONBOARDING_SCHEDULE: z.string().optional(),
    LOG_TO_HTTP: z.string().optional().default("false").refine(isBoolean),
    FORCE_LOGGER_CONSOLE: z
      .string()
      .optional()
      .default("false")
      .refine(isBoolean),
    JEST_WORKER_ID: z.string().optional(),
    // -------
    // Bulk index
    BULK_INDEX_BATCH_SIZE: z
      .string()
      .optional()
      .default("100")
      .refine(isNumber),
    BULK_INDEX_BATCH_ADD: z.string().optional().default("5").refine(isNumber),
    BULK_INDEX_JOB_CONCURRENCY: z
      .string()
      .optional()
      .default("1")
      .refine(isNumber),
    BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING: z.string(),
    BULK_INDEX_SCALINGO_CONTAINER_NAME: z.string(),
    BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP: z.string(),
    BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN: z.string(),
    BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP: z
      .string()
      .default("4")
      .refine(isNumber),
    BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN: z
      .string()
      .default("1")
      .refine(isNumber),
    // -------
    // Scalingo
    SCALINGO_API_URL: z.string(),
    SCALINGO_APP_NAME: z.string(),
    SCALINGO_TOKEN: z.string(),
    SCALINGO_CERT: z.string(),
    CONTAINER: z.string(),
    // -------
    // Sentry
    SENTRY_DSN: z.string().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    // -------
    // Gotenberg
    GOTENBERG_URL: z.string(),
    GOTENBERG_TOKEN: z.string(),
    // -------
    // Mail
    MY_SENDING_BOX_API_KEY: z.string().optional(),
    EMAIL_BACKEND: z.enum(["console", "sendinblue"]),
    SENDER_EMAIL_ADDRESS: z.string(),
    SENDER_NAME: z.string(),
    SIB_APIKEY: z.string().optional(),
    SIB_BASE_URL: z.string().optional(),
    // -------
    // Template ids
    MAIN_TEMPLATE_ID: z.string(),
    PROFESIONAL_SECOND_ONBOARDING_TEMPLATE_ID: z.string(),
    FIRST_ONBOARDING_TEMPLATE_ID: z.string(),
    PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID: z.string(),
    VERIFIED_FOREIGN_TRANSPORTER_COMPANY_TEMPLATE_ID: z.string(),
    // -------
    // Webhooks
    WEBHOOK_TOKEN_ENCRYPTION_KEY: z.string(),
    WEBHOOK_FAIL_ACCEPTED: z.string().optional().default("5").refine(isNumber),
    WEBHOOK_FAIL_RESET_DELAY: z
      .string()
      .optional()
      .default("600")
      .refine(isNumber),
    // Companies
    SIRENIFY_BYPASS_USER_EMAILS: z.string().optional(),
    TD_COMPANY_ELASTICSEARCH_INDEX: z.string(),
    TD_COMPANY_ELASTICSEARCH_CACERT: z.string().optional(),
    TD_COMPANY_ELASTICSEARCH_IGNORE_SSL: z
      .string()
      .optional()
      .refine(isBoolean),
    VERIFY_COMPANY: z.string().refine(isBoolean),
    ALLOW_TEST_COMPANY: z.string().refine(isBoolean),
    INSEE_SECRET: z.string(),
    // -------
    // Datadog
    DD_ENV: z.string(),
    DD_API_KEY: z.string(),
    DD_APP_NAME: z.string().optional(),
    // -------
    // S3
    S3_ENDPOINT: z.string(),
    S3_REGION: z.string(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_BUCKET: z.string(),
    // -------
    // Queues
    QUEUE_MONITOR_TOKEN: z.string().optional(),
    QUEUE_NAME_COMPANY: z.string().optional(),
    QUEUE_NAME_SENDMAIL: z.string(),
    QUEUE_MAXRATE_SENDMAIL: z.string().default("16").refine(isNumber),
    // -------
    // Form config
    BSDD_MAX_APPENDIX2: z.string().optional().default("250").refine(isNumber),
    NOTIFY_DREAL_WHEN_FORM_DECLINED: z
      .string()
      .optional()
      .default("false")
      .refine(isBoolean),
    MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER: z.string().datetime().optional()
  })
  .superRefine((val, ctx) => {
    if (val.SENTRY_DSN && !val.SENTRY_ENVIRONMENT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `You must provide a Sentry environment when a Sentry DSN is provided.`
      });
    }

    if (
      val.EMAIL_BACKEND === "sendinblue" &&
      (!val.SIB_APIKEY || !val.SIB_BASE_URL)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `When SIB is set as backend, you must set SIB_APIKEY and SIB_BASE_URL.`
      });
    }
  });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

function isBoolean(value: string) {
  return value === "true" || value === "false";
}

function isNumber(value: string) {
  return !isNaN(+value);
}
