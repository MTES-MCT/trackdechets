import { Prisma } from "@prisma/client";

import { prisma } from "@td/prisma";

import { siretify } from "../../__tests__/factories";
export const companyDigestFactory = async ({
  opt = {}
}: {
  opt?: Partial<Prisma.CompanyDigestCreateInput>;
}) => {
  return prisma.companyDigest.create({
    data: {
      orgId: siretify(1),
      year: new Date().getFullYear(),

      ...opt
    }
  });
};
