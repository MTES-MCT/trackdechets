import * as yup from "yup";
import { BsdWhere, BsdType } from "../generated/graphql/types";
import {
  GET_BSDS_ACTOR_MAX_LENGTH,
  GET_BSDS_READABLE_ID_MAX_LENGTH,
  GET_BSDS_PLATES_MAX_LENGTH,
  GET_BSDS_CUSTOM_INFO_MAX_LENGTH,
  GET_BSDS_WASTE_MAX_LENGTH
} from "../common/constants/GET_BSDS_CONSTANTS";

const bsdTypes: BsdType[] = ["BSDD", "BSDA", "BSDASRI", "BSVHU", "BSFF"];

const maxLengthString = (maxLength: number) =>
  yup
    .string()
    .max(
      maxLength,
      `La Longueur maximale de ce paramètre de recherche est de ${maxLength} caractères`
    );

export const bsdSearchSchema: yup.SchemaOf<BsdWhere> = yup.object({
  emitter: maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH),
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
    .of(maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH).required()),
  readableId: maxLengthString(GET_BSDS_READABLE_ID_MAX_LENGTH),
  recipient: maxLengthString(GET_BSDS_ACTOR_MAX_LENGTH),
  transporterCustomInfo: maxLengthString(GET_BSDS_CUSTOM_INFO_MAX_LENGTH),
  transporterNumberPlate: maxLengthString(GET_BSDS_PLATES_MAX_LENGTH),
  types: yup.array(yup.mixed().oneOf(bsdTypes)),
  waste: maxLengthString(GET_BSDS_WASTE_MAX_LENGTH)
});
