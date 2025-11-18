import { prisma } from "@td/prisma";

import { webhookPayloadSchema } from "../companydigest/validation";

import { CompanyDigestStatus } from "@td/prisma";

const { GERICO_WEBHOOK_TOKEN } = process.env;

export const gericoWebhookHandler = async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(403).send("Forbidden");
  }

  const token = authorization.split(" ")[1];

  if (!token || token !== GERICO_WEBHOOK_TOKEN) {
    return res.status(403).send("Forbidden");
  }

  const { distantId, status } = webhookPayloadSchema.parse(req.body);

  const companyDigest = await prisma.companyDigest.findFirst({
    where: {
      distantId: distantId,
      state: {
        notIn: [CompanyDigestStatus.PROCESSED, CompanyDigestStatus.ERROR]
      }
    }
  });

  if (!companyDigest) {
    return res.status(404).send("Not found");
  }
  await prisma.companyDigest.update({
    where: { id: companyDigest.id },
    data: { state: status }
  });
  res.send("ok");
};
