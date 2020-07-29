import { chain } from "graphql-shield";
import { isCompanyAdmin, isAuthenticatedFromUI } from "../common/rules";
import {
  createCompanySchema,
  createUploadLinkSchema,
  createTransporterReceiptSchema,
  createTraderReceiptSchema,
  updateTransporterReceiptSchema,
  updateTraderReceiptSchema,
  deleteTransporterReceiptSchema,
  deleteTraderReceiptSchema
} from "./rules/schema";
import {
  canUpdateDeleteTransporterReceipt,
  canUpdateDeleteTraderReceipt
} from "./rules/permissions";

export default {
  Query: {
    favorites: isAuthenticatedFromUI
  },
  Mutation: {
    updateCompany: chain(isAuthenticatedFromUI, isCompanyAdmin),
    renewSecurityCode: chain(isAuthenticatedFromUI, isCompanyAdmin),
    createCompany: chain(createCompanySchema, isAuthenticatedFromUI),
    createUploadLink: chain(createUploadLinkSchema, isAuthenticatedFromUI),
    createTransporterReceipt: chain(
      createTransporterReceiptSchema,
      isAuthenticatedFromUI
    ),
    updateTransporterReceipt: chain(
      updateTransporterReceiptSchema,
      isAuthenticatedFromUI,
      canUpdateDeleteTransporterReceipt
    ),
    deleteTransporterReceipt: chain(
      deleteTransporterReceiptSchema,
      isAuthenticatedFromUI,
      canUpdateDeleteTransporterReceipt
    ),
    createTraderReceipt: chain(
      createTraderReceiptSchema,
      isAuthenticatedFromUI
    ),
    updateTraderReceipt: chain(
      updateTraderReceiptSchema,
      isAuthenticatedFromUI,
      canUpdateDeleteTraderReceipt
    ),
    deleteTraderReceipt: chain(
      deleteTraderReceiptSchema,
      isAuthenticatedFromUI,
      canUpdateDeleteTraderReceipt
    )
  }
};
