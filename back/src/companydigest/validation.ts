import { z } from "zod";

import { CompanyDigestStatus } from "@prisma/client";

export const webhookPayloadSchema = z.object({
  distantId: z.string(),
  status: z.enum([CompanyDigestStatus.PROCESSED, CompanyDigestStatus.ERROR])
});
