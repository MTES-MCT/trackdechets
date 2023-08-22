import { Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  expandTransporterFromDb,
  flattenTransporterInput
} from "../../converter";
import { transporterSchemaFn } from "../../validation";

const createFormTransporterResolver: MutationResolvers["createFormTransporter"] =
  async (parent, { input }, context) => {
    checkIsAuthenticated(context);
    const data: Prisma.BsddTransporterCreateInput = {
      ...flattenTransporterInput({ transporter: input }),
      // Set a default number to 0 as long as the transporter is
      // not attached to a specific BSDD.
      number: 0,
      readyToTakeOver: true
    };
    await transporterSchemaFn({}).validate(data, { abortEarly: false });
    const transporter = await prisma.bsddTransporter.create({ data });
    return expandTransporterFromDb(transporter);
  };

export default createFormTransporterResolver;
