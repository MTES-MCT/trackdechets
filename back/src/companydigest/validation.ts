import { z } from "@td/validation";

import { CompanyDigestStatus } from "@prisma/client";

export const webhookPayloadSchema = z.object({
  distantId: z.string(),
  status: z.enum([CompanyDigestStatus.PROCESSED, CompanyDigestStatus.ERROR])
});
