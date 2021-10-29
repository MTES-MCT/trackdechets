import prisma from "../../../prisma";
import * as yup from "yup";
import { Prisma, Form } from "@prisma/client";
import { WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationCreateBsddReviewArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import { checkCanReview } from "../../permissions";
import { INVALID_SIRET_LENGTH, INVALID_WASTE_CODE } from "../../validation";
import { getUserCompanies } from "../../../users/database";
import { flattenFormInput } from "../../form-converter";

const reviewSchema = yup
  .object({
    recipientCap: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .oneOf([...WASTES_CODES, "", null], INVALID_WASTE_CODE),
    wasteDetailsOnuCode: yup.string().nullable(),
    wasteDetailsPop: yup.boolean().nullable(),
    quantityReceived: yup.number().nullable(),
    brokerCompanyName: yup.string().nullable(),
    brokerCompanySiret: yup
      .string()
      .nullable()
      .matches(/^$|^\d{14}$/, {
        message: `Transporteur: ${INVALID_SIRET_LENGTH}`
      }),
    brokerCompanyAddress: yup.string().nullable(),
    brokerCompanyContact: yup.string().nullable(),
    brokerCompanyPhone: yup.string().nullable(),
    brokerCompanyMail: yup.string().email().nullable(),
    brokerReceipt: yup.string().nullable(),
    brokerDepartment: yup.string().nullable(),
    brokerValidityLimit: yup.date().nullable(),
    traderCompanyAddress: yup.string().nullable(),
    traderCompanyContact: yup.string().nullable(),
    traderCompanyPhone: yup.string().nullable(),
    traderCompanyMail: yup.string().email().nullable(),
    traderReceipt: yup.string().nullable(),
    traderDepartment: yup.string().nullable(),
    traderValidityLimit: yup.date().nullable()
  })
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis ne sont pas modifiables"
  );

export default async function createReview(
  _,
  { bsddId, input }: MutationCreateBsddReviewArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsdd = await getFormOrFormNotFound({ id: bsddId });
  await checkCanReview(user, existingBsdd);

  const revisionContent = flattenFormInput(input);
  await reviewSchema.validate(revisionContent);

  const { fromCompany, toCompany } = await getReviewActors(
    user.id,
    existingBsdd
  );

  return prisma.bsddReview.create({
    data: {
      bsdd: { connect: { id: existingBsdd.id } },
      content: JSON.parse(JSON.stringify(revisionContent)),
      fromCompany,
      toCompany
    }
  });
}

async function getReviewActors(
  userId: string,
  bsdd: Form
): Promise<Pick<Prisma.BsddReviewCreateInput, "fromCompany" | "toCompany">> {
  const userCompanies = await getUserCompanies(userId);
  const { emitterCompanySiret, recipientCompanySiret } = bsdd;

  const isEmitter = userCompanies
    .map(company => company.siret)
    .includes(emitterCompanySiret);

  return {
    fromCompany: {
      connect: {
        siret: isEmitter ? emitterCompanySiret : recipientCompanySiret
      }
    },
    toCompany: {
      connect: {
        siret: isEmitter ? recipientCompanySiret : emitterCompanySiret
      }
    }
  };
}
