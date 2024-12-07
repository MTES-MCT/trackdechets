import { Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { expandTransporterFromDb } from "../../converter";
import { parseBsdaTransporterAsync } from "../../validation";
import { graphqlInputToZodBsdaTransporter } from "../../validation/helpers";

const createBsdaTransporterResolver: MutationResolvers["createBsdaTransporter"] =
  async (parent, { input }, context) => {
    checkIsAuthenticated(context);
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
