import { Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { graphqlInputToZodBsffTransporter } from "../../validation/bsff/helpers";
import { parseBsffTransporterAsync } from "../../validation/bsff";
import { expandBsffTransporterFromDb } from "../../converter";

const createBsffTransporterResolver: MutationResolvers["createBsffTransporter"] =
  async (parent, { input }, context) => {
    checkIsAuthenticated(context);
    const zodTransporter = graphqlInputToZodBsffTransporter(input);
    // run validation, sirenify et recipify
    const { id, bsffId, ...parsed } = await parseBsffTransporterAsync(
      zodTransporter
    );

    const data: Prisma.BsffTransporterCreateInput = {
      ...parsed,
      // Set a default number to 0 as long as the transporter is
      // not attached to a specific BSFF.
      number: 0
    };

    const transporter = await prisma.bsffTransporter.create({
      data
    });
    return expandBsffTransporterFromDb(transporter);
  };

export default createBsffTransporterResolver;
