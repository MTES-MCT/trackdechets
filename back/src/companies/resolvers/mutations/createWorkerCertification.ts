import * as yup from "yup";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { MutationCreateWorkerCertificationArgs } from "@td/codegen-back";
import configureYup from "../../../common/yup/configureYup";

configureYup();

export async function createWorkerCertification(
  _,
  { input }: MutationCreateWorkerCertificationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  await workerCertificationSchema.validate(input);
  return prisma.workerCertification.create({ data: input });
}

export const workerCertificationSchema = yup.object({
  hasSubSectionFour: yup.boolean().nullable(),
  hasSubSectionThree: yup.boolean().nullable(),
  certificationNumber: yup.string().when("hasSubSectionThree", {
    is: true,
    then: schema => schema.required(),
    otherwise: schema => schema.nullable()
  }),
  validityLimit: yup.date().when("hasSubSectionThree", {
    is: true,
    then: schema => schema.required(),
    otherwise: schema => schema.nullable()
  }),
  organisation: yup
    .string()
    .label("L'organisme")
    .oneOf([
      "AFNOR Certification",
      "GLOBAL CERTIFICATION",
      "QUALIBAT",
      "",
      null
    ])
    .when("hasSubSectionThree", {
      is: true,
      then: schema => schema.required(),
      otherwise: schema => schema.nullable()
    })
});
