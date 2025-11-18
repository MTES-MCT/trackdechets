import { z } from "zod";

import { CompanyDigestStatus } from "@td/prisma";

export const webhookPayloadSchema = z.object({
  distantId: z.string(),
  status: z.enum([CompanyDigestStatus.PROCESSED, CompanyDigestStatus.ERROR])
});
