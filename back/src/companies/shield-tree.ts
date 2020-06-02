import { chain } from "graphql-shield";
import { isAuthenticated, isCompanyAdmin } from "../common/rules";
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
    favorites: isAuthenticated
  },
  Mutation: {
    updateCompany: isCompanyAdmin,
    renewSecurityCode: isCompanyAdmin,
    createCompany: chain(createCompanySchema, isAuthenticated),
    createUploadLink: chain(createUploadLinkSchema, isAuthenticated),
    createTransporterReceipt: chain(
      createTransporterReceiptSchema,
      isAuthenticated
    ),
    updateTransporterReceipt: chain(
      updateTransporterReceiptSchema,
      canUpdateDeleteTransporterReceipt
    ),
    deleteTransporterReceipt: chain(
      deleteTransporterReceiptSchema,
      canUpdateDeleteTransporterReceipt
    ),
    createTraderReceipt: chain(createTraderReceiptSchema, isAuthenticated),
    updateTraderReceipt: chain(
      updateTraderReceiptSchema,
      canUpdateDeleteTraderReceipt
    ),
    deleteTraderReceipt: chain(
      deleteTraderReceiptSchema,
      canUpdateDeleteTraderReceipt
    )
  }
};
