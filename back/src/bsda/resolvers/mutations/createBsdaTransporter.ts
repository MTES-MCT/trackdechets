import { Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { expandTransporterFromDb } from "../../converter";
import { parseBsdaTransporterAsync } from "../../validation";
import { graphqlInputToZodBsdaTransporter } from "../../validation/helpers";
import { checkHasSomePermission, Permission } from "../../../permissions";

const createBsdaTransporterResolver: MutationResolvers["createBsdaTransporter"] =
  async (parent, { input }, context) => {
    const user = checkIsAuthenticated(context);

    await checkHasSomePermission(user, [
      Permission.BsdCanCreate,
      Permission.BsdCanUpdate
    ]);

    const zodTransporter = graphqlInputToZodBsdaTransporter(input);
    // run validation, sirenify et recipify
    const { id, bsdaId, ...parsed } = await parseBsdaTransporterAsync(
      zodTransporter
    );

    const data: Prisma.BsdaTransporterCreateInput = {
      ...parsed,
      // Set a default number to 0 as long as the transporter is
      // not attached to a specific BSDA.
      number: 0
    };

    const transporter = await prisma.bsdaTransporter.create({
      data
    });
    return expandTransporterFromDb(transporter);
  };

export default createBsdaTransporterResolver;
