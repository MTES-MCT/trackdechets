import * as yup from "yup";
import { BsdWhere } from "../generated/graphql/types";
import { GET_BSDS_ACTOR_MAX_LENGTH } from "../common/constants/GET_BSDS_CONSTANTS";

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
  >
> = yup.object({
  isArchivedFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()),
  isCollectedFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()),
  isDraftFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()),
  isFollowFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()),
  isForActionFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()),
  isToCollectFor: yup
    .array()
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required())
});
