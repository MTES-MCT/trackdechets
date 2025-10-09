import { Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { expandTransporterFromDb } from "../../converter";
import { parseBsvhuTransporterAsync } from "../../validation";
import { graphqlInputToZodBsvhuTransporter } from "../../validation/helpers";

const createBsvhuTransporterResolver: MutationResolvers["createBsvhuTransporter"] =
  async (parent, { input }, context) => {
    checkIsAuthenticated(context);
    const zodTransporter = graphqlInputToZodBsvhuTransporter(input);
    // run validation, sirenify et recipify
    const { id, bsvhuId, createdAt, ...parsed } =
      await parseBsvhuTransporterAsync(zodTransporter);

    const data: Prisma.BsvhuTransporterCreateInput = {
      ...parsed,
      // Set a default number to 0 as long as the transporter is
      // not attached to a specific BSVHU.
      number: 0
    };

    const transporter = await prisma.bsvhuTransporter.create({
      data
    });
    return expandTransporterFromDb(transporter);
  };

export default createBsvhuTransporterResolver;
