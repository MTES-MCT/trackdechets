import { Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  expandTransporterFromDb,
  flattenTransporterInput
} from "../../converter";
import { transporterSchemaFn } from "../../validation";
import { sirenifyTransporterInput } from "../../sirenify";
import { recipifyTransporterInput } from "../../recipify";

const createFormTransporterResolver: MutationResolvers["createFormTransporter"] =
  async (parent, { input }, context) => {
    const user = checkIsAuthenticated(context);

    const sirenifiedInput = await sirenifyTransporterInput(input, user);
    const recipifiedInput = await recipifyTransporterInput(sirenifiedInput);

    const data: Prisma.BsddTransporterCreateInput = {
      ...flattenTransporterInput({ transporter: recipifiedInput }),
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
