import { QueryResolvers } from "../../generated/graphql/types";
import incomingWastes from "./queries/incomingWastes";
import outgoingWastes from "./queries/outgoingWastes";
import transportedWastes from "./queries/transportedWastes";
import managedWastes from "./queries/managedWastes";
import allWastes from "./queries/allWastes";
import wastesRegistryCsv from "./queries/wastesRegistryCsv";
import wastesRegistryXls from "./queries/wastesRegistryXls";

export const Query: QueryResolvers = {
  incomingWastes,
  outgoingWastes,
  transportedWastes,
  managedWastes,
  allWastes,
  wastesRegistryCsv,
  wastesRegistryXls
};
