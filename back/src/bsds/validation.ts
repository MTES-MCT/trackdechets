import * as yup from "yup";
import type { BsdWhere } from "@td/codegen-back";
import { GET_BSDS_ACTOR_MAX_LENGTH } from "@td/constants";
import { z } from "@td/validation";

const maxLengthString = (maxLength: number) =>
  yup
    .string()
    .max(
      maxLength,
      `La longueur maximale de ce paramètre de recherche est de ${maxLength} caractères`
    );

export const bsdSearchSchema: yup.SchemaOf<
  Pick<
    BsdWhere,
    | "isArchivedFor"
    | "isCollectedFor"
    | "isDraftFor"
    | "isFollowFor"
    | "isForActionFor"
    | "isToCollectFor"
    | "isReturnFor"
  >
> = yup.object({
  isArchivedFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any,
  isCollectedFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any,
  isDraftFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any,
  isFollowFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any,
  isForActionFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any,
  isToCollectFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any,
  isReturnFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any
});

export const controlBsdSearchSchema = z
  .object({
    siret: z.string().min(14).max(18).optional(),
    plate: z.string().min(6).max(12).optional(),
    readableId: z.string().min(20).max(25).optional()
  })
  .superRefine((val, ctx) => {
    if (val.readableId && (val.siret || val.plate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["readableId"],
        message: `Vous ne pouvez utiliser readableId avec d'autres paramètres de recherche`
      });
    }

    if (![val.readableId, val.siret, val.plate].some(Boolean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,

        message: `Vous devez passer au moins un paramètre de recherche`
      });
    }
  });
