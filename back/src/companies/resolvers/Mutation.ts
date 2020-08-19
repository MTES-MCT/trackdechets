import { MutationResolvers } from "../../generated/graphql/types";
import createCompany from "./mutations/createCompany";
import renewSecurityCode from "./mutations/renewSecurityCode";
import updateCompany from "./mutations/updateCompany";
import createUploadLink from "./mutations/createUploadLink";
import createTraderReceipt from "./mutations/createTraderReceipt";
import updateTraderReceipt from "./mutations/updateTraderReceipt";
import deleteTraderReceipt from "./mutations/deleteTraderReceipt";
import createTransporterReceipt from "./mutations/createTransporterReceipt";
import updateTransporterReceipt from "./mutations/updateTransporterReceipt";
import deleteTransporterReceipt from "./mutations/deleteTransporterReceipt";

const Mutation: MutationResolvers = {
  createCompany,
  renewSecurityCode,
  updateCompany,
  createUploadLink,
  createTraderReceipt,
  updateTraderReceipt,
  deleteTraderReceipt,
  createTransporterReceipt,
  updateTransporterReceipt,
  deleteTransporterReceipt
};

export default Mutation;
