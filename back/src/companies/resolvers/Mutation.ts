import { MutationResolvers } from "../../generated/graphql/types";
import createCompany from "./mutations/createCompany";
import renewSecurityCode from "./mutations/renewSecurityCode";
import updateCompany from "./mutations/updateCompany";
import createTraderReceipt from "./mutations/createTraderReceipt";
import updateTraderReceipt from "./mutations/updateTraderReceipt";
import deleteTraderReceipt from "./mutations/deleteTraderReceipt";
import createBrokerReceipt from "./mutations/createBrokerReceipt";
import updateBrokerReceipt from "./mutations/updateBrokerReceipt";
import deleteBrokerReceipt from "./mutations/deleteBrokerReceipt";
import createTransporterReceipt from "./mutations/createTransporterReceipt";
import updateTransporterReceipt from "./mutations/updateTransporterReceipt";
import deleteTransporterReceipt from "./mutations/deleteTransporterReceipt";
import verifyCompany from "./mutations/verifyCompany";
import createVhuAgrement from "./mutations/createVhuAgrement";
import updateVhuAgrement from "./mutations/updateVhuAgrement";
import deleteVhuAgrement from "./mutations/deleteVhuAgrement";
import verifyCompanyByAdmin from "./mutations/verifyCompanyByAdmin";
import sendVerificationCodeLetter from "./mutations/sendVerificationCodeLetter";
import createTestCompany from "./mutations/createTestCompany";

const Mutation: MutationResolvers = {
  createCompany,
  renewSecurityCode,
  updateCompany,
  createTraderReceipt,
  updateTraderReceipt,
  deleteTraderReceipt,
  createBrokerReceipt,
  updateBrokerReceipt,
  deleteBrokerReceipt,
  createTransporterReceipt,
  updateTransporterReceipt,
  deleteTransporterReceipt,
  verifyCompany,
  createVhuAgrement,
  updateVhuAgrement,
  deleteVhuAgrement,
  verifyCompanyByAdmin,
  sendVerificationCodeLetter,
  createTestCompany
};

export default Mutation;
