import { RegistryExportResolvers } from "../../generated/graphql/types";

export const RegistryExport: RegistryExportResolvers = {
  registryType: parent => parent.registryType ?? "ALL",
  declarationType: parent => parent.declarationType ?? "ALL"
};
