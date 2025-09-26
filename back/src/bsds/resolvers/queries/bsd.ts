import { prisma } from "@td/prisma";
import { AuthType, applyAuthStrategies } from "../../../auth/auth";
import { checkIsAdmin } from "../../../common/permissions";
import type { QueryBsdArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandBsdasriFromDB } from "../../../bsdasris/converter";
import { expandBsdaFromDb } from "../../../bsda/converter";
import { expandBsffFromDB } from "../../../bsffs/converter";
import { expandBspaohFromDb } from "../../../bspaoh/converter";
import { expandFormFromDb } from "../../../forms/converter";
import { expandVhuFormFromDb } from "../../../bsvhu/converter";
import { BsvhuWithTransportersInclude } from "../../../bsvhu/types";
import { BsdaWithTransportersInclude } from "../../../bsda/types";
import { BsffWithTransportersInclude } from "../../../bsffs/types";

export async function bsdResolver(
  _,
  { id }: QueryBsdArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  if (id.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUniqueOrThrow({
      where: { id },
      include: BsdaWithTransportersInclude
    });
    return expandBsdaFromDb(bsda);
  }

  if (id.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id }
    });
    return expandBsdasriFromDB(bsdasri);
  }

  if (id.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id },
      include: BsffWithTransportersInclude
    });
    return expandBsffFromDB(bsff);
  }

  if (id.startsWith("VHU-")) {
    const bsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id },
      include: BsvhuWithTransportersInclude
    });
    return expandVhuFormFromDb(bsvhu);
  }

  if (id.startsWith("PAOH-")) {
    const bspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id },
      include: { transporters: true }
    });
    return expandBspaohFromDb(bspaoh);
  }

  if (id.startsWith("BSD-") || id.startsWith("TD-")) {
    const form = await prisma.form.findUniqueOrThrow({
      where: { readableId: id },
      include: {
        forwardedIn: { include: { transporters: true } },
        transporters: true,
        grouping: {
          include: {
            initialForm: true
          }
        },
        intermediaries: true
      }
    });
    return expandFormFromDb(form);
  }

  throw new Error("Invalid BSD id");
}
