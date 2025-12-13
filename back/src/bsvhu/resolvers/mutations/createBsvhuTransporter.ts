import { Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { expandTransporterFromDb } from "../../converter";
import { parseBsvhuTransporterAsync } from "../../validation";
import { graphqlInputToZodBsvhuTransporter } from "../../validation/helpers";
import { checkHasSomePermission, Permission } from "../../../permissions";

const createBsvhuTransporterResolver: MutationResolvers["createBsvhuTransporter"] =
  async (parent, { input }, context) => {
    const user = checkIsAuthenticated(context);
    await checkHasSomePermission(user, [
      Permission.BsdCanCreate,
      Permission.BsdCanUpdate
    ]);
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
