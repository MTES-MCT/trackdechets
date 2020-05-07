import { chain } from "graphql-shield";
import { isAuthenticated, isCompanyAdmin } from "../common/rules";
import { createCompanySchema, createUploadLinkSchema } from "./rules/schema";

export default {
  Query: {
    favorites: isAuthenticated
  },
  Mutation: {
    updateCompany: isCompanyAdmin,
    renewSecurityCode: isCompanyAdmin,
    createCompany: chain(createCompanySchema, isAuthenticated),
    createUploadLink: chain(createUploadLinkSchema, isAuthenticated)
  }
};
