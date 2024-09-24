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
import { createWorkerCertification } from "./mutations/createWorkerCertification";
import { updateWorkerCertification } from "./mutations/updateWorkerCertification";
import { deleteWorkerCertification } from "./mutations/deleteWorkerCertification";
import verifyCompanyByAdmin from "./mutations/verifyCompanyByAdmin";
import sendVerificationCodeLetter from "./mutations/sendVerificationCodeLetter";
import createTestCompany from "./mutations/createTestCompany";
import deleteCompany from "./mutations/deleteCompany";
import createAnonymousCompany from "./mutations/createAnonymousCompany";
import { addSignatureAutomation } from "./mutations/addSignatureAutomation";
import { removeSignatureAutomation } from "./mutations/removeSignatureAutomation";
import createAnonymousCompanyFromPDF from "./mutations/createAnonymousCompanyFromPDF";
import standbyCompanyByAdmin from "./mutations/standbyCompanyByAdmin";
import { bulkUpdateCompaniesProfiles } from "./mutations/bulkUpdateCompaniesProfiles";
import toggleDormantCompany from "./mutations/toggleDormantCompany";
import { createAdministrativeTransfer } from "./mutations/createAdministrativeTransfer";
import { cancelAdministrativeTransfer } from "./mutations/cancelAdministrativeTransfer";
import { submitAdministrativeTransferApproval } from "./mutations/submitAdministrativeTransferApproval";

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
  createWorkerCertification,
  updateWorkerCertification,
  deleteWorkerCertification,
  verifyCompanyByAdmin,
  standbyCompanyByAdmin,
  sendVerificationCodeLetter,
  createTestCompany,
  deleteCompany,
  createAnonymousCompany,
  addSignatureAutomation: addSignatureAutomation as any,
  removeSignatureAutomation: removeSignatureAutomation as any,
  createAnonymousCompanyFromPDF,
  bulkUpdateCompaniesProfiles,
  toggleDormantCompany,
  createAdministrativeTransfer,
  cancelAdministrativeTransfer,
  submitAdministrativeTransferApproval
};

export default Mutation;
