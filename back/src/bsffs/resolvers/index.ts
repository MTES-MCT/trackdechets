import { OPERATION_CODES, OPERATION_QUALIFICATIONS } from "../constants";
import { Query } from "./Query";
import { Mutation } from "./Mutation";
import { Bsff } from "./Bsff";

export default {
  Query,
  Mutation,
  Bsff,
  BsffOperationCode: OPERATION_CODES,
  BsffOperationQualification: OPERATION_QUALIFICATIONS
};
