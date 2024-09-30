import * as yup from "yup";
import { BsdWhere } from "../generated/graphql/types";
import { GET_BSDS_ACTOR_MAX_LENGTH } from "@td/constants";

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
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()) as any
});
